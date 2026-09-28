# CanonMedicinae videos

Vertical (1080×1920, 30 fps) 2D motion graphics built with [Remotion](https://www.remotion.dev).
Finished renders live in `renders/`.

## Virtual Microscope showcase (25 s) — `MicroscopeShowcase`

| Time | Scene |
| --- | --- |
| 0:00–0:03 | Supplied logo (`public/canonmedicinae-logo.jpg`, unaltered) + «المجهر الافتراضي» / Virtual Microscope |
| 0:03–0:07 | Viewer card slides in; slide overview loads inside the lens |
| 0:07–0:13 | Continuous zoom 4x → 10x → 40x with badge, pan at 10x |
| 0:13–0:18 | Markers: Islets of Langerhans, Pancreatic acini |
| 0:18–0:22 | Numbered captions 1–3 |
| 0:22–0:25 | Logo, underline, URL, invite line, fade out |

Code: `src/Microscope/`. The tissue is a procedural, stylised H&E pancreas (`pancreas.ts`);
the camera path is in `camera.ts`. Music: `scripts/make_music_microscope.py`.

## Teaser (15 s) — `CanonTeaser`

| Time | Scene | File |
| --- | --- | --- |
| 0:00–0:02 | Light lines converge into the logo + «المعرفة في مسارها.» | `src/Teaser/SceneIntro.tsx` |
| 0:02–0:08 | Scattered icons → snap onto the path with three stops | `src/Teaser/ScenePath.tsx` |
| 0:08–0:12 | Microscope-lens transition into H&E line-art tissue | `src/Teaser/SceneLens.tsx`, `Tissue.tsx` |
| 0:12–0:15 | Logo, underline, tagline, URL, fade out | `src/Teaser/SceneOutro.tsx` |

Brand colours and fonts live in `src/shared/theme.ts`. Fonts (Cairo, Inter) come from `@fontsource-variable`.
The music (`public/music.wav`) is synthesised procedurally by `scripts/make_music.py` (numpy + scipy).

```console
npm i
npm run dev      # preview in Remotion Studio
npm run render              # → out/canonmedicinae-teaser.mp4
npm run render:microscope   # → out/virtual-microscope-showcase.mp4
npm run music               # regenerate both soundtracks
```
