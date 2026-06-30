// Built-in royalty-free music library for the Video Studio.
//
// Two ways a track can be sourced:
//   - `file`: an MP3 bundled under apps/web/public/music/ (the long-term,
//     fully-owned path — see public/music/README.md). Takes precedence.
//   - `url`:  a remote, hotlink-friendly free track (the works-right-now path).
//
// RIGHT NOW these point at SoundHelix (https://www.soundhelix.com) — full-length
// instrumental tracks the author makes freely available, verified hotlinkable
// and CORS-free for both browser preview and server-side render fetch. They are
// a STARTER set: the mood labels/names are approximate vibe hints. To ship a
// curated, on-brand, guaranteed-CC0 library, drop MP3s into public/music/ with
// the filenames in that README and add a `file:` to each entry — it overrides
// the URL with zero other changes.
//
// LICENSING: anything added here must be clear for COMMERCIAL reuse (users may
// sell their creations). Curated CC0 sources: Pixabay Music, Mixkit, Uppbeat.

export type MusicMood = 'Cinematic' | 'Ambient' | 'Upbeat' | 'Dramatic' | 'Corporate' | 'Lo-fi'

export interface StudioTrack {
  id: string
  title: string
  mood: MusicMood
  url: string    // remote source (used when no bundled file is present)
  file?: string  // optional bundled file under /public/music (overrides url)
}

const SH = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`

export const STUDIO_MUSIC: StudioTrack[] = [
  { id: 'electric-sunrise', title: 'Electric Sunrise', mood: 'Upbeat',    url: SH(1) },
  { id: 'momentum',         title: 'Momentum',         mood: 'Upbeat',    url: SH(4) },
  { id: 'wide-horizon',     title: 'Wide Horizon',     mood: 'Cinematic', url: SH(5) },
  { id: 'rising-action',    title: 'Rising Action',    mood: 'Cinematic', url: SH(7) },
  { id: 'undercurrent',     title: 'Undercurrent',     mood: 'Dramatic',  url: SH(2) },
  { id: 'still-air',        title: 'Still Air',        mood: 'Ambient',   url: SH(3) },
  { id: 'clean-lines',      title: 'Clean Lines',      mood: 'Corporate', url: SH(6) },
  { id: 'late-night',       title: 'Late Night',       mood: 'Lo-fi',     url: SH(8) },
]

export const MUSIC_PUBLIC_SUBDIR = 'music'
// Default soundtrack so a render is never silent (the #1 "no pizazz" complaint).
// Upbeat — reads as a product/tech ad. The user can swap or clear it.
export const DEFAULT_TRACK_ID = 'momentum'
export const trackById = (id: string): StudioTrack | null => STUDIO_MUSIC.find(t => t.id === id) || null
// What the browser/render should load for a track: a bundled file wins; else the remote URL.
export const trackSrc = (t: StudioTrack): string => (t.file ? `/${MUSIC_PUBLIC_SUBDIR}/${t.file}` : t.url)
