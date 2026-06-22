# Plan — Gnapix Premium 3D Portfolio

This document outlines the execution roadmap for implementing all user requirements and verifying them.

## Milestones and Phase Breakdown

### Milestone 1: Planning and Test Design
- [ ] Initialize global `PROJECT.md` with architecture and milestones.
- [ ] Design E2E test suite specs and draft `TEST_INFRA.md` including Category-Partition & Boundary Value Analysis.
- [ ] Establish initial project state and coordinate with subagents.

### Milestone 2: Pre-Cached Video Backgrounds
- [ ] Pre-fetch `stickers.mp4`, `magnets.mp4`, and `polaroids.mp4` using `fetch` on startup.
- [ ] Convert videos to Blobs and generate object URLs using `URL.createObjectURL(blob)`.
- [ ] Sync video currentTime smoothly to desktop wheel scroll and mobile touch swipe events without black screen/flashing lag.
- [ ] Verify using opaque-box/functional tests.

### Milestone 3: Premium 3D Aesthetics & Effects
- [ ] Adjust and enhance materials (roughness, metalness, clearcoat, transmission, clearcoatRoughness) of all models (Camera, Sticker, Polaroid, Magnet).
- [ ] Tune `<Sparkles>` parameters (lower speed, organic paths, subtler scale, count, and color variance).
- [ ] Implement post-processing (light bloom, vignette, or tone mapping) with `@react-three/postprocessing` integrated cleanly into the canvas.

### Milestone 4: Performance & Resource Lifecycle
- [ ] Clean up and dispose of unused WebGL resources (textures, geometries, materials).
- [ ] Verify responsiveness on both mobile and desktop viewports.
- [ ] Audit frame rate to ensure stable smooth scrolling and interaction.

### Milestone 5: Verification & Audit
- [ ] Execute E2E tests for all features.
- [ ] Run Forensic Auditor to guarantee zero cheating/hardcoding and verify layout compliance.
- [ ] Declare completion to Sentinel.
