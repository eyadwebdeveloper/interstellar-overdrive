import type { AuraSnapshot, HealthResponse } from './contract'

/** Relative base so the Vite proxy handles it in dev and preview. */
const BASE = import.meta.env.VITE_AURA_API_BASE ?? '/api'
const TIMEOUT_MS = 4000

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  const onAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status)
    const type = res.headers.get('content-type') ?? ''
    if (!type.includes('json')) throw new ApiError('Unexpected response type')
    return (await res.json()) as T
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError(err instanceof Error ? err.message : 'Network error')
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

export const auraApi = {
  health: (signal?: AbortSignal) => getJson<HealthResponse>('/health', signal),
  snapshot: (astroId: string, signal?: AbortSignal) =>
    getJson<AuraSnapshot>(`/astronauts/${encodeURIComponent(astroId)}/snapshot`, signal),
}
