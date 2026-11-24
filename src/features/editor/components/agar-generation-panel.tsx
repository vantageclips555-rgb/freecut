import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { agarCapabilities, agarGenerate, agarJob, agarLogin, agarUploadImage } from '../services/agar-api'
import { importAndPlaceAgarVideo } from '../services/agar-video-integration'
import { useMediaLibraryStore } from '../deps/media-library'

/**
 * In-editor AI generation only. All video bytes come from the AGAR-owned
 * backend. A healthy worker does NOT prove a model has been inference-tested.
 */
const JOB_KEY_PREFIX = 'agar-generation-job:'
const POLL_MS = 2500

export function AgarGenerationPanel() {
  const projectId = useMediaLibraryStore((s) => s.currentProjectId)
  const [password, setPassword] = useState('')
  const [prompt, setPrompt] = useState('')
  const [reference, setReference] = useState<File | null>(null)
  const [online, setOnline] = useState(false)
  const [checking, setChecking] = useState(true)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [message, setMessage] = useState('Checking AGAR inference infrastructure…')
  const [completedAsset, setCompletedAsset] = useState<string | null>(null)

  const jobKey = projectId ? JOB_KEY_PREFIX + projectId : null

  const refresh = useCallback(async () => {
    setChecking(true)
    try {
      const capabilities = await agarCapabilities()
      setNeedsLogin(false)
      setOnline(capabilities.gpu_worker_online)
      setMessage(capabilities.gpu_worker_online
        ? 'GPU worker detected. Model inference has not been independently verified.'
        : 'GPU worker offline. Generation is disabled until AGAR inference is deployed.')
    } catch (error) {
      setOnline(false)
      setNeedsLogin(String(error).includes('401'))
      setMessage(String(error))
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    if (!jobKey) {
      setJobId(null)
      return
    }
    setJobId(window.localStorage.getItem(jobKey))
  }, [jobKey])

  useEffect(() => {
    if (!jobId || !jobKey) return
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const poll = async () => {
      try {
        const job = await agarJob(jobId)
        if (cancelled) return
        if (job.status === 'failed') {
          window.localStorage.removeItem(jobKey)
          setJobId(null)
          setMessage('Inference failed: ' + (job.error ?? 'Unknown error'))
          return
        }
        if (job.status === 'succeeded') {
          if (!job.result_asset_id) throw new Error('Completed job has no media asset')
          setCompletedAsset(job.result_asset_id)
          setMessage('Generated clip is ready; importing into FreeCut…')
          const outcome = await importAndPlaceAgarVideo(job.result_asset_id)
          if (cancelled) return
          window.localStorage.removeItem(jobKey)
          setJobId(null)
          setCompletedAsset(null)
          setMessage(outcome.message)
          return
        }
        setMessage('Generation job ' + job.status + ' — checking progress.')
        timeoutId = setTimeout(() => { void poll() }, POLL_MS)
      } catch (error) {
        if (cancelled) return
        // Keep persisted job ID so reloading after an outage can recover.
        setMessage('Unable to check or import job: ' + String(error))
      }
    }
    void poll()
    return () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId) }
  }, [jobId, jobKey])

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await agarLogin(password)
      setPassword('')
      await refresh()
    } catch (error) {
      setMessage(String(error))
    }
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!projectId || !jobKey) { setMessage('Open a project first.'); return }
    if (!online) { setMessage('AGAR GPU inference is not available.'); return }
    if (!prompt.trim()) return
    setBusy(true)
    try {
      const referenceAssetId = reference ? await agarUploadImage(reference) : undefined
      const submitted = await agarGenerate(prompt.trim(), referenceAssetId)
      window.localStorage.setItem(jobKey, submitted.job_id)
      setJobId(submitted.job_id)
      setMessage('Real AGAR inference job queued.')
    } catch (error) {
      setMessage(String(error))
    } finally {
      setBusy(false)
    }
  }

  async function retryImport() {
    if (!completedAsset) return
    setBusy(true)
    try {
      const outcome = await importAndPlaceAgarVideo(completedAsset)
      if (jobKey) window.localStorage.removeItem(jobKey)
      setJobId(null)
      setCompletedAsset(null)
      setMessage(outcome.message)
    } catch (error) {
      setMessage(String(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="AGAR Engine AI video generation" className="space-y-3 border-b border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">AGAR Engine</h2>
          <p className="text-[11px] text-muted-foreground">Self-hosted video generation</p>
        </div>
        <button type="button" className="text-xs underline disabled:opacity-40"
          onClick={() => void refresh()} disabled={checking}>Refresh</button>
      </div>
      {needsLogin && (
        <form onSubmit={(event) => void login(event)} className="space-y-2">
          <label htmlFor="agar-owner-password" className="text-xs">AGAR owner password</label>
          <input id="agar-owner-password" type="password" required value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded border bg-background p-2 text-sm" />
          <button className="rounded bg-primary px-3 py-2 text-xs text-primary-foreground">Sign in</button>
        </form>
      )}
      <form onSubmit={(event) => void generate(event)} className="space-y-2">
        <label htmlFor="agar-description" className="text-xs">Describe the scene</label>
        <textarea id="agar-description" value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Cinematic aerial view of an Antarctic research station at dusk…"
          rows={4} maxLength={6000} required
          className="w-full resize-y rounded border bg-background p-2 text-sm" />
        <label htmlFor="agar-reference-image" className="text-xs">Reference image (optional)</label>
        <input id="agar-reference-image" type="file" accept="image/png,image/jpeg,image/webp"
          onChange={(event) => setReference(event.target.files?.[0] ?? null)}
          className="w-full text-xs" />
        <button type="submit" disabled={!projectId || !online || busy || !!jobId || needsLogin}
          className="rounded bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-40">
          {busy || jobId ? 'Working…' : 'Generate video'}
        </button>
      </form>
      {completedAsset && (
        <button type="button" disabled={busy} onClick={() => void retryImport()}
          className="text-xs underline">Retry importing completed clip</button>
      )}
      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{message}</p>
    </section>
  )
}
