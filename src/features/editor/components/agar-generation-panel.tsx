import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  agarCapabilities, agarGenerate, agarJob, agarLogin, agarUploadImage,
  type AgarModelCapability,
} from '../services/agar-api'
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
  const [models, setModels] = useState<AgarModelCapability[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [visualStyle, setVisualStyle] = useState('')
  const [cameraDirection, setCameraDirection] = useState('')
  const [lighting, setLighting] = useState('')
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
      // A worker heartbeat is not proof of successful inference for every installed model.
      // Only an actual model-level smoke-test certificate enables a choice.
      const ready = capabilities.gpu_worker_online
        ? capabilities.models.filter((model) => model.id && model.execution_tested === true)
        : []
      setModels(ready)
      setSelectedModel((current) =>
        ready.some((model) => model.id === current) ? current : (ready[0]?.id ?? ''),
      )
      setOnline(ready.length > 0)
      setMessage(ready.length > 0
        ? 'Verified model available. Use one of the models listed below.'
        : 'No verified AGAR generation model online. Start and smoke-test a GPU model first.')
    } catch (error) {
      setOnline(false)
      setModels([])
      setSelectedModel('')
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
    if (!online || !selectedModel) { setMessage('No verified AGAR model is available.'); return }
    if (!prompt.trim()) return
    const capability = models.find((model) => model.id === selectedModel)
    if (!capability?.execution_tested) { setMessage('Model is not inference-verified.'); return }
    if (reference && !capability.modes?.includes('image-to-video')) {
      setMessage('This model does not support reference-image generation.')
      return
    }
    // These are prompt instructions, not dedicated hardware camera controls.
    const directedPrompt = [
      prompt.trim(),
      visualStyle ? 'Visual style: ' + visualStyle + '.' : '',
      cameraDirection ? 'Camera direction: ' + cameraDirection + '.' : '',
      lighting ? 'Lighting: ' + lighting + '.' : '',
    ].filter(Boolean).join('\n')
    if (directedPrompt.length > 6000) {
      setMessage('Scene description and direction must total 6,000 characters or less.')
      return
    }
    setBusy(true)
    try {
      const referenceAssetId = reference ? await agarUploadImage(reference) : undefined
      const submitted = await agarGenerate(directedPrompt, referenceAssetId, selectedModel)
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
        <label htmlFor="agar-model" className="block text-xs">AI model (verified on this GPU)</label>
        <select id="agar-model" value={selectedModel}
          onChange={(event) => setSelectedModel(event.target.value)}
          disabled={!online || busy || !!jobId}
          className="w-full rounded border bg-background p-2 text-xs">
          {models.length === 0 && <option value="">No verified model available</option>}
          {models.map((model) => (
            <option key={model.id} value={model.id}>{model.label || model.id}</option>
          ))}
        </select>
        <label htmlFor="agar-description" className="block text-xs">Describe the scene</label>
        <textarea id="agar-description" value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Cinematic aerial view of an Antarctic research station at dusk…"
          rows={4} maxLength={6000} required
          className="w-full resize-y rounded border bg-background p-2 text-sm" />
        <details className="rounded border border-border p-2">
          <summary className="cursor-pointer text-xs font-semibold">Scene direction</summary>
          <p className="my-2 text-[11px] text-muted-foreground">
            These choices add clear instructions to your prompt. The model may not follow them
            exactly; they are not native camera or lens controls.
          </p>
          <label htmlFor="agar-style" className="block text-xs">Look</label>
          <select id="agar-style" value={visualStyle}
            onChange={(event) => setVisualStyle(event.target.value)}
            className="mb-2 w-full rounded border bg-background p-2 text-xs">
            <option value="">Use prompt</option>
            <option value="photorealistic documentary">Photorealistic documentary</option>
            <option value="cinematic feature film">Cinematic feature film</option>
            <option value="hand-drawn 2D animation">Hand-drawn animation</option>
            <option value="stylized 3D animation">Stylized 3D animation</option>
          </select>
          <label htmlFor="agar-camera" className="block text-xs">Camera movement</label>
          <select id="agar-camera" value={cameraDirection}
            onChange={(event) => setCameraDirection(event.target.value)}
            className="mb-2 w-full rounded border bg-background p-2 text-xs">
            <option value="">Use prompt</option>
            <option value="slow dolly-in">Slow dolly-in</option>
            <option value="smooth lateral tracking shot">Lateral tracking</option>
            <option value="orbit around the subject">Orbit</option>
            <option value="static locked-off composition">Static</option>
            <option value="rising aerial crane movement">Rising crane</option>
          </select>
          <label htmlFor="agar-light" className="block text-xs">Lighting</label>
          <select id="agar-light" value={lighting}
            onChange={(event) => setLighting(event.target.value)}
            className="w-full rounded border bg-background p-2 text-xs">
            <option value="">Use prompt</option>
            <option value="soft natural daylight">Natural daylight</option>
            <option value="warm golden-hour sunset">Golden hour</option>
            <option value="low-key dramatic lighting">Dramatic low-key</option>
            <option value="cool blue moonlight">Blue moonlight</option>
          </select>
        </details>
        <label htmlFor="agar-reference-image" className="block text-xs">Reference image (optional)</label>
        <input id="agar-reference-image" type="file" accept="image/png,image/jpeg,image/webp"
          onChange={(event) => setReference(event.target.files?.[0] ?? null)}
          className="w-full text-xs" />
        <button type="submit" disabled={!projectId || !online || !selectedModel || busy || !!jobId || needsLogin}
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
