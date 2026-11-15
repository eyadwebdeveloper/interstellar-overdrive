/**
 * AURA Copilot — serverless endpoint (Vercel).
 *
 *   GET  /api/copilot  -> { configured: boolean }   (lets the UI show "Live" or "On-device")
 *   POST /api/copilot  -> streams plain text from Claude, grounded on the context the app sends
 *
 * Set ANTHROPIC_API_KEY in the host's environment. The key never reaches the browser.
 * Optional: ANTHROPIC_MODEL (default claude-sonnet-5-5), COPILOT_ALLOWED_ORIGIN.
 * Without a key this endpoint reports configured:false and the app uses its on-device engine.
 */

const SYSTEM = `You are AURA Copilot, the explainer inside AURA AstroVitals, a prototype health workspace for astronaut crews.

Ground rules:
- All data is SIMULATED demo data. Say so briefly if the person seems to treat it as real.
- Use ONLY the numbers in the provided context JSON. Never invent readings, thresholds or studies. If something is not in the context, say you don't have it.
- You explain patterns; you do not diagnose, prescribe medication or create alerts. Official alerts come only from the Tier 0 rules.
- If the person describes a possible emergency (chest pain, trouble breathing, bleeding, loss of consciousness, suicidal thoughts), stop and tell them to follow official emergency procedures and alert the crew medical officer immediately.
- Be warm, calm and concrete. Lead with the answer in 1 to 2 sentences, then at most 3 short bullets of evidence or next steps. Under 160 words. Use **bold** sparingly. No headings, no emoji.
- Refer to the person's own baseline, not population averages.
- You may suggest AURA screens: /intelligence (analysis and what-if), /checkin, /pvt, /exercise, /games/clock, /body, /alerts.`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function GET() {
  return json({ configured: Boolean(process.env.ANTHROPIC_API_KEY), simulated: true });
}

interface Turn {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: "not_configured" }, 503);

  const allowed = process.env.COPILOT_ALLOWED_ORIGIN;
  const origin = request.headers.get("origin");
  if (allowed && origin && origin !== allowed) return json({ error: "forbidden" }, 403);

  let payload: { messages?: Turn[]; context?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const turns = (payload.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  if (!turns.length || turns[turns.length - 1].role !== "user") return json({ error: "bad_request" }, 400);
  const context = JSON.stringify(payload.context ?? {}).slice(0, 12000);

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 500,
      stream: true,
      system: `${SYSTEM}\n\nCurrent context (JSON, simulated):\n${context}`,
      messages: turns,
    }),
  });
  if (!upstream.ok || !upstream.body) return json({ error: "upstream", status: upstream.status }, 502);

  // Convert Anthropic's SSE stream into a plain text stream of deltas.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim());
            if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
              controller.enqueue(encoder.encode(ev.delta.text));
            }
          } catch {
            /* ignore keep-alives and partial lines */
          }
        }
      },
    }),
  );
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
