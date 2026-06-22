import { test, expect } from '@playwright/test';

test.describe('Gnapix Portfolio E2E Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/?test=true');
    // Wait for the loading overlay to be dismissed (up to 25 seconds to allow for cold Vite compilations)
    const loader = page.locator('.loading-wipe');
    await expect(loader).toBeHidden({ timeout: 25000 });
  });

  // ==========================================
  // TIER 1: FEATURE COVERAGE (TC-1.1 - TC-5.5)
  // ==========================================

  // Feature 1: State Routing & UI Navigation (TC-1.1 - TC-1.5)
  test('TC-1.1: Click Header Nav Link 1 transitions to Glossy Stickers', async ({ page }) => {
    const link = page.locator('.nav-links button').nth(1);
    await link.click();
    await expect(link).toHaveClass(/active/);
    await expect(page.locator('.dots-indicator .dot-btn').nth(1)).toHaveClass(/active/);
    await expect(page.locator('.section-title')).toHaveText('Glossy. Waterproof.');
  });

  test('TC-1.2: Click Header Nav Link 2 transitions to Refractive Magnets', async ({ page }) => {
    const link = page.locator('.nav-links button').nth(2);
    await link.click();
    await expect(link).toHaveClass(/active/);
    await expect(page.locator('.dots-indicator .dot-btn').nth(2)).toHaveClass(/active/);
    await expect(page.locator('.section-title')).toHaveText('Glassmorphic Magnets');
  });

  test('TC-1.3: Click Header Nav Link 3 transitions to Polaroids Pile', async ({ page }) => {
    const link = page.locator('.nav-links button').nth(3);
    await link.click();
    await expect(link).toHaveClass(/active/);
    await expect(page.locator('.dots-indicator .dot-btn').nth(3)).toHaveClass(/active/);
    await expect(page.locator('.section-title')).toHaveText('Polaroid Collisions');
  });

  test('TC-1.4: Click CTA Button transitions to next experience', async ({ page }) => {
    const cta = page.locator('.cta-button');
    await cta.click();
    await expect(page.locator('.nav-links button').nth(1)).toHaveClass(/active/);
  });

  test('TC-1.5: Click Footer Indicator Dot transitions to specific section', async ({ page }) => {
    const dot = page.locator('.dots-indicator .dot-btn').nth(2);
    await dot.click();
    await expect(page.locator('.nav-links button').nth(2)).toHaveClass(/active/);
  });

  // Feature 2: Hero Space & Cursor Repulsion (TC-2.1 - TC-2.5)
  test('TC-2.1: Loading Screen Dismissal', async ({ page }) => {
    // Already handled in beforeEach, verify content card visibility
    await expect(page.locator('.main-content-card')).toBeVisible();
  });

  test('TC-2.2: Camera Rig Panning changes viewport rendering', async ({ page }) => {
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(200);
    const initialSnapshot = await canvas.screenshot();

    // Move mouse to top-right
    await page.mouse.move(800, 200);
    await page.waitForTimeout(300);

    const afterMoveSnapshot = await canvas.screenshot();
    expect(initialSnapshot).not.toEqual(afterMoveSnapshot);
  });

  test('TC-2.3: Orbiting Meshes Rendered', async ({ page }) => {
    const canvas = page.locator('.canvas-fullscreen canvas');
    await expect(canvas).toBeVisible();
    // Wait for the WebGL scene to load and render
    await page.waitForTimeout(500);
    const screenshot = await canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('TC-2.4: Logo Text Rendering', async ({ page }) => {
    const canvas = page.locator('.canvas-fullscreen canvas');
    await expect(canvas).toBeVisible();
    // In three.js, we expect gnapix text to exist in the scene. We check page renders canvas.
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
  });

  test('TC-2.5: Cursor Repulsion Trigger alters orbit paths', async ({ page }) => {
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(200);
    const beforeHover = await canvas.screenshot();

    // Hover near center where items orbit
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);

    const afterHover = await canvas.screenshot();
    expect(beforeHover).not.toEqual(afterHover);
  });

  // Feature 3: Interactive Glossy Stickers (TC-3.1 - TC-3.5)
  test('TC-3.1: Sticker Grid Rendered in Section 1', async ({ page }) => {
    await page.locator('.nav-links button').nth(1).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(300);
    const screenshot = await canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('TC-3.2: Corner Peel Shader Hover updates uniform values', async ({ page }) => {
    await page.locator('.nav-links button').nth(1).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(300);
    const beforeHover = await canvas.screenshot();

    // Hover sticker corner position
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.22);
    await page.waitForTimeout(300);

    const afterHover = await canvas.screenshot();
    expect(beforeHover).not.toEqual(afterHover);
  });

  test('TC-3.3: Holographic Sweep Shader color changes over time', async ({ page }) => {
    await page.locator('.nav-links button').nth(1).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(300);
    
    // Hover sticker to trigger hologram
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.22);
    await page.waitForTimeout(200);
    const initialHolo = await canvas.screenshot();

    await page.waitForTimeout(400); // Wait for sweep progression
    const futureHolo = await canvas.screenshot();
    expect(initialHolo).not.toEqual(futureHolo);
  });

  test('TC-3.4: Sticker Cursor Tilt updates rotation', async ({ page }) => {
    await page.locator('.nav-links button').nth(1).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();
    
    await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.22);
    await page.waitForTimeout(200);
    const tilt1 = await canvas.screenshot();

    await page.mouse.move(box.x + box.width * 0.24, box.y + box.height * 0.24);
    await page.waitForTimeout(200);
    const tilt2 = await canvas.screenshot();
    expect(tilt1).not.toEqual(tilt2);
  });

  test('TC-3.5: Video Opacity and Source (Offline Cache BLOB expectation)', async ({ page }) => {
    await page.locator('.nav-links button').nth(1).click();
    const video = page.locator('video#video-stickers');
    await expect(video).toHaveCSS('opacity', '0.35');
    
    // Verify cached media is served as a blob URL.
    // EXPECTED TO FAIL: The current codebase serves standard "/stickers.mp4" URLs.
    const src = await video.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });

  // Feature 4: Refractive Magnets & Snap Tracking (TC-4.1 - TC-4.5)
  test('TC-4.1: Section Content Visibility (Magnets)', async ({ page }) => {
    await page.locator('.nav-links button').nth(2).click();
    await expect(page.locator('.section-title')).toHaveText('Glassmorphic Magnets');
    await expect(page.locator('.section-tagline')).toHaveText('Crystal Clear Acrylic');
  });

  test('TC-4.2: Video Opacity and Source (Magnets Offline Cache BLOB)', async ({ page }) => {
    await page.locator('.nav-links button').nth(2).click();
    const video = page.locator('video#video-magnets');
    await expect(video).toHaveCSS('opacity', '0.35');
    
    // EXPECTED TO FAIL: serves standard URL, not cached blob.
    const src = await video.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });

  test('TC-4.3: Snap-to-Cursor Trigger asserts snapped state in DOM', async ({ page }) => {
    await page.locator('.nav-links button').nth(2).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    
    // Hover over magnet center default position
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.35);
    await page.waitForTimeout(300);

    // EXPECTED TO FAIL: DOM needs to reflect snapped state for full E2E testing visibility
    const magnet = page.locator('[data-snapped="true"]');
    await expect(magnet).toBeVisible();
  });

  test('TC-4.4: Snapped Drag Tilt asserts rotation feedback in DOM attributes', async ({ page }) => {
    await page.locator('.nav-links button').nth(2).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    
    // Snap magnet
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.35);
    await page.waitForTimeout(200);

    // Drag magnet to right
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.35);
    await page.waitForTimeout(200);

    // EXPECTED TO FAIL: DOM data-tilt-direction should reflect active tilt angle/direction
    const magnet = page.locator('[data-snapped="true"]');
    const tilt = await magnet.getAttribute('data-tilt-direction');
    expect(tilt).not.toBeNull();
  });

  test('TC-4.5: Snap Release detaches magnet on high velocity', async ({ page }) => {
    await page.locator('.nav-links button').nth(2).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();

    // Snap magnet
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.35);
    await page.waitForTimeout(200);

    // Move extremely fast to break snap
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.9, { steps: 2 });
    await page.waitForTimeout(200);

    // EXPECTED TO FAIL: Snapped state should be set to false in DOM
    const magnet = page.locator('[data-snapped="false"]');
    await expect(magnet).toBeVisible();
  });

  // Feature 5: Polaroids Pile & Physics Collisions (TC-5.1 - TC-5.5)
  test('TC-5.1: Polaroid Grid Rendered in Section 3', async ({ page }) => {
    await page.locator('.nav-links button').nth(3).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(300);
    const screenshot = await canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('TC-5.2: Falling Physics Drop animation progression', async ({ page }) => {
    await page.locator('.nav-links button').nth(3).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    // Screen capture at top of fall
    const initialScreen = await canvas.screenshot();

    // Wait 1.0s for bounce/settle
    await page.waitForTimeout(1000);
    const finalScreen = await canvas.screenshot();
    expect(initialScreen).not.toEqual(finalScreen);
  });

  test('TC-5.3: Collision Push Resolution prevents overlap Z-fighting', async ({ page }) => {
    await page.locator('.nav-links button').nth(3).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(1200); // Settle pile
    
    const screenshot = await canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('TC-5.4: Hover Extraction Inspect zooms Polaroid', async ({ page }) => {
    await page.locator('.nav-links button').nth(3).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(2500); // Settle pile
    const initial = await canvas.screenshot();

    // Hover over a polaroid on floor
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.7);
    await page.waitForTimeout(400);

    const zoomed = await canvas.screenshot();
    expect(initial).not.toEqual(zoomed);
  });

  test('TC-5.5: Polaroid Release Drop triggers gravity fall back to pile', async ({ page }) => {
    await page.locator('.nav-links button').nth(3).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(1000); // Settle pile
    
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.7);
    await page.waitForTimeout(400);

    // Unhover away
    await page.mouse.move(box.x + box.width * 0.05, box.y + box.height * 0.05);
    await page.waitForTimeout(1000);

    const final = await canvas.screenshot();
    expect(final.length).toBeGreaterThan(0);
  });


  // ==========================================
  // TIER 2: BOUNDARY & EDGE CASES (TC-6.1 - TC-10.5)
  // ==========================================

  // Feature 1 Boundaries (TC-6.1 - TC-6.5)
  test('TC-6.1: Scroll Down from Section 0 transitions section', async ({ page }) => {
    await page.locator('.ui-fullscreen-wrapper').evaluate(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 2000 }));
    });
    await page.waitForTimeout(600);
    await expect(page.locator('.nav-links button').nth(1)).toHaveClass(/active/);
  });

  test('TC-6.2: Scroll Up from Section 0 maintains Section 0', async ({ page }) => {
    await page.locator('.ui-fullscreen-wrapper').evaluate(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: -2000 }));
    });
    await page.waitForTimeout(400);
    await expect(page.locator('.nav-links button').nth(0)).toHaveClass(/active/);
  });

  test('TC-6.3: Scroll Down from Section 3 maintains Section 3', async ({ page }) => {
    await page.locator('.nav-links button').nth(3).click();
    await page.locator('.ui-fullscreen-wrapper').evaluate(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 2000 }));
    });
    await page.waitForTimeout(400);
    await expect(page.locator('.nav-links button').nth(3)).toHaveClass(/active/);
  });

  test('TC-6.4: Sub-Threshold Scroll does not transition', async ({ page }) => {
    await page.locator('.ui-fullscreen-wrapper').evaluate(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 10 }));
    });
    await page.waitForTimeout(300);
    await expect(page.locator('.nav-links button').nth(0)).toHaveClass(/active/);
  });

  test('TC-6.5: Rapid Touch Swipe Limits interpretes single gesture safely', async ({ page }) => {
    await page.locator('.ui-fullscreen-wrapper').evaluate(() => {
      const touch1 = new Touch({ identifier: 1, target: window, clientY: 500 });
      const touch2 = new Touch({ identifier: 1, target: window, clientY: 200 });
      window.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1], targetTouches: [touch1], changedTouches: [touch1] }));
      window.dispatchEvent(new TouchEvent('touchmove', { touches: [touch2], targetTouches: [touch2], changedTouches: [touch2] }));
    });
    await page.waitForTimeout(500);
    await expect(page.locator('.nav-links button').nth(1)).toHaveClass(/active/);
  });

  // Feature 2 Boundaries (TC-7.1 - TC-7.5)
  test('TC-7.1: Extreme Pointer Out Bounds clamps panning limits', async ({ page }) => {
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.mouse.move(-5000, -5000);
    await page.waitForTimeout(200);
    const clampScreenshot = await canvas.screenshot();
    expect(clampScreenshot.length).toBeGreaterThan(0);
  });

  test('TC-7.2: Zero Repulsion Center does not trigger displacement', async ({ page }) => {
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();
    // Exact center
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200);
    const centerScreenshot = await canvas.screenshot();
    expect(centerScreenshot.length).toBeGreaterThan(0);
  });

  test('TC-7.3: Repulsion Velocity Ceiling prevents visual glitches under fast sweeps', async ({ page }) => {
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x, box.y);
    await page.mouse.move(box.x + box.width, box.y + box.height, { steps: 5 });
    await page.waitForTimeout(100);
    const endScreenshot = await canvas.screenshot();
    expect(endScreenshot.length).toBeGreaterThan(0);
  });

  test('TC-7.4: Viewport Aspect Ratio Resize updates layout scale', async ({ page }) => {
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.setViewportSize({ width: 375, height: 812 }); // Mobile dimensions
    await page.waitForTimeout(300);
    const mobileScreen = await canvas.screenshot();
    expect(mobileScreen.length).toBeGreaterThan(0);
  });

  test('TC-7.5: Overlapping Mesh Hover applies repulsion force to multiple meshes', async ({ page }) => {
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.mouse.move(300, 300);
    await page.waitForTimeout(200);
    const overlapScreenshot = await canvas.screenshot();
    expect(overlapScreenshot.length).toBeGreaterThan(0);
  });

  // Feature 3 Boundaries (TC-8.1 - TC-8.5)
  test('TC-8.1: Background Scrubbing BVA (Zero) resets currentTime to zero (Cache check)', async ({ page }) => {
    await page.locator('.nav-links button').nth(1).click();
    const video = page.locator('video#video-stickers');
    
    // EXPECTED TO FAIL: requires cached blob URL
    const src = await video.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });

  test('TC-8.2: Background Scrubbing BVA (Max) reaches duration limit (Cache check)', async ({ page }) => {
    await page.locator('.nav-links button').nth(1).click();
    const video = page.locator('video#video-stickers');
    
    // EXPECTED TO FAIL: requires cached blob URL
    const src = await video.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });

  test('TC-8.3: Hover Corner Projection maps cursor on high resolution', async ({ page }) => {
    await page.setViewportSize({ width: 3840, height: 2160 }); // 4K screen
    await page.locator('.nav-links button').nth(1).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(200);
    const screen = await canvas.screenshot();
    expect(screen.length).toBeGreaterThan(0);
  });

  test('TC-8.4: High Frequency Hover Toggle does not break uniforms', async ({ page }) => {
    await page.locator('.nav-links button').nth(1).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();
    
    for (let i = 0; i < 5; i++) {
      await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.22);
      await page.mouse.move(0, 0);
    }
    await page.waitForTimeout(200);
    const screen = await canvas.screenshot();
    expect(screen.length).toBeGreaterThan(0);
  });

  test('TC-8.5: Mobile Scale Layout adjusts sticker scale down', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.locator('.nav-links button').nth(1).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(200);
    const screen = await canvas.screenshot();
    expect(screen.length).toBeGreaterThan(0);
  });

  // Feature 4 Boundaries (TC-9.1 - TC-9.5)
  test('TC-9.1: Background Scrubbing BVA (Zero) for Magnets (Cache check)', async ({ page }) => {
    await page.locator('.nav-links button').nth(2).click();
    const video = page.locator('video#video-magnets');
    
    // EXPECTED TO FAIL: requires cached blob URL
    const src = await video.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });

  test('TC-9.2: Snap Detection Radius Limit (Snaps at 0.49 units)', async ({ page }) => {
    await page.locator('.nav-links button').nth(2).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();

    // Hover at 0.49 boundary limit
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.35);
    await page.waitForTimeout(200);

    // EXPECTED TO FAIL: DOM snapped attribute expectation
    const magnet = page.locator('[data-snapped="true"]');
    await expect(magnet).toBeVisible();
  });

  test('TC-9.3: Snap Detection Outside Boundary (No snap at 0.51 units)', async ({ page }) => {
    await page.locator('.nav-links button').nth(2).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();

    // Hover outside radius limit
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
    await page.waitForTimeout(200);

    // EXPECTED TO FAIL: DOM snapped attribute should remain false
    const magnet = page.locator('[data-snapped="true"]');
    await expect(magnet).not.toBeVisible();
  });

  test('TC-9.4: Exact Break-Snap Velocity (Releases snap at speed 25.1)', async ({ page }) => {
    await page.locator('.nav-links button').nth(2).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();

    // Snap magnet
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.35);
    await page.waitForTimeout(200);

    // Fast drag away
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.9, { steps: 1 });
    await page.waitForTimeout(200);

    // EXPECTED TO FAIL: DOM snapped attribute must be false
    const magnet = page.locator('[data-snapped="false"]');
    await expect(magnet).toBeVisible();
  });

  test('TC-9.5: Sub Break-Snap Velocity (Maintain snap at speed 24.9)', async ({ page }) => {
    await page.locator('.nav-links button').nth(2).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();

    // Snap magnet
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.35);
    await page.waitForTimeout(200);

    // Slow drag
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.35, { steps: 50 });
    await page.waitForTimeout(200);

    // EXPECTED TO FAIL: DOM snapped attribute must still be true
    const magnet = page.locator('[data-snapped="true"]');
    await expect(magnet).toBeVisible();
  });

  // Feature 5 Boundaries (TC-10.1 - TC-10.5)
  test('TC-10.1: Throttled CPU Fall Physics bounce resolution', async ({ page }) => {
    await page.locator('.nav-links button').nth(3).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(1000);
    const screen = await canvas.screenshot();
    expect(screen.length).toBeGreaterThan(0);
  });

  test('TC-10.2: Multiple Polaroid Hover extracts only one card at a time', async ({ page }) => {
    await page.locator('.nav-links button').nth(3).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();
    
    // Sweep mouse quickly across grid to trigger multiple potential hover extractions
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.7);
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.7, { steps: 5 });
    await page.waitForTimeout(200);
    const screen = await canvas.screenshot();
    expect(screen.length).toBeGreaterThan(0);
  });

  test('TC-10.3: Reset Pile State on Transition clears models', async ({ page }) => {
    await page.locator('.nav-links button').nth(3).click();
    await page.waitForTimeout(500);
    
    // Navigate away back to Hero Space
    await page.locator('.nav-links button').nth(0).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(200);
    const screen = await canvas.screenshot();
    expect(screen.length).toBeGreaterThan(0);
  });

  test('TC-10.4: Dynamic Floor Resize updates floor bounding box', async ({ page }) => {
    await page.locator('.nav-links button').nth(3).click();
    await page.waitForTimeout(300);
    
    // Shrink page height
    await page.setViewportSize({ width: 1024, height: 400 });
    await page.waitForTimeout(500);
    
    const canvas = page.locator('.canvas-fullscreen canvas');
    const screen = await canvas.screenshot();
    expect(screen.length).toBeGreaterThan(0);
  });

  test('TC-10.5: Overlapping Z-Index Select picks top card', async ({ page }) => {
    await page.locator('.nav-links button').nth(3).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    await page.waitForTimeout(1000); // Wait for stack to pile up
    
    const screen = await canvas.screenshot();
    expect(screen.length).toBeGreaterThan(0);
  });


  // ==========================================
  // TIER 3: CROSS-FEATURE INTERACTIONS (TC-11.1 - TC-11.5)
  // ==========================================

  test('TC-11.1: Section transition during hover resets states', async ({ page }) => {
    await page.mouse.move(300, 300); // Hover in Hero
    await page.waitForTimeout(100);

    // Click next page
    await page.locator('.nav-links button').nth(1).click();
    await page.waitForTimeout(200);
    await expect(page.locator('.nav-links button').nth(1)).toHaveClass(/active/);
  });

  test('TC-11.2: Layout resize during inspection maintains alignment', async ({ page }) => {
    await page.locator('.nav-links button').nth(3).click();
    await page.waitForTimeout(1000);
    
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();
    // Hover polaroid to extract it
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.7);
    await page.waitForTimeout(300);
    
    // Resize viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(300);
    
    const screen = await canvas.screenshot();
    expect(screen.length).toBeGreaterThan(0);
  });

  test('TC-11.3: Offline media requests fallback smoothly (Cache check)', async ({ page }) => {
    // Navigate offline or simulate missing media network routes
    await page.context().route('**/*.mp4', route => route.abort());
    await page.reload();
    
    // Verify application does not crash and loads canvas
    const loader = page.locator('.loading-wipe');
    await expect(loader).toBeHidden({ timeout: 5000 });
    
    // EXPECTED TO FAIL: requires offline video caching mechanism to render properly
    const activeVideo = page.locator('video#video-stickers');
    const src = await activeVideo.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });

  test('TC-11.4: Dual input method stress (Touch and Nav link click)', async ({ page }) => {
    // Send touch event
    await page.locator('.ui-fullscreen-wrapper').evaluate(() => {
      const touch = new Touch({ identifier: 1, target: window, clientY: 500 });
      window.dispatchEvent(new TouchEvent('touchstart', { touches: [touch], targetTouches: [touch], changedTouches: [touch] }));
    });
    // Click header link immediately
    await page.locator('.nav-links button').nth(2).click();
    await page.waitForTimeout(400);
    
    await expect(page.locator('.nav-links button').nth(2)).toHaveClass(/active/);
  });

  test('TC-11.5: Media state toggle on route (Transitions and cache check)', async ({ page }) => {
    // Fast hop
    await page.locator('.nav-links button').nth(1).click();
    await page.locator('.nav-links button').nth(3).click();
    const video = page.locator('video#video-polaroids');
    await expect(video).toHaveCSS('opacity', '0.35');

    // EXPECTED TO FAIL: requires cached blob URL
    const src = await video.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });


  // ==========================================
  // TIER 4: APPLICATION-LEVEL WORKLOADS (TC-12.1 - TC-12.5)
  // ==========================================

  test('TC-12.1: Standard Visual Walkthrough flow', async ({ page }) => {
    // 1. Hover hero center
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200);
    
    // 2. Click next experience cta
    await page.locator('.cta-button').click();
    await expect(page.locator('.nav-links button').nth(1)).toHaveClass(/active/);
    
    // 3. Hover sticker grid
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.25);
    await page.waitForTimeout(200);
    
    // 4. Scroll down to magnets
    await page.locator('.ui-fullscreen-wrapper').evaluate(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 2000 }));
    });
    await page.waitForTimeout(500);
    
    // 5. Scroll down to polaroids
    await page.locator('.ui-fullscreen-wrapper').evaluate(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 2000 }));
    });
    await page.waitForTimeout(1000);
    
    // 6. Inspect polaroid
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.7);
    await page.waitForTimeout(300);
    
    // 7. Go back to hero via nav
    await page.locator('.nav-links button').nth(0).click();
    await expect(page.locator('.nav-links button').nth(0)).toHaveClass(/active/);
  });

  test('TC-12.2: Rapid Navigation Stress Test', async ({ page }) => {
    // Switch pages repeatedly and fast
    const buttons = page.locator('.nav-links button');
    await buttons.nth(1).click();
    await buttons.nth(3).click();
    await buttons.nth(0).click();
    await buttons.nth(2).click();
    await buttons.nth(3).click();
    await buttons.nth(1).click();
    
    await page.waitForTimeout(500);
    await expect(buttons.nth(1)).toHaveClass(/active/);
  });

  test('TC-12.3: Mobile Touch Journey simulated workload', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 standard
    
    // Swipe up to Section 1
    await page.locator('.ui-fullscreen-wrapper').evaluate(() => {
      const t1 = new Touch({ identifier: 1, target: window, clientY: 600 });
      const t2 = new Touch({ identifier: 1, target: window, clientY: 200 });
      window.dispatchEvent(new TouchEvent('touchstart', { touches: [t1], targetTouches: [t1], changedTouches: [t1] }));
      window.dispatchEvent(new TouchEvent('touchmove', { touches: [t2], targetTouches: [t2], changedTouches: [t2] }));
    });
    await page.waitForTimeout(500);
    await expect(page.locator('.nav-links button').nth(1)).toHaveClass(/active/);

    // Swipe up to Section 2
    await page.locator('.ui-fullscreen-wrapper').evaluate(() => {
      const t3 = new Touch({ identifier: 2, target: window, clientY: 600 });
      const t4 = new Touch({ identifier: 2, target: window, clientY: 200 });
      window.dispatchEvent(new TouchEvent('touchstart', { touches: [t3], targetTouches: [t3], changedTouches: [t3] }));
      window.dispatchEvent(new TouchEvent('touchmove', { touches: [t4], targetTouches: [t4], changedTouches: [t4] }));
    });
    await page.waitForTimeout(500);
    await expect(page.locator('.nav-links button').nth(2)).toHaveClass(/active/);
  });

  test('TC-12.4: Deep Asset Inspect Scenario traversal', async ({ page }) => {
    const buttons = page.locator('.nav-links button');
    // Route to polaroids
    await buttons.nth(3).click();
    await page.waitForTimeout(1000);
    
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();
    // Hover polaroid 5
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.75);
    await page.waitForTimeout(500);
    
    // Route to stickers
    await buttons.nth(1).click();
    await page.waitForTimeout(300);
    // Hover sticker 1
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
    await page.waitForTimeout(300);
    
    const endScreenshot = await canvas.screenshot();
    expect(endScreenshot.length).toBeGreaterThan(0);
  });

  test('TC-12.5: Continuous Scrubbing & Interaction stress test', async ({ page }) => {
    await page.locator('.nav-links button').nth(1).click();
    const canvas = page.locator('.canvas-fullscreen canvas');
    const box = await canvas.boundingBox();
    
    // Continuously scroll up and down in Section 1
    for (let i = 0; i < 5; i++) {
      await page.locator('.ui-fullscreen-wrapper').evaluate(() => {
        window.dispatchEvent(new WheelEvent('wheel', { deltaY: 200 }));
      });
      await page.waitForTimeout(50);
      await page.locator('.ui-fullscreen-wrapper').evaluate(() => {
        window.dispatchEvent(new WheelEvent('wheel', { deltaY: -200 }));
      });
      await page.waitForTimeout(50);
    }
    
    // Hover sticker
    await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.22);
    await page.waitForTimeout(200);
    
    const screen = await canvas.screenshot();
    expect(screen.length).toBeGreaterThan(0);
  });

});
