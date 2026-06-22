# Project: Gnapix Premium 3D Portfolio

## Architecture
- **State Flow**: The page is divided into 4 main sections controlled by `activeSection` state in `App.jsx`.
- **Background Video Scrubbing**: Three background videos (`stickers.mp4`, `magnets.mp4`, `polaroids.mp4`) pre-loaded as object URLs and scrubbed based on user scroll/swipe gestures.
- **3D Scenes**: A single WebGL `<Canvas>` rendering:
  - `HeroScene`: Float components (camera, polaroids, stickers) with gravity repulsion.
  - `StickerGridScene`: Interactive stickers with custom vertex shaders.
  - `MagnetSnapScene`: 2x2 grid of glassmorphic magnets with magnetic snap tracking (currently placeholder).
  - `PolaroidScatterScene`: Polaroid stacks with gravity and overlapping collision physics.
  - `<Sparkles>`: Floaty dust effect.
  - Post-processing: Bloom & Vignette overlay.

## Code Layout
- `src/main.jsx`: React entry point.
- `src/App.jsx`: Main application container, scroll event handling, video pre-caching, UI overlays, R3F canvas, sub-scene routing, post-processing.
- `src/ProceduralModels.jsx`: Procedural canvas textures and custom 3D models with physical materials.
- `public/`: Video and icon assets.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | Setup & E2E Testing | Design and implement E2E test suite, publish TEST_READY.md | none | IN_PROGRESS | de146fd2-45d3-4638-a4e4-63efca08111e |
| 2 | Video Cache | Pre-load videos using Fetch and URL.createObjectURL(blob), fix scrub flash | M1 | IN_PROGRESS | de146fd2-45d3-4638-a4e4-63efca08111e |
| 3 | Materials & Particles | Adjust glass, plastic, metal properties, tune Sparkles, implement Magnet snap | M2 | DONE | - |
| 4 | Post-Processing | Add Bloom, Vignette using `@react-three/postprocessing` | M3 | DONE | - |
| 5 | Performance & Resp | Dispose resources, performance test, mobile responsive layout | M4 | IN_PROGRESS | de146fd2-45d3-4638-a4e4-63efca08111e |
| 6 | Final verification | Run E2E tests, resolve bugs, Forensic Audit | M1-M5 | PLANNED | - |

## Interface Contracts
- **Video Preloading**: A React hook or startup utility returning cached URLs `blob:http://...` for each video source.
- **Post-processing integration**: Configured post-processing canvas layers that render correctly without overlapping UI buttons.
