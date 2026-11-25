import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { agarCapabilities, agarGenerate, agarJob, agarLogin, agarUploadImage } from './agar-api'

describe('AGAR same-origin API bridge', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('never sends prompts to a third-party generation API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ job_id: 'real-job-id' }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const result = await agarGenerate('Arctic documentary shot', 'ref-image-123')
    expect(result.job_id).toBe('real-job-id')
    expect(fetch).toHaveBeenCalledWith('/api/v1/generations', expect.objectContaining({
      credentials: 'same-origin',
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Arctic documentary shot',
        model: 'kandinsky6',
        reference_asset_id: 'ref-image-123',
      }),
    }))
  })

  it('sends an explicitly selected self-hosted model without external API calls', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ job_id: 'wan-job' }), { status: 202 }),
    )
    await agarGenerate('Wide mountain landscape', undefined, 'wan22-ti2v-5b')
    const options = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(options.body as string)).toEqual({
      prompt: 'Wide mountain landscape',
      model: 'wan22-ti2v-5b',
      reference_asset_id: null,
    })
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe('/api/v1/generations')
  })

  it('blocks generation status speculation by returning an actual server failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'AGAR GPU worker offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    await expect(agarGenerate('test prompt')).rejects.toThrow('AGAR GPU worker offline')
  })

  it('authenticates through an HTTP-only session cookie, not a browser API token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ authenticated: true }), { status: 200 }),
    )
    await expect(agarLogin('example password')).resolves.toEqual({ authenticated: true })
    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/login', expect.objectContaining({
      credentials: 'same-origin',
      method: 'POST',
    }))
  })

  it('reads actual worker capabilities and persisted job status', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({
        render_worker_online: true,
        gpu_worker_online: false,
        models: [],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'j1', kind: 'generation', status: 'queued',
        result_asset_id: null, error: null,
      }), { status: 200 }))
    expect((await agarCapabilities()).gpu_worker_online).toBe(false)
    expect((await agarJob('j1')).status).toBe('queued')
    expect(fetch).toHaveBeenLastCalledWith('/api/v1/jobs/j1', expect.objectContaining({
      credentials: 'same-origin',
    }))
  })

  it('sends an image as FormData rather than uploading it to a third-party host', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'asset-image' }), { status: 200 }),
    )
    const file = new File(['pixels'], 'reference.png', { type: 'image/png' })
    await expect(agarUploadImage(file)).resolves.toBe('asset-image')
    const options = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit
    expect(options.body).toBeInstanceOf(FormData)
    expect((options.body as FormData).get('file')).toBe(file)
  })
})
