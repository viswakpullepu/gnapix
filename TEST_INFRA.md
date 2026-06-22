# TEST_INFRA.md - Gnapix Portfolio E2E Test Suite Design

This document details the Test Infrastructure, methodology, and the 60 test cases designed for the Gnapix 3D Portfolio.

## Test Case Design Methodology
We apply a **4-Tier Test Case Design Methodology** tailored for this interactive WebGL single-page portfolio application:
1. **Tier 1: Feature Coverage (Category-Partition)** - Asserts the happy path for all features.
2. **Tier 2: Boundary & Edge Cases (BVA)** - Asserts extreme inputs, boundary limits, and environmental edge cases.
3. **Tier 3: Cross-Feature Interaction (Pairwise)** - Asserts transitions and interference between distinct features.
4. **Tier 4: Application-Level Scenarios (Workload)** - Simulates end-to-end user workflows and continuous usage stress tests.

---

## The 60 Test Cases

### Tier 1: Feature Coverage (N = 25 Cases)

#### Feature 1: State Routing & UI Navigation (TC-1.1 - TC-1.5)
*   **TC-1.1: Click Header Nav Link 1**
    *   *Objective*: Click "Glossy Stickers" in header.
    *   *Verification*: Active section index changes to 1. Nav button 1 and Dot button 1 gain `.active` class.
    *   *Expected Result*: Transition success; UI text and active states update correctly.
*   **TC-1.2: Click Header Nav Link 2**
    *   *Objective*: Click "Refractive Magnets" in header.
    *   *Verification*: Active section index changes to 2. Nav button 2 and Dot button 2 gain `.active` class.
    *   *Expected Result*: Transition success; UI elements update.
*   **TC-1.3: Click Header Nav Link 3**
    *   *Objective*: Click "Polaroids Pile" in header.
    *   *Verification*: Active section index changes to 3. Nav button 3 and Dot button 3 gain `.active` class.
    *   *Expected Result*: Transition success; UI elements update.
*   **TC-1.4: Click CTA Button**
    *   *Objective*: Click `.cta-button` in the main content card.
    *   *Verification*: Active section cycles to next section (e.g. from 0 to 1).
    *   *Expected Result*: Section index transitions incrementally.
*   **TC-1.5: Click Footer Indicator Dot**
    *   *Objective*: Click the third dot button `.dots-indicator .dot-btn` (index 2).
    *   *Verification*: Active section transitions directly to Section 2 (Refractive Magnets).
    *   *Expected Result*: Direct transition success.

#### Feature 2: Hero Space & Cursor Repulsion (TC-2.1 - TC-2.5)
*   **TC-2.1: Loading Screen Dismissal**
    *   *Objective*: Load page and wait 1.8 seconds.
    *   *Verification*: `.loading-wipe` is removed from DOM. Hero content card is visible.
    *   *Expected Result*: Loading screen disappears.
*   **TC-2.2: Camera Rig Panning**
    *   *Objective*: Simulate mouse move to coordinate `[X: 100, Y: 100]`.
    *   *Verification*: Verify WebGL Canvas changes pixels (camera pans to follow cursor).
    *   *Expected Result*: Camera pan alters the rendered viewpoint.
*   **TC-2.3: Orbiting Meshes Rendered**
    *   *Objective*: Visual snapshot comparison of the canvas during orbit.
    *   *Verification*: Ensure orbiting meshes (polaroids, stickers) are rendering.
    *   *Expected Result*: Visual presence of orbiting objects.
*   **TC-2.4: Logo Text Rendering**
    *   *Objective*: Verify 3D text "gnapix" and camera are loaded.
    *   *Verification*: Center objects render correctly in Hero space.
    *   *Expected Result*: Central models are displayed.
*   **TC-2.5: Cursor Repulsion Trigger**
    *   *Objective*: Place cursor close to an orbiting mesh's path.
    *   *Verification*: The mesh alters trajectory and repels away.
    *   *Expected Result*: Physics coordinates update to push item away.

#### Feature 3: Interactive Glossy Stickers (TC-3.1 - TC-3.5)
*   **TC-3.1: Sticker Grid Rendered**
    *   *Objective*: Transition to Section 1 and perform visual check.
    *   *Verification*: 5 interactive stickers render in a layout configuration.
    *   *Expected Result*: Sticker meshes are rendered on the canvas.
*   **TC-3.2: Corner Peel Shader Hover**
    *   *Objective*: Move cursor over a sticker mesh's corner.
    *   *Verification*: Shader uniform updates, curling the sticker corner.
    *   *Expected Result*: Visual changes in corner curl.
*   **TC-3.3: Holographic Sweep Shader**
    *   *Objective*: Keep cursor hovered over a sticker.
    *   *Verification*: Shader displays rolling rainbow sweep over time.
    *   *Expected Result*: Rainbow color updates dynamically.
*   **TC-3.4: Sticker Cursor Tilt**
    *   *Objective*: Move cursor around the hovered sticker boundary.
    *   *Verification*: The sticker model tilts dynamically following the mouse position.
    *   *Expected Result*: Mesh rotation changes.
*   **TC-3.5: Video Opacity and Source**
    *   *Objective*: Transition to Section 1. Check video elements.
    *   *Verification*: `/stickers.mp4` video opacity becomes `0.35`. Other videos have opacity `0`.
    *   *Expected Result*: Correct background video is active.

#### Feature 4: Refractive Magnets & Snap Tracking (TC-4.1 - TC-4.5)
*   **TC-4.1: Section Content Visibility**
    *   *Objective*: Transition to Section 2. Verify DOM card content.
    *   *Verification*: Title displays "Glassmorphic Magnets" and description loads.
    *   *Expected Result*: Magnet section texts are shown.
*   **TC-4.2: Video Opacity and Source**
    *   *Objective*: Transition to Section 2. Check video elements.
    *   *Verification*: `/magnets.mp4` video opacity becomes `0.35`. Other videos have opacity `0`.
    *   *Expected Result*: Correct video activated.
*   **TC-4.3: Snap-to-Cursor Trigger**
    *   *Objective*: Hover cursor near magnet default position.
    *   *Verification*: Magnet snaps directly to the cursor coordinate.
    *   *Expected Result*: Magnet object coordinates track the cursor.
*   **TC-4.4: Snapped Drag Tilt**
    *   *Objective*: Drag snapped magnet across the canvas.
    *   *Verification*: Magnet tilts in the direction of the drag vector.
    *   *Expected Result*: Tilting rotation matches drag direction.
*   **TC-4.5: Snap Release**
    *   *Objective*: Move cursor quickly to break the magnet snap.
    *   *Verification*: Magnet detaches from the cursor and lerps back to its grid slot.
    *   *Expected Result*: Magnet snaps back to original grid slot.

#### Feature 5: Polaroids Pile & Physics Collisions (TC-5.1 - TC-5.5)
*   **TC-5.1: Polaroid Grid Rendered**
    *   *Objective*: Transition to Section 3. Verify page.
    *   *Verification*: 6 polaroids are visible on screen.
    *   *Expected Result*: Polaroid meshes render on the canvas.
*   **TC-5.2: Falling Physics Drop**
    *   *Objective*: Transition to Section 3, wait 1.0s.
    *   *Verification*: Polaroids drop from the top, accelerate down, and bounce at floor line.
    *   *Expected Result*: Interactive physics simulation runs.
*   **TC-5.3: Collision Push Resolution**
    *   *Objective*: Wait for all 6 polaroids to land on the floor.
    *   *Verification*: Polaroids push each other horizontally to resolve overlaps.
    *   *Expected Result*: No overlapping layout clashes.
*   **TC-5.4: Hover Extraction Inspect**
    *   *Objective*: Hover over Polaroid #2.
    *   *Verification*: Polaroid #2 floats to the foreground, scales up by 1.5x, and tilts with mouse.
    *   *Expected Result*: Extraction visual feedback.
*   **TC-5.5: Polaroid Release Drop**
    *   *Objective*: Move cursor away from the extracted Polaroid #2.
    *   *Verification*: Polaroid #2 falls back down to the floor pile and collides with other cards.
    *   *Expected Result*: Falls back to the pile.

---

### Tier 2: Boundary & Edge Cases (N = 25 Cases)

#### Feature 1: State Routing & UI Navigation (TC-6.1 - TC-6.5)
*   **TC-6.1: Scroll Down from Section 0**
    *   *Objective*: Dispatch positive `deltaY` (scroll down) on Section 0.
    *   *Verification*: Transition to Section 1 (Glossy Stickers) occurs.
    *   *Expected Result*: Scroll changes active section.
*   **TC-6.2: Scroll Up from Section 0**
    *   *Objective*: Dispatch negative `deltaY` (scroll up) on Section 0.
    *   *Verification*: Active section remains Section 0. `virtualProgress` stays locked at `0.0`.
    *   *Expected Result*: No transition past boundaries.
*   **TC-6.3: Scroll Down from Section 3**
    *   *Objective*: Dispatch positive `deltaY` (scroll down) on Section 3.
    *   *Verification*: Active section remains Section 3. `virtualProgress` stays locked at `1.0`.
    *   *Expected Result*: No transition past boundaries.
*   **TC-6.4: Sub-Threshold Scroll**
    *   *Objective*: Dispatch tiny scroll delta (e.g. `deltaY = 5`).
    *   *Verification*: Section does not transition. `virtualProgress` increments but stays within bounds.
    *   *Expected Result*: No threshold exceeded, no transition.
*   **TC-6.5: Rapid Touch Swipe Limits**
    *   *Objective*: Dispatch multi-touch swipe up gesture on mobile viewport.
    *   *Verification*: System interprets only the single tracking touch, transitioning safely.
    *   *Expected Result*: Safe handling of touch interactions.

#### Feature 2: Hero Space & Cursor Repulsion (TC-7.1 - TC-7.5)
*   **TC-7.1: Extreme Pointer Out Bounds**
    *   *Objective*: Move cursor to coordinate `[-1000, -1000]` (outside window).
    *   *Verification*: Camera rig panning clamps at limits. Orbiting objects resume default orbits.
    *   *Expected Result*: Bounds clamp successfully.
*   **TC-7.2: Zero Repulsion Center**
    *   *Objective*: Place cursor exactly at coordinate `[0, 0]` (screen center).
    *   *Verification*: Camera rig is neutral. Meshes orbit normally with no cursor repulsion force.
    *   *Expected Result*: Central cursor does not trigger erratic displacement.
*   **TC-7.3: Repulsion Velocity Ceiling**
    *   *Objective*: Sweep mouse across the screen at extremely high speed.
    *   *Verification*: Meshes repel, but velocities clamp so meshes do not exit canvas or glitch.
    *   *Expected Result*: Velocity limits applied.
*   **TC-7.4: Viewport Aspect Ratio Resize**
    *   *Objective*: Rapidly resize window from 1920x1080 to 800x1200.
    *   *Verification*: Three.js viewport scale is adjusted, keeping orbits visible and proportional.
    *   *Expected Result*: Viewport adjusts dynamically.
*   **TC-7.5: Overlapping Mesh Hover**
    *   *Objective*: Hover cursor where two orbits overlap.
    *   *Verification*: Repulsion force applies to both meshes based on their individual distance.
    *   *Expected Result*: Both items repel.

#### Feature 3: Interactive Glossy Stickers (TC-8.1 - TC-8.5)
*   **TC-8.1: Background Scrubbing BVA (Zero)**
    *   *Objective*: Scroll slightly down in Section 1. Scroll back up.
    *   *Verification*: `/stickers.mp4` video `currentTime` scrubs forward, then locks back at `0.0`.
    *   *Expected Result*: Accurate scrubbing to zero.
*   **TC-8.2: Background Scrubbing BVA (Max)**
    *   *Objective*: Scroll down until just before section transitions to Section 2.
    *   *Verification*: `/stickers.mp4` video `currentTime` scrubs to its maximum duration.
    *   *Expected Result*: Max scrubbing achieved before section change.
*   **TC-8.3: Hover Corner Projection**
    *   *Objective*: Hover sticker at the extreme corner on a 4K viewport.
    *   *Verification*: WebGL raycasting maps the cursor coordinates correctly to the sticker mesh.
    *   *Expected Result*: Cursor translates accurately.
*   **TC-8.4: High Frequency Hover Toggle**
    *   *Objective*: Hover in and out of a sticker 10 times in 1 second.
    *   *Verification*: Shader uniform `uHover` lerps back and forth smoothly without graphical errors.
    *   *Expected Result*: No visual stutter or uniform glitches.
*   **TC-8.5: Mobile Scale Layout**
    *   *Objective*: Emulate mobile screen size (width 375px).
    *   *Verification*: Sticker grid scale adjusts down (`layoutScale = viewport.width / 9.0`).
    *   *Expected Result*: Scale dynamically scales down.

#### Feature 4: Refractive Magnets & Snap Tracking (TC-9.1 - TC-9.5)
*   **TC-9.1: Background Scrubbing BVA (Zero)**
    *   *Objective*: Scroll down, then scroll up to Section 2.
    *   *Verification*: `/magnets.mp4` video `currentTime` scrubs forward and back to `0.0`.
    *   *Expected Result*: Correct scrubbing reset.
*   **TC-9.2: Snap Detection Radius Limit**
    *   *Objective*: Hover cursor exactly `0.49` units away from magnet center.
    *   *Verification*: Magnet snaps to the cursor (tested when scene is active).
    *   *Expected Result*: Magnet snapped status is true.
*   **TC-9.3: Snap Detection Outside Boundary**
    *   *Objective*: Hover cursor exactly `0.51` units away from magnet center.
    *   *Verification*: Magnet does not snap, only hovers and floats up slightly.
    *   *Expected Result*: Snap status remains false.
*   **TC-9.4: Exact Break-Snap Velocity**
    *   *Objective*: Move mouse at speed `25.1` units/sec away from snapped magnet.
    *   *Verification*: Snapped state immediately toggles to false; magnet returns to grid.
    *   *Expected Result*: Speed threshold breaks snap.
*   **TC-9.5: Sub Break-Snap Velocity**
    *   *Objective*: Move mouse at speed `24.9` units/sec.
    *   *Verification*: Snap is maintained; magnet follows the cursor.
    *   *Expected Result*: Snap remains active.

#### Feature 5: Polaroids Pile & Physics Collisions (TC-10.1 - TC-10.5)
*   **TC-10.1: Throttled CPU Fall Physics**
    *   *Objective*: Set CPU throttling to 6x. Transition to Section 3.
    *   *Verification*: Falling polaroids bounce correctly at `floorY = -2.2` without clipping through.
    *   *Expected Result*: Physics integration step remains robust.
*   **TC-10.2: Multiple Polaroid Hover**
    *   *Objective*: Sweep cursor quickly across multiple polaroids on the floor.
    *   *Verification*: Only one polaroid (the first hovered/on top) extracts at a time.
    *   *Expected Result*: Single extraction behavior.
*   **TC-10.3: Reset Pile State on Transition**
    *   *Objective*: Hover a card to extract it, then click Nav Link 0.
    *   *Verification*: Polaroid resets back to gravity pile; canvas resources are cleared.
    *   *Expected Result*: Clean reset of state.
*   **TC-10.4: Dynamic Floor Resize**
    *   *Objective*: Resize window height during card drop.
    *   *Verification*: `floorY` level updates and cards adjust their landing height dynamically.
    *   *Expected Result*: Floor bounds change relative to height.
*   **TC-10.5: Overlapping Z-Index Select**
    *   *Objective*: Hover two overlapping cards at their overlap point.
    *   *Verification*: The card with the higher Z-index is extracted.
    *   *Expected Result*: Top card selected first.

---

### Tier 3: Cross-Feature Interaction (N = 5 Cases)

*   **TC-11.1: Section transition during hover**
    *   *Objective*: Hover an item in Hero Scene, and simultaneously scroll down to transition.
    *   *Verification*: Active section changes. Hover states in Hero Scene are cleaned up; Section 1 loads.
    *   *Expected Result*: Clean cross-section cleanups.
*   **TC-11.2: Layout resize during inspection**
    *   *Objective*: Hover polaroid to extract it, then drag-resize the browser window.
    *   *Verification*: Polaroid remains extracted relative to the camera, while scale adjusts.
    *   *Expected Result*: Safe layout scaling during interaction.
*   **TC-11.3: Offline media requests**
    *   *Objective*: Block video files in network requests, and navigate between sections.
    *   *Verification*: UI transitions work normally. Canvas scenes render and function without crashing.
    *   *Expected Result*: Graceful error fallback for missing assets.
*   **TC-11.4: Dual input method stress**
    *   *Objective*: Swipe up on screen while simultaneously tapping a header nav link.
    *   *Verification*: Navigation link click takes precedence. App transitions to the clicked section.
    *   *Expected Result*: Tap overrides swipe without conflict.
*   **TC-11.5: Media state toggle on route**
    *   *Objective*: Navigate from Section 1 (Stickers) to Section 3 (Polaroids) immediately.
    *   *Verification*: Stickers video opacity goes to `0`, Polaroids video opacity goes to `0.35` in `1.2s`.
    *   *Expected Result*: Quick fade transition for correct videos.

---

### Tier 4: Application-Level Scenarios (N = 5 Cases)

*   **TC-12.1: Standard Visual Walkthrough**
    *   *Objective*: Emulate a typical desktop user exploring all sections in order.
    *   *Steps*:
        1. Access page, wait for loading.
        2. Move mouse to repel items in Hero Space.
        3. Click "Next Experience".
        4. Hover Sticker 2.
        5. Scroll wheel down to Magnets.
        6. Scroll wheel down to Polaroids.
        7. Hover Polaroid 4 to inspect.
        8. Click Nav Link "Hero Space".
    *   *Expected Result*: Smooth transition, no console errors, correct videos activate, shader uniforms update.
*   **TC-12.2: Rapid Navigation Stress Test**
    *   *Objective*: Tests robustness of the WebGL state cleaning and video loading/scrubbing under rapid routing.
    *   *Steps*:
        1. Access page.
        2. Fast-click header buttons in sequence: 1 -> 3 -> 0 -> 2 -> 3 -> 1.
        3. Monitor browser memory and console logs.
    *   *Expected Result*: No WebGL context loss, memory remains stable, active classes match current state.
*   **TC-12.3: Mobile Touch Journey**
    *   *Objective*: Tests user journey on mobile viewport with touch events.
    *   *Steps*:
        1. Emulate iPhone 12.
        2. Swipe up twice to reach Section 2.
        3. Drag cursor around (simulate touch move).
        4. Swipe up to Section 3.
        5. Touch-hold on Polaroid 1 to inspect.
        6. Tap Header Link "Hero Space".
    *   *Expected Result*: Correct mobile scaling (`layoutScale`), touch gestures successfully scroll pages and scrub videos.
*   **TC-12.4: Deep Asset Inspect Scenario**
    *   *Objective*: Tests user focusing deeply on inspectable items across multiple sections.
    *   *Steps*:
        1. Route directly to Section 3 (Polaroids).
        2. Hover Polaroid 5. Wait 3 seconds.
        3. Move mouse to inspect.
        4. Unhover.
        5. Scroll up to Section 1.
        6. Hover Sticker 1.
    *   *Expected Result*: Hover states activate/deactivate cleanly, 3D meshes scale and tilt appropriately.
*   **TC-12.5: Continuous Scrubbing & Interaction**
    *   *Objective*: Simulates an highly interactive user stressing both the video playback and physics loop.
    *   *Steps*:
        1. Scroll down and up continuously in Section 1 (scrubbing video forward/back).
        2. Hover multiple stickers during scrubbing.
        3. Transition to Section 3.
        4. Hover multiple falling polaroids.
    *   *Expected Result*: Video scrubs smoothly without flashing, canvas rendering remains at 60 FPS.
