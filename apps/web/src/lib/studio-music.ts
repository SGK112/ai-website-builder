// Built-in royalty-free music library for the Video Studio.
//
// Each track is an MP3 bundled under apps/web/public/music/. The picker (client)
// lists them by mood and previews them at /music/<file>; the render route
// (server) resolves the same entry to a path on disk and feeds it to ffmpeg —
// so bundled music never goes through the SSRF/URL-allowlist path.
//
// LICENSING: only add CC0 / royalty-free, no-attribution, commercial-use tracks
// here (Pixabay Music, Mixkit, Uppbeat). Users may sell their creations in the
// community, so every track must be clear for commercial reuse. See
// public/music/README.md for where to source files + exact filenames.

export type MusicMood = 'Cinematic' | 'Ambient' | 'Upbeat' | 'Dramatic' | 'Corporate' | 'Lo-fi'

export interface StudioTrack {
  id: string
  title: string
  mood: MusicMood
  file: string // filename under /public/music
}

export const STUDIO_MUSIC: StudioTrack[] = [
  { id: 'cinematic-rise',  title: 'Cinematic Rise',  mood: 'Cinematic', file: 'cinematic-rise.mp3' },
  { id: 'epic-horizon',    title: 'Epic Horizon',    mood: 'Cinematic', file: 'epic-horizon.mp3' },
  { id: 'calm-waters',     title: 'Calm Waters',     mood: 'Ambient',   file: 'calm-waters.mp3' },
  { id: 'soft-light',      title: 'Soft Light',      mood: 'Ambient',   file: 'soft-light.mp3' },
  { id: 'bright-future',   title: 'Bright Future',   mood: 'Upbeat',    file: 'bright-future.mp3' },
  { id: 'good-vibes',      title: 'Good Vibes',      mood: 'Upbeat',    file: 'good-vibes.mp3' },
  { id: 'tension-builds',  title: 'Tension Builds',  mood: 'Dramatic',  file: 'tension-builds.mp3' },
  { id: 'corporate-clean', title: 'Corporate Clean', mood: 'Corporate', file: 'corporate-clean.mp3' },
  { id: 'lofi-study',      title: 'Lo-fi Study',     mood: 'Lo-fi',     file: 'lofi-study.mp3' },
]

export const MUSIC_PUBLIC_SUBDIR = 'music'
export const trackById = (id: string): StudioTrack | null => STUDIO_MUSIC.find(t => t.id === id) || null
export const trackPublicUrl = (t: StudioTrack): string => `/${MUSIC_PUBLIC_SUBDIR}/${t.file}`
