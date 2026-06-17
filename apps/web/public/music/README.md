# Studio music library

The Video Studio's music picker reads the manifest in
`apps/web/src/lib/studio-music.ts`.

**It already works** — the manifest currently points each track at a remote
hotlink-friendly free source (SoundHelix), so the picker previews and renders
with zero files here. This folder is for the OPTIONAL upgrade: replacing those
starter tracks with curated, on-brand, guaranteed-CC0 MP3s you own.

## Upgrade to bundled tracks (optional)

Drop an MP3 here and add a `file:` to that track's entry in `studio-music.ts`
(a bundled `file` overrides the remote `url` with no other change). Suggested
filenames if you want to mirror the current set:

| File                   | Mood      | Suggested vibe                         |
|------------------------|-----------|----------------------------------------|
| `cinematic-rise.mp3`   | Cinematic | Building orchestral, hopeful swell     |
| `epic-horizon.mp3`     | Cinematic | Big trailer drums, wide and heroic     |
| `calm-waters.mp3`      | Ambient   | Soft pads, slow, meditative            |
| `soft-light.mp3`       | Ambient   | Gentle piano / texture, warm           |
| `bright-future.mp3`    | Upbeat    | Positive pop/electronic, energetic     |
| `good-vibes.mp3`       | Upbeat    | Light, sunny, feel-good                |
| `tension-builds.mp3`   | Dramatic  | Pulsing, suspenseful, rising stakes    |
| `corporate-clean.mp3`  | Corporate | Clean, minimal, professional           |
| `lofi-study.mp3`       | Lo-fi     | Chill beats, mellow                    |

## Where to get CC0 / royalty-free tracks

Only use **no-attribution, commercial-use** music — users may sell their
creations in the community, so the audio must be clear for commercial reuse:

- **Pixabay Music** — https://pixabay.com/music/ (no attribution, commercial OK)
- **Mixkit** — https://mixkit.co/free-stock-music/ (free, no attribution)
- **Uppbeat** — https://uppbeat.io/ (free tier gives a clearance)

Search the "vibe" column terms, download, rename to the filename above.

Adding/removing/renaming tracks? Update `studio-music.ts` to match — the
manifest is the single source of truth for both the UI and the renderer.
