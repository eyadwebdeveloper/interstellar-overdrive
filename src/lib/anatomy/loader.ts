/** Loads atlas manifests and binary geometry chunks.
 *
 * Chunks are stored as .gz siblings of the .bin the manifest names. The browser
 * decompresses them with DecompressionStream, and the resulting ArrayBuffer is
 * cached per manifest so the female-body and leg-muscle models (which share
 * atlas-female.json) never download the same chunk twice. Switching to a
 * different manifest evicts the previous atlas's buffers to bound memory.
 */
import type { AtlasManifest, ChunkRef } from './types';

export class AtlasLibrary {
  private manifests = new Map<string, Promise<AtlasManifest>>();
  private chunkCache = new Map<string, Promise<ArrayBuffer>>();
  private currentManifest = '';

  manifest(url: string): Promise<AtlasManifest> {
    if (this.currentManifest && this.currentManifest !== url) {
      // A different atlas: drop the old chunk buffers (~60 MB per body).
      this.chunkCache.clear();
    }
    this.currentManifest = url;
    let m = this.manifests.get(url);
    if (!m) {
      m = fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`Could not load the atlas catalogue (${r.status}).`);
          return r.json() as Promise<AtlasManifest>;
        });
      this.manifests.set(url, m);
    }
    return m;
  }

  chunk(url: string, ref: ChunkRef): Promise<ArrayBuffer> {
    const key = `${url}#${ref.url}`;
    let c = this.chunkCache.get(key);
    if (!c) {
      c = this.fetchChunk(ref).catch((e) => {
        this.chunkCache.delete(key);
        throw e;
      });
      this.chunkCache.set(key, c);
    }
    return c;
  }

  /** Drop a mounted chunk's buffer so it can be collected. Mounting code that
   *  kept its own copies (merged geometry) is unaffected. */
  release(url: string, ref: ChunkRef) {
    this.chunkCache.delete(`${url}#${ref.url}`);
  }

  private async fetchChunk(ref: ChunkRef): Promise<ArrayBuffer> {
    // Prefer the gzip twin (~55% of the size). Some static hosts answer a .gz
    // request with Content-Encoding: gzip, in which case fetch has already
    // decoded the payload — sniff the magic bytes to avoid decoding twice.
    let buffer: ArrayBuffer;
    if (typeof DecompressionStream !== 'undefined' && ref.gzip) {
      const res = await fetch(ref.gzip);
      if (!res.ok) throw new Error(`Could not load anatomy geometry (${res.status}).`);
      const payload = await res.arrayBuffer();
      const head = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
      const isGzip = head[0] === 0x1f && head[1] === 0x8b;
      buffer = isGzip
        ? await new Response(
            new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))
          ).arrayBuffer()
        : payload;
    } else {
      const res = await fetch(ref.url);
      if (!res.ok) throw new Error(`Could not load anatomy geometry (${res.status}).`);
      buffer = await res.arrayBuffer();
    }
    if (buffer.byteLength !== ref.bytes) {
      throw new Error('An anatomy file was incomplete — please reload.');
    }
    return buffer;
  }

  /** Which chunk files a set of structures needs. */
  static chunksFor(parts: { chunk: number }[]): number[] {
    return [...new Set(parts.map((p) => p.chunk))].sort((a, b) => a - b);
  }
}
