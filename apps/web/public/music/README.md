# Studio music library

These are the built-in royalty-free soundtracks the Video Studio offers in its
music picker. The picker and the render pipeline read the manifest in
`apps/web/src/lib/studio-music.ts`; this folder must contain a matching `.mp3`
for each entry.

## Add the tracks (one-time)

Drop MP3s here with these EXACT filenames:

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
