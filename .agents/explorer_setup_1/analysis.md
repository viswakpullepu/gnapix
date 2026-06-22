# Gnapix Portfolio E2E Test Suite Design Analysis

## 1. Codebase Architecture & Investigation Findings

Following a read-only investigation of the codebase in `C:\Users\gampa pranith\.gemini\antigravity\scratch\gnapix-portfolio`, here are the architectural findings:

### 1.1 State Flow & Routing
- The portfolio is structured as a single-page application divided into **4 main sections** controlled by the `activeSection` state (values `0`, `1`, `2`, `3`) inside `src/App.jsx`.
- There is **no client-side router** (like `react-router-dom`). Routing and navigation are entirely state-driven.
- Transitions are triggered via:
  1. Clicking Header Nav links (`.nav-links button`).
  2. Clicking the CTA button (`.cta-button`) which cycles to the next section.
  3. Clicking the footer dot indicators (`.dots-indicator .dot-btn`).
  4. Scroll wheel movements (window `wheel` listener updates `virtualProgress.current` and transitions when it goes above `1.0` or below `0.0`).
  5. Mobile touch swipe gestures (window `touchstart` and `touchmove` listeners).

### 1.2 DOM Structure & Key CSS Selectors
The UI elements are overlaid on top of the fullscreen WebGL Canvas. The key DOM classes and structure are defined in `src/index.css` and `src/App.jsx`:
- **Loading Overlay**: `.loading-wipe` contains `.loading-logo` (text: `"gnapix"`). It disappears via Framer Motion `AnimatePresence` after a 1.5s timeout.
- **UI Container**: `.ui-fullscreen-wrapper` (has `pointer-events: none` so that cursor movements pass through to the Canvas underneath).
- **Interactive UI Element Container**: `.interactive-ui` (has `pointer-events: auto` to catch clicks/hovers).
- **Header Navbar**: `header.interactive-ui`
  - Logo: `.logo` (text: `"gnapix"`)
  - Nav Buttons: `.nav-links button` (with class `.active` on the active section button)
- **Main Content Card**: `.main-content-card.interactive-ui`
  - Section Tagline: `.section-tagline`
  - Section Title: `.section-title`
  - Section Description: `.section-desc`
  - Next Button: `.cta-button` (displays `"Next Experience"` and dynamic icon from Lucide)
- **Footer Status**: `.footer-status.interactive-ui`
  - Copyright text: `"© 2026 Gnapix Prints. Zero e-commerce. Pure Visuals."`
  - Slider Dots: `.dots-indicator` containing `.dot-btn` (with class `.active` for the current dot)
- **Canvas Wrapper**: `.canvas-fullscreen` which wraps the React Three Fiber `<Canvas>` element.

### 1.3 3D Canvas & WebGL Scenes
- A single WebGL `<Canvas>` spans the full screen, rendering lighting (ambient, directional, point lights), floating `<Sparkles>` (count 250), and a `<CameraRig />` for soft mouse-movement panning.
- Sub-scenes are loaded inside independent `<Suspense>` boundaries:
  - **`HeroScene`**: Renders a centered extruded "gnapix" `<Text>` logo, a floating `CameraModel`, and 15 orbiting items (7 Polaroids, 8 Stickers). The items have cursor repulsion physics calculated in the frame loop (`useFrame`).
  - **`StickerGridScene`**: Renders a grid of 5 interactive stickers using a custom `ShaderMaterial` with vertex shader corner peel and fragment shader holographic rainbow sweep. Hovering a sticker updates uniforms and tilts the mesh.
  - **`MagnetSnapScene`**: **Currently a placeholder** returning `null`. The file implements a `MagnetBlock` with pointer event listeners and a magnetic snap tracking physics loop (snapping to mouse coordinates at `Z=0.8`, breaking snap on high velocity `>25.0`), but the component is not currently rendered.
  - **`PolaroidScatterScene`**: Renders 6 polaroid models that fall from above under gravity, bounce on the floor (`floorY = -2.2`), and push each other apart on collision. Hovering a polaroid extracts it to float closer to the camera and scale up.

### 1.4 Background Video Scrubbing
- Three background videos are loaded directly from the `public` directory: `/stickers.mp4`, `/magnets.mp4`, `/polaroids.mp4`.
- They are rendered as absolute-positioned `<video>` tags under the canvas with `opacity` depending on the active section (set to `0.35` for the active section, `0` otherwise, with a `1.2s` opacity transition).
- Video frames are scrubbed programmatically in a `requestAnimationFrame` loop by interpolating `smoothProgress.current` towards `virtualProgress.current` and setting `video.currentTime = smoothProgress.current * video.duration`.

### 1.5 Project Dependencies
- **Dependencies**: React 19, react-dom 19, Three.js, `@react-three/fiber` (R3F), `@react-three/drei`, GSAP (GreenSock), framer-motion (for page transitions), canvas-confetti, lucide-react.
- **DevDependencies**: Vite 8, ESLint 10, `@vitejs/plugin-react`.

---

## 2. E2E Test Case Design Methodology

Since E2E testing must operate as an **opaque-box** system, we cannot directly inspect R3F internal states, React state variables, or Three.js scene graphs. Instead, we must simulate real browser inputs (mouse movements, clicks, wheel scrolling, touch gestures, screen resizing) and assert against:
1. **DOM Elements**: Visibility, text changes, classes (like `.active` on nav buttons and dots), presence/absence of loading screen.
2. **Video Element States**: Opacity properties, play status, current time adjustments.
3. **Canvas Visual Outputs**: Visual regression testing (snapshot comparisons) of the WebGL canvas.
4. **Pointer Interaction Feedbacks**: Triggering hover-peel shaders, magnet snaps, and polaroid extractions by dispatching mouse events at calculated coordinates.

We apply the **4-Tier Test Case Design Methodology**:
- **Tier 1: Feature Coverage (Category-Partition)**: Asserts the happy path for all features.
- **Tier 2: Boundary & Edge Cases (BVA)**: Asserts extreme inputs, boundary limits, and environmental edge cases.
- **Tier 3: Cross-Feature Interaction (Pairwise)**: Asserts transitions and interference between distinct features.
- **Tier 4: Application-Level Scenarios (Workload)**: Simulates end-to-end user workflows and continuous usage stress tests.

---

## 3. Comprehensive E2E Test Cases (N = 5 Features)

Given **N = 5** core features:
1. **State Routing & UI Transitions** (Nav links, CTA, indicator dots, scroll wheel, touch swipe)
2. **Hero Space & Cursor Repulsion** (Floating orbiting meshes, camera rig pan, cursor repulsion physics)
3. **Interactive Glossy Stickers** (Custom vertex shader corner-peel, holo sweep, mouse tilt, video scrubbing)
4. **Refractive Magnets & Snap Tracking** (Glassmorphic transmission, magnetic snapping, break-snap velocity)
5. **Polaroids Pile & Physics Collisions** (Staggered drop gravity, floor bounce, card overlap collisions, hover-extraction)

We define **60 test cases** (Tier 1: 25, Tier 2: 25, Tier 3: 5, Tier 4: 5) matching the formula `11*N + max(5, N/2)`:

### Tier 1: Feature Coverage Tests (5 * N = 25 Cases)

| Test ID | Feature Reference | Test Case Title | Test Objective / Verification Step | Expected Result |
|---|---|---|---|---|
| **TC-1.1** | Feature 1: Navigation | Click Header Nav Link 1 | Click "Glossy Stickers" in header. | Page transitions to Section 1. Nav button 1 and Dot button 1 gain `.active` class. |
| **TC-1.2** | Feature 1: Navigation | Click Header Nav Link 2 | Click "Refractive Magnets" in header. | Page transitions to Section 2. Nav button 2 and Dot button 2 gain `.active` class. |
| **TC-1.3** | Feature 1: Navigation | Click Header Nav Link 3 | Click "Polaroids Pile" in header. | Page transitions to Section 3. Nav button 3 and Dot button 3 gain `.active` class. |
| **TC-1.4** | Feature 1: Navigation | Click CTA Button | Click `.cta-button` in the main content card. | Section transitions to the next experience (e.g., from 0 to 1). |
| **TC-1.5** | Feature 1: Navigation | Click Footer Indicator Dot | Click third dot button `.dots-indicator .dot-btn` (index 2). | Section transitions directly to Section 2 (Refractive Magnets). |
| **TC-2.1** | Feature 2: Hero Scene | Loading Screen Dismissal | Load page and wait 1.8 seconds. | `.loading-wipe` is removed from DOM. Hero scene content card is visible. |
| **TC-2.2** | Feature 2: Hero Scene | Camera Rig Panning | Simulate mouse move to coordinate `[X: 100, Y: 100]`. | WebGL Canvas changes pixels (camera pans to follow cursor). |
| **TC-2.3** | Feature 2: Hero Scene | Orbiting Meshes Rendered | Visual snapshot comparison of the canvas during orbit. | At least some polaroid and sticker meshes are visible orbiting the center. |
| **TC-2.4** | Feature 2: Hero Scene | Logo Text Rendering | Verify 3D text "gnapix" and camera are loaded. | Extruded text and camera model render at the center of the viewport. |
| **TC-2.5** | Feature 2: Hero Scene | Cursor Repulsion Trigger | Place cursor close to an orbiting mesh's predicted path. | The mesh alters its trajectory, repelling away from the cursor coordinate. |
| **TC-3.1** | Feature 3: Stickers | Sticker Grid Rendered | Transition to Section 1 and perform visual check. | 5 interactive stickers render in a layout configuration. |
| **TC-3.2** | Feature 3: Stickers | Corner Peel Shader Hover | Move cursor over a sticker mesh's corner (e.g., bottom-right). | Shader uniform updates, curling the sticker corner (verified via pixel diff). |
| **TC-3.3** | Feature 3: Stickers | Holographic Sweep Shader | Keep cursor hovered over a sticker. | Fragment shader displays a rolling rainbow sweep over time. |
| **TC-3.4** | Feature 3: Stickers | Sticker Cursor Tilt | Move cursor around the hovered sticker boundary. | The sticker model tilts dynamically following the mouse position. |
| **TC-3.5** | Feature 3: Stickers | Video Opacity and Source | Transition to Section 1. Check video elements. | `/stickers.mp4` video opacity becomes `0.35`. Other videos have opacity `0`. |
| **TC-4.1** | Feature 4: Magnets | Section Content Visibility | Transition to Section 2. Verify DOM card content. | Tagline displays "Crystal Clear Acrylic", title displays "Glassmorphic Magnets". |
| **TC-4.2** | Feature 4: Magnets | Video Opacity and Source | Transition to Section 2. Check video elements. | `/magnets.mp4` video opacity becomes `0.35`. Other videos have opacity `0`. |
| **TC-4.3** | Feature 4: Magnets | Snap-to-Cursor Trigger | Hover cursor near magnet default position (e.g., center-left). | Magnet snaps directly to the cursor coordinate (tested when scene is active). |
| **TC-4.4** | Feature 4: Magnets | Snapped Drag Tilt | Drag snapped magnet across the canvas. | Magnet tilts in the direction of the drag vector (tested when scene is active). |
| **TC-4.5** | Feature 4: Magnets | Snap Release | Move cursor quickly to break the magnet snap. | Magnet detaches from the cursor and lerps back to its grid slot. |
| **TC-5.1** | Feature 5: Polaroids | Polaroid Grid Rendered | Transition to Section 3. Verify page. | 6 polaroids are visible on screen. |
| **TC-5.2** | Feature 5: Polaroids | Falling Physics Drop | Transition to Section 3, wait 1.0s. | Polaroids drop from the top, accelerate down, and bounce at the floor line. |
| **TC-5.3** | Feature 5: Polaroids | Collision Push Resolution | Wait for all 6 polaroids to land on the floor. | Polaroids push each other horizontally to resolve overlaps (avoiding Z-fighting). |
| **TC-5.4** | Feature 5: Polaroids | Hover Extraction Inspect | Hover over Polaroid #2. | Polaroid #2 floats to the foreground, scales up by 1.5x, and tilts with mouse. |
| **TC-5.5** | Feature 5: Polaroids | Polaroid Release Drop | Move cursor away from the extracted Polaroid #2. | Polaroid #2 falls back down to the floor pile and collides with other cards. |

---

### Tier 2: Boundary & Edge Cases (5 * N = 25 Cases)

| Test ID | Feature Reference | Test Case Title | Test Objective / Verification Step | Expected Result |
|---|---|---|---|---|
| **TC-6.1** | Feature 1: Navigation | Scroll Down from Section 0 | Dispatch positive `deltaY` (scroll down) on Section 0. | Transition to Section 1 (Glossy Stickers) occurs. |
| **TC-6.2** | Feature 1: Navigation | Scroll Up from Section 0 | Dispatch negative `deltaY` (scroll up) on Section 0. | Active section remains Section 0. `virtualProgress` stays locked at `0.0`. |
| **TC-6.3** | Feature 1: Navigation | Scroll Down from Section 3 | Dispatch positive `deltaY` (scroll down) on Section 3. | Active section remains Section 3. `virtualProgress` stays locked at `1.0`. |
| **TC-6.4** | Feature 1: Navigation | Sub-Threshold Scroll | Dispatch tiny scroll delta (e.g. `deltaY = 5`). | Section does not transition. `virtualProgress` increments but stays within bounds. |
| **TC-6.5** | Feature 1: Navigation | Rapid Touch Swipe Limits | Dispatch multi-touch swipe up gesture on mobile viewport. | System interprets only the single tracking touch, transitioning safely. |
| **TC-7.1** | Feature 2: Hero Scene | Extreme Pointer Out Bounds | Move cursor to coordinate `[-1000, -1000]` (outside window). | Camera rig panning clamps at limits. Orbiting objects resume default orbits. |
| **TC-7.2** | Feature 2: Hero Scene | Zero Repulsion Center | Place cursor exactly at coordinate `[0, 0]` (screen center). | Camera rig is neutral. Meshes orbit normally with no cursor repulsion force. |
| **TC-7.3** | Feature 2: Hero Scene | Repulsion Velocity Ceiling | Sweep mouse across the screen at extremely high speed. | Meshes repel, but velocities clamp so meshes do not exit canvas or glitch. |
| **TC-7.4** | Feature 2: Hero Scene | Viewport Aspect Ratio Resize | Rapidly resize window from 1920x1080 to 800x1200. | Three.js viewport scale is adjusted, keeping orbits visible and proportional. |
| **TC-7.5** | Feature 2: Hero Scene | Overlapping Mesh Hover | Hover cursor where two orbits overlap. | Repulsion force applies to both meshes based on their individual distance. |
| **TC-8.1** | Feature 3: Stickers | Background Scrubbing BVA (Zero) | Scroll slightly down in Section 1. Scroll back up. | `/stickers.mp4` video `currentTime` scrubs forward, then locks back at `0.0`. |
| **TC-8.2** | Feature 3: Stickers | Background Scrubbing BVA (Max) | Scroll down until just before section transitions to Section 2. | `/stickers.mp4` video `currentTime` scrubs to its maximum duration. |
| **TC-8.3** | Feature 3: Stickers | Hover Corner Projection | Hover sticker at the extreme corner on a 4K viewport. | WebGL raycasting maps the cursor coordinates correctly to the sticker mesh. |
| **TC-8.4** | Feature 3: Stickers | High Frequency Hover Toggle | Hover in and out of a sticker 10 times in 1 second. | Shader uniform `uHover` lerps back and forth smoothly without graphical errors. |
| **TC-8.5** | Feature 3: Stickers | Mobile Scale Layout | Emulate mobile screen size (width 375px). | Sticker grid scale adjusts down (`layoutScale = viewport.width / 9.0`). |
| **TC-9.1** | Feature 4: Magnets | Background Scrubbing BVA (Zero) | Scroll down, then scroll up to Section 2. | `/magnets.mp4` video `currentTime` scrubs forward and back to `0.0`. |
| **TC-9.2** | Feature 4: Magnets | Snap Detection Radius Limit | Hover cursor exactly `0.49` units away from magnet center. | Magnet snaps to the cursor (tested when scene is active). |
| **TC-9.3** | Feature 4: Magnets | Snap Detection Outside Boundary | Hover cursor exactly `0.51` units away from magnet center. | Magnet does not snap, only hovers and floats up slightly. |
| **TC-9.4** | Feature 4: Magnets | Exact Break-Snap Velocity | Move mouse at speed `25.1` units/sec away from snapped magnet. | Snapped state immediately toggles to false; magnet returns to grid. |
| **TC-9.5** | Feature 4: Magnets | Sub Break-Snap Velocity | Move mouse at speed `24.9` units/sec. | Snap is maintained; magnet follows the cursor. |
| **TC-10.1** | Feature 5: Polaroids | Throttled CPU Fall Physics | Set CPU throttling to 6x. Transition to Section 3. | Falling polaroids bounce correctly at `floorY = -2.2` without clipping through. |
| **TC-10.2** | Feature 5: Polaroids | Multiple Polaroid Hover | Sweep cursor quickly across multiple polaroids on the floor. | Only one polaroid (usually the one first hovered/on top) extracts at a time. |
| **TC-10.3** | Feature 5: Polaroids | Reset Pile State on Transition | Hover a card to extract it, then click Nav Link 0. | Polaroid resets back to gravity pile; canvas resources are cleared. |
| **TC-10.4** | Feature 5: Polaroids | Dynamic Floor Resize | Resize window height during card drop. | `floorY` level updates and cards adjust their landing height dynamically. |
| **TC-10.5** | Feature 5: Polaroids | Overlapping Z-Index Select | Hover two overlapping cards at their overlap point. | The card with the higher Z-index is extracted. |

---

### Tier 3: Cross-Feature Interaction Cases (N = 5 Cases)

| Test ID | Interacting Features | Test Case Title | Test Objective / Verification Step | Expected Result |
|---|---|---|---|---|
| **TC-11.1** | Nav Routing & Hover Repulsion | Section transition during hover | Hover an item in Hero Scene, and simultaneously scroll down to transition. | Active section changes. Hover states in Hero Scene are cleaned up; Section 1 loads. |
| **TC-11.2** | Polaroid Pile & Viewport Resize | Layout resize during inspection | Hover polaroid to extract it, then drag-resize the browser window. | Polaroid remains extracted at `[0, 0, 1.8]` relative to the camera, while scale adjusts. |
| **TC-11.3** | Video Scrubbing & Network Offline | Offline media requests | Block video files in network requests, and navigate between sections. | UI transitions work normally. Canvas scenes render and function without crashing. |
| **TC-11.4** | Mobile Swipe & Nav Clicks | Dual input method stress | Swipe up on screen while simultaneously tapping a header nav link. | Navigation link click takes precedence. App transitions to the clicked section. |
| **TC-11.5** | Video Cache & Section Route | Media state toggle on route | Navigate from Section 1 (Stickers) to Section 3 (Polaroids) immediately. | Stickers video opacity goes to `0`, Polaroids video opacity goes to `0.35` in `1.2s`. |

---

### Tier 4: Application-Level Scenarios (max(5, N/2) = 5 Cases)

| Test ID | Scenario Name | Test Case Steps | Target User Behavior / Real-world Flow | Expected Result |
|---|---|---|---|---|
| **TC-12.1** | Standard Visual Walkthrough | 1. Access page, wait for loading. <br>2. Move mouse to repel items in Hero Space. <br>3. Click "Next Experience". <br>4. Hover Sticker 2. <br>5. Scroll wheel down to Magnets. <br>6. Scroll wheel down to Polaroids. <br>7. Hover Polaroid 4 to inspect. <br>8. Click Nav Link "Hero Space". | Emulates a typical desktop user exploring all sections in order. | Smooth transition, no console errors, correct videos activate, shader uniforms update. |
| **TC-12.2** | Rapid Navigation Stress Test | 1. Access page. <br>2. Fast-click header buttons in sequence: 1 -> 3 -> 0 -> 2 -> 3 -> 1. <br>3. Monitor browser memory and console logs. | Tests robustness of the WebGL state cleaning and video loading/scrubbing under rapid routing. | No WebGL context loss, memory remains stable, active classes match current state. |
| **TC-12.3** | Mobile Touch Journey | 1. Emulate iPhone 12. <br>2. Swipe up twice to reach Section 2. <br>3. Drag cursor around (simulate touch move). <br>4. Swipe up to Section 3. <br>5. Touch-hold on Polaroid 1 to inspect. <br>6. Tap Header Link "Hero Space". | Tests user journey on mobile viewport with touch events. | Correct mobile scaling (`layoutScale`), touch gestures successfully scroll pages and scrub videos. |
| **TC-12.4** | Deep Asset Inspect Scenario | 1. Route directly to Section 3 (Polaroids). <br>2. Hover Polaroid 5. Wait 3 seconds. <br>3. Move mouse to inspect. <br>4. Unhover. <br>5. Scroll up to Section 1. <br>6. Hover Sticker 1. | Tests user focusing deeply on inspectable items across multiple sections. | Hover states activate/deactivate cleanly, 3D meshes scale and tilt appropriately. |
| **TC-12.5** | Continuous Scrubbing & Interaction | 1. Scroll down and up continuously in Section 1 (scrubbing video forward/back). <br>2. Hover multiple stickers during scrubbing. <br>3. Transition to Section 3. <br>4. Hover multiple falling polaroids. | Simulates an highly interactive user stressing both the video playback and physics loop. | Video scrubs smoothly without flashing, canvas rendering remains at 60 FPS. |

---

## 4. Playwright Setup & Implementation Plan

### 4.1 Environment Assessment
- **Node.js**: `v24.15.0` is installed.
- **NPM**: `11.12.1` is installed.
- **Feasibility**: Playwright is fully compatible with this environment.
- **Special Consideration**: Because this is a WebGL application, we must:
  - Run Playwright with GPU acceleration enabled if possible, or headful on local setups to avoid canvas render issues (alternatively, use Software Rendering via mesa drivers in CI).
  - Use visual regression testing (`toHaveScreenshot`) to verify the custom shaders and R3F canvas positions since we cannot access WebGL nodes via standard DOM locators.
  - Dispatch pointer events directly on the `<canvas>` element at exact bounding box coordinates.

### 4.2 Proposed package.json Adjustments
To integrate Playwright, the following dependencies and scripts should be added:

#### Script Additions (lines 6-11 of `package.json`):
```json
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:codegen": "playwright test codegen"
```

#### DevDependency Additions (lines 24-34 of `package.json`):
```json
    "@playwright/test": "^1.49.0"
```

### 4.3 Proposed Playwright Configuration (`playwright.config.js`)
We propose creating `playwright.config.js` in the root directory:

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Ensure WebGL works correctly in headless browsers
    launchOptions: {
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist']
    }
  },
  // Automatically start Vite server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 10 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
```

### 4.4 Co-Located E2E Test Strategy & File Location
Following the project layout constraints, the tests will be co-located. We will place the test files under `src/tests/` (e.g., `src/tests/App.e2e.spec.js`) to keep test files near `src/App.jsx`.

#### Example E2E Test Code Sketch (`src/tests/App.e2e.spec.js`):
```javascript
import { test, expect } from '@playwright/test';

test.describe('Gnapix Portfolio E2E Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local server
    await page.goto('/');
    // Assert and wait for the loading screen to be dismissed
    await expect(page.locator('.loading-wipe')).toBeVisible();
    await expect(page.locator('.loading-wipe')).toBeHidden({ timeout: 5000 });
  });

  test('TC-1.1: Clicking nav link transitions to Glossy Stickers', async ({ page }) => {
    // Click nav link
    const stickersBtn = page.locator('.nav-links button').nth(1);
    await expect(stickersBtn).toHaveText('Glossy Stickers');
    await stickersBtn.click();

    // Verify active routing classes in DOM
    await expect(stickersBtn).toHaveClass(/active/);
    await expect(page.locator('.dots-indicator .dot-btn').nth(1)).toHaveClass(/active/);

    // Verify content card values updated
    await expect(page.locator('.section-title')).toHaveText('Glossy. Waterproof.');
  });

  test('TC-6.1: Scroll down transitions section', async ({ page }) => {
    // Verify initial section is Hero Space
    await expect(page.locator('.nav-links button').nth(0)).toHaveClass(/active/);

    // Dispatch scroll event on the window/canvas wrapper
    await page.locator('.ui-fullscreen-wrapper').evaluate((el) => {
      const event = new WheelEvent('wheel', { deltaY: 200, bubbles: true });
      window.dispatchEvent(event);
    });

    // Wait for the lerp logic to transition section
    await page.waitForTimeout(500);

    // Verify active section has changed
    await expect(page.locator('.nav-links button').nth(1)).toHaveClass(/active/);
  });

  test('TC-2.5: Cursor repulsion visual check', async ({ page }) => {
    // Take base snapshot of Hero scene
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(500); // Wait for orbit to stabilize
    const baseSnapshot = await canvas.screenshot();

    // Move cursor to center of the canvas
    const box = await canvas.boundingBox();
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    await page.mouse.move(centerX, centerY);
    await page.waitForTimeout(200); // Wait for repulsion force to apply

    // Verify visual change occurs in WebGL canvas
    const hoveredSnapshot = await canvas.screenshot();
    expect(baseSnapshot).not.toEqual(hoveredSnapshot);
  });
});
```
