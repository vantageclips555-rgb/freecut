/**
 * AGAR -> FreeCut: import the real generated MP4, then insert it as a
 * normal undoable video clip. Never substitutes mock media.
 *
 * Uses the existing FreeCut importGeneratedVideo, buildMediaTimelineItem
 * and addItem functions. Import is retained if timeline placement fails.
 */
import { useMediaLibraryStore, importMediaLibraryService, resolveMediaUrl } from '../deps/media-library'
import { useItemsStore, useTimelineSettingsStore, addItem } from '../deps/timeline-store'
import { buildMediaTimelineItem } from '../deps/timeline-utils'
import { useProjectStore } from '../deps/projects'
import { usePlaybackStore } from '@/shared/state/playback'
import { DEFAULT_PROJECT_HEIGHT, DEFAULT_PROJECT_WIDTH } from '@/shared/projects/defaults'
import { agarDownloadVideo } from './agar-api'

export interface AgarImportedVideo {
  mediaId: string
  insertedIntoTimeline: boolean
  message: string
}

export async function importAndPlaceAgarVideo(assetId: string): Promise<AgarImportedVideo> {
  const projectId = useMediaLibraryStore.getState().currentProjectId
  if (!projectId) throw new Error('Open a FreeCut project before importing AGAR footage.')

  const file = await agarDownloadVideo(assetId)
  const { mediaLibraryService } = await importMediaLibraryService()
  const media = await mediaLibraryService.importGeneratedVideo(file, projectId, {
    tags: ['agar-generated'],
  })
  await useMediaLibraryStore.getState().loadMediaItems()

  const result: AgarImportedVideo = {
    mediaId: media.id,
    insertedIntoTimeline: false,
    message: 'Generated footage imported into your media library.',
  }

  const track = useItemsStore.getState().tracks.find(
    (t) => t.kind === 'video' && !t.locked && !t.isGroup,
  ) ?? useItemsStore.getState().tracks.find(
    (t) => t.kind !== 'audio' && !t.locked && !t.isGroup,
  )
  if (!track) {
    result.message += ' Add or unlock a video track to place it on the timeline.'
    return result
  }

  const fps = useTimelineSettingsStore.getState().fps
  if (!Number.isFinite(fps) || fps <= 0 || !Number.isFinite(media.duration) || media.duration <= 0) {
    result.message += ' Timeline insertion skipped because the source timing was invalid.'
    return result
  }

  const src = await resolveMediaUrl(media.id)
  if (!src) {
    result.message += ' Timeline insertion skipped because its media URL could not be resolved.'
    return result
  }

  const project = useProjectStore.getState().currentProject
  const item = buildMediaTimelineItem({
    media: { duration: media.duration, fps: media.fps, width: media.width, height: media.height },
    mediaId: media.id,
    mediaType: 'video',
    label: media.fileName,
    projectFps: fps,
    blobUrl: src,
    thumbnailUrl: (await mediaLibraryService.getThumbnailBlobUrl(media.id)) || undefined,
    canvasWidth: project?.metadata.width ?? DEFAULT_PROJECT_WIDTH,
    canvasHeight: project?.metadata.height ?? DEFAULT_PROJECT_HEIGHT,
    placement: {
      trackId: track.id,
      from: Math.max(0, Math.round(usePlaybackStore.getState().currentFrame)),
    },
    originId: crypto.randomUUID(),
  })
  addItem(item)
  if (useItemsStore.getState().items.some((existing) => existing.id === item.id)) {
    result.insertedIntoTimeline = true
    result.message = 'Generated footage imported and placed on the timeline.'
  } else {
    result.message += ' Timeline placement was rejected; the source remains in the media library.'
  }
  return result
}
