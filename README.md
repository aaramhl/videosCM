# CanonMedicinae — 15 s teaser

Vertical (1080×1920, 30 fps) 2D motion-graphics teaser built with [Remotion](https://www.remotion.dev).

| Time | Scene | File |
| --- | --- | --- |
| 0:00–0:02 | Light lines converge into the logo + «المعرفة في مسارها.» | `src/Teaser/SceneIntro.tsx` |
| 0:02–0:08 | Scattered icons → snap onto the path with three stops | `src/Teaser/ScenePath.tsx` |
| 0:08–0:12 | Microscope-lens transition into H&E line-art tissue | `src/Teaser/SceneLens.tsx`, `Tissue.tsx` |
| 0:12–0:15 | Logo, underline, tagline, URL, fade out | `src/Teaser/SceneOutro.tsx` |

Brand colours and fonts live in `src/Teaser/theme.ts`. Fonts (Cairo, Inter) come from `@fontsource-variable`.
The music (`public/music.wav`) is synthesised procedurally by `scripts/make_music.py` (numpy + scipy).

```console
npm i
npm run dev      # preview in Remotion Studio
npm run render   # → out/canonmedicinae-teaser.mp4
npm run music    # regenerate the soundtrack
```
