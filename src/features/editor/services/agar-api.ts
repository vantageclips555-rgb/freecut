/**
 * AGAR Engine: same-origin client for the owner-operated FastAPI backend.
 * The Vite development server requires a proxy for /api/v1; production must
 * reverse-proxy /api/v1 to AGAR Core over HTTPS.
 * There are deliberately no third-party inference API keys in this client.
 */
const ROOT = '/api/v1'

export interface AgarCapabilities {
  render_worker_online: boolean
  gpu_worker_online: boolean
  models: Array<{ id?: string; modes?: string[]; execution_tested?: boolean }>
}

export interface AgarJob {
  id: string
  kind: 'generation' | 'render'
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  result_asset_id: string | null
  error: string | null
}

async function json<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(ROOT + path, {
    credentials: 'same-origin',
    ...options,
  })
  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => ({}))
    const detail =
      typeof errorBody === 'object' && errorBody !== null && 'detail' in errorBody
        ? String(errorBody.detail)
        : response.statusText
    throw new Error('AGAR API ' + response.status + ': ' + detail)
  }
  return (await response.json()) as T
}

export function agarLogin(password: string): Promise<{ authenticated: boolean }> {
  return json('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
}

export function agarCapabilities(): Promise<AgarCapabilities> {
  return json('/capabilities')
}

export async function agarUploadImage(file: File): Promise<string> {
  const data = new FormData()
  data.append('file', file)
  const asset = await json<{ id: string }>('/assets', { method: 'POST', body: data })
  return asset.id
}

export function agarGenerate(prompt: string, referenceAssetId?: string): Promise<{ job_id: string }> {
  return json('/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: 'kandinsky6',
      reference_asset_id: referenceAssetId ?? null,
    }),
  })
}

export function agarJob(jobId: string): Promise<AgarJob> {
  return json('/jobs/' + encodeURIComponent(jobId))
}

export async function agarDownloadVideo(assetId: string): Promise<File> {
  const response = await fetch(ROOT + '/assets/' + encodeURIComponent(assetId), {
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error('AGAR generated video download failed: HTTP ' + response.status)
  const blob = await response.blob()
  if (!blob.size) throw new Error('AGAR returned an empty generated video')
  return new File([blob], 'agar-' + assetId + '.mp4', { type: 'video/mp4' })
}
