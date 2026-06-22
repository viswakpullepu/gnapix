# Original User Request

## Initial Request — 2026-06-22T06:40:59+05:30

<USER_REQUEST>
An ultra-premium, interactive 3D WebGL portfolio website for Gnapix, utilizing React Three Fiber, featuring smooth background video scrub-transitions, cursor-interactive floating objects, custom holographic stickers, and fluid, responsive animations.

Working directory: C:\Users\gampa pranith\.gemini\antigravity\scratch\gnapix-portfolio
Integrity mode: benchmark

## Requirements

### R1. Pre-Cached Video Backgrounds
The three background videos (`stickers.mp4`, `magnets.mp4`, `polaroids.mp4`) must be pre-cached/pre-loaded into memory using Javascript Fetch and `URL.createObjectURL(blob)` on page startup. This prevents any loading delay, buffering lag, or black/blank frames when transitioning or scrubbing through the video files.

### R2. Advanced 3D Aesthetics & Effects
The Three.js Canvas should look extremely premium and elegant:
- **Material properties**: Enhance the glossiness, metallic roughness, clearcoat, and transmission variables of procedural sticker overlays, polaroids, and scene meshes.
- **Sparkles particle system**: Adjust `<Sparkles>` parameters to look finer, with lower speed, organic floating paths, and subtle color variance.
- **Post-processing**: Add a light bloom, vignette, or tone mapping layer (using `@react-three/postprocessing`) to glue the visual space together beautifully.

### R3. Responsive and Fast Performance
The page must run at a smooth, stable frame rate. Minimize rendering overhead, dispose of unused WebGL resources, and ensure all features are responsive on both mobile and desktop layout dimensions.

## Acceptance Criteria

### Video & Transition Smoothness
- [ ] On initial page load, background videos are fetched, cached as Blobs, and referenced via object URLs.
- [ ] No blank, black, or loading frames occur during background video scrub-scroll transitions.
- [ ] Swiping on touch screens and wheel scrolling on desktop scrub the cached videos smoothly.

### 3D Render Quality
- [ ] Post-processing effects (such as bloom/vignette) are present and active on the Canvas.
- [ ] 3D models (camera, stickers, polaroids) feature physical materials with customized roughness, metalness, and clearcoat values.
- [ ] Sparkle particle count, scale, and speed are adjusted for a premium, floaty dust aesthetic.

### Performance & Layout
- [ ] Scene frame rate remains smooth and responsive during continuous scrolling and mouse movements on both desktop and mobile viewports.
</USER_REQUEST>
