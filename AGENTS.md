<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Scratch Files and Testing Scripts

When working on this project, DO NOT create temporary files, test scripts, or scratch files (e.g. `scratch_*.ts`) in the root directory or anywhere else in the main source tree. 
If you need to create any test files, scripts, or non-core files to test implementations or debug problems, you MUST:
1. Create a descriptive subfolder inside `_technical_support/` for the specific problem or task you are working on.
2. Place all your scratch scripts and test files inside that new subfolder.

# Build, Type Checking, and Runtime Verification (STRICT RULE)

You MUST NEVER reply to the user claiming a task is done, fixed, or ready unless you are 100% CERTAIN there are zero build, typecheck, console, and runtime errors.
Before EVERY SINGLE response where code was created or edited:
1. You MUST proactively run verification commands: `npm run build` and `npx tsc --noEmit`.
2. You MUST verify that the commands exit with code 0.
3. You MUST verify console and runtime health:
   - Check that affected API endpoints and server handlers respond cleanly without unhandled exceptions or 500 status codes.
   - Check that components and pages do not trigger React hydration mismatches, runtime null-pointer/undefined exceptions, or uncaught promise rejections.
4. If ANY build, type, console, or runtime error exists, you MUST diagnose and fix it immediately before responding.
5. Do NOT reply with explanations or apologies while any error is unresolved. Ensure the build and runtime are completely green first.