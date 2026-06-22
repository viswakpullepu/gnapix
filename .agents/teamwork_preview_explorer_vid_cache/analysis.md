# Video Cache & Scrubbing Analysis Report

## 1. Executive Summary
This report analyzes the video loading, playback, and scroll-scrubbing behaviors in `src/App.jsx` for the Gnapix Premium 3D Portfolio. We identify critical bottlenecks causing black, flashing, or blank frames during scrubbing and section transitions, and propose a concrete, step-by-step implementation plan to resolve them by combining asynchronous Fetch caching (`URL.createObjectURL(blob)`), seek-threshold throttling, pre-transition seek warming, and hardware-accelerated CSS.

---

## 2. Current Implementation Analysis

### 2.1 Video Loading & References
In `src/App.jsx`, lines 717–768, the video elements are defined as follows:
```jsx
<video
  ref={vidRefStickers}
  src="/stickers.mp4"
  muted
  playsInline
  preload="auto"
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: activeSection === 1 ? 0.35 : 0,
    transition: 'opacity 1.2s ease'
  }}
/>
```
- **Observation**: Videos are linked directly to local relative server paths (`/stickers.mp4`, etc.) and rely on standard browser preloading (`preload="auto"`). There is no mechanism in place to guarantee that the videos are completely cached in memory before the loader is dismissed.
- **Loading State**: A hardcoded 1500ms `setTimeout` (lines 557–562) controls the loader screen dismissal, irrespective of whether the videos have finished loading.

### 2.2 Scroll & Swipe Scrubbing Mechanism
- **Event Binding**: `useEffect` on lines 585–653 binds `wheel` (desktop), `touchstart`, and `touchmove` (mobile) events to update `virtualProgress.current`.
- **Scrubbing Animation Loop**: A `requestAnimationFrame` loop (lines 565–583) runs on every frame:
  ```javascript
  const updateScrubbing = () => {
    smoothProgress.current = THREE.MathUtils.lerp(smoothProgress.current, virtualProgress.current, 0.08);

    const activeVideo = videoRefs[activeSection]?.current;
    if (activeVideo && activeVideo.duration) {
      if (activeVideo.readyState >= 2) {
        activeVideo.currentTime = smoothProgress.current * activeVideo.duration;
      }
    }
    animId = requestAnimationFrame(updateScrubbing);
  };
  ```
- **Ref Mapping Limitation**: The `videoRefs` object maps keys `1`, `2`, `3` to respective video elements (lines 541–545). Key `0` (Hero Space) has no video element mapped, which correctly bypasses scrubbing but causes `videoRefs[activeSection]` to be `undefined` when `activeSection === 0`.

---

## 3. Causes of Black, Blank, and Flashing Frames

Through tracing the current codebase and browser rendering lifecycles, the following four factors have been identified as the root causes of visual glitches during scrubbing and transitions:

1. **Network Latency & Buffering (No In-Memory Caching)**:
   Because the video sources are standard web URLs, seeking triggers HTTP Range Requests. If the user scrolls rapidly, the browser continuously requests new byte ranges. If the connection drops or the browser cache evicts frames, the video goes into a buffering state, rendering as a black or blank frame.
2. **Transition Seeks (Mid-Fade Jumps)**:
   When `activeSection` changes, `opacity` transitions over `1.2s` (via CSS transition). Concurrently, `virtualProgress` and `smoothProgress` reset to `0` or `1.0`. The video is forced to seek to the start/end *while* it is actively fading in. Because seeks are asynchronous, the video may display its old seek position (or a blank frame) for the first few hundred milliseconds of the fade-in, creating a jarring jump or black flash.
3. **Seek Congestion (Over-updates in rRaf Loop)**:
   Setting `.currentTime` in the `requestAnimationFrame` loop on *every frame* (60+ times per second) overwhelms the browser's video decoder. The browser cannot decode keyframes fast enough to match the scrub speed, causing skipped frames, heavy lag, and visual flashing.
4. **Browser-Specific Decoding (Safari/Chrome Idle Eviction)**:
   Modern browsers aggressively save resource consumption. Paused video elements that are not currently visible (opacity: 0) often have their decoded frame buffers evicted. When they transition back to visible, the first seek takes longer to decode, resulting in a black flash on initial fade-in.

---

## 4. Proposed Implementation Plan

We propose a four-phase optimization strategy to guarantee buttery-smooth transitions and zero black frames.

### Phase 1: Asynchronous Blob Preloading & True Page Loader Integration
- **Concept**: Fetch all three videos via standard JavaScript `fetch()`, read them as `Blob` data, and instantiate memory-cached object URLs using `URL.createObjectURL(blob)`.
- **Loader Hook**: Replace the hardcoded `setTimeout` with a loading promise chain. Only dismiss the loading screen once all three videos have been successfully loaded into browser memory.

### Phase 2: Pre-Transition Reset & Warmup Logic
- **Concept**: Reset the target video's `currentTime` to its initial target position (either `0` if scrolling down, or `video.duration` if scrolling up) *before* transitioning `activeSection`. This ensures the video has already seeked to the correct frame *before* it begins its opacity transition.
- **Decoder Warmup**: Trigger a quick programmatic play-then-pause or set the video's currentTime to `0.01` upon loading to force the browser decoder to compile the initial frames.

### Phase 3: Seek-Throttling & Thresholding
- **Concept**: Introduce a threshold of `0.03` seconds (~30ms, which aligns with standard 30fps frames) in the `requestAnimationFrame` loop. Avoid writing to `currentTime` if the scroll change is negligible.
- **ReadyState Gatekeeping**: Ensure the video is fully ready (`readyState >= 3` or `readyState >= 4`) before writing seek times.

### Phase 4: GPU Layer Promotion
- **Concept**: Apply CSS attributes (`will-change: opacity`, `transform: translate3d(0,0,0)`, and `backface-visibility: hidden`) to the video elements. This promotes them to their own GPU layers, preventing style recalculation jitter.

---

## 5. Detailed Code Proposals

These proposals outline the exact code modifications to implement in `src/App.jsx`.

### 5.1 Blob Preloader Implementation
Introduce a state to store object URLs and load them inside a `useEffect` on startup:

```javascript
const [videoUrls, setVideoUrls] = useState({
  stickers: null,
  magnets: null,
  polaroids: null
});

useEffect(() => {
  const loadVideos = async () => {
    const videoSources = {
      stickers: '/stickers.mp4',
      magnets: '/magnets.mp4',
      polaroids: '/polaroids.mp4'
    };

    try {
      const promises = Object.entries(videoSources).map(async ([key, src]) => {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        // Optional: Warm up the video decoder by briefly loading it
        const tempVideo = document.createElement('video');
        tempVideo.src = objectUrl;
        tempVideo.muted = true;
        tempVideo.playsInline = true;
        tempVideo.load();
        
        return [key, objectUrl];
      });

      const results = await Promise.all(promises);
      const urls = Object.fromEntries(results);
      setVideoUrls(urls);
      setLoading(false); // Dismiss loader screen only when ready
    } catch (err) {
      console.error("Failed to preload videos, falling back to network URLs:", err);
      setVideoUrls({
        stickers: '/stickers.mp4',
        magnets: '/magnets.mp4',
        polaroids: '/polaroids.mp4'
      });
      setLoading(false);
    }
  };

  loadVideos();

  // Cleanup object URLs on unmount to prevent memory leaks
  return () => {
    Object.values(videoUrls).forEach((url) => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  };
}, []);
```

### 5.2 Optimizing UI Video Elements
Update the video render block to use the cached `videoUrls` and hardware acceleration:

```jsx
<div style={{
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  zIndex: 1,
  pointerEvents: 'none',
  backgroundColor: '#FAF8F5'
}}>
  <video
    ref={vidRefStickers}
    src={videoUrls.stickers || undefined}
    muted
    playsInline
    preload="auto"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: activeSection === 1 ? 0.35 : 0,
      transition: 'opacity 1.2s ease',
      willChange: 'opacity',
      transform: 'translate3d(0, 0, 0)',
      backfaceVisibility: 'hidden'
    }}
  />
  <video
    ref={vidRefMagnets}
    src={videoUrls.magnets || undefined}
    muted
    playsInline
    preload="auto"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: activeSection === 2 ? 0.35 : 0,
      transition: 'opacity 1.2s ease',
      willChange: 'opacity',
      transform: 'translate3d(0, 0, 0)',
      backfaceVisibility: 'hidden'
    }}
  />
  <video
    ref={vidRefPolaroids}
    src={videoUrls.polaroids || undefined}
    muted
    playsInline
    preload="auto"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: activeSection === 3 ? 0.35 : 0,
      transition: 'opacity 1.2s ease',
      willChange: 'opacity',
      transform: 'translate3d(0, 0, 0)',
      backfaceVisibility: 'hidden'
    }}
  />
</div>
```

### 5.3 Resetting currentTime Prior to Transitions
Modify scroll handlers and layout callbacks to force the next video to seek to its start or end frame *before* active section shifts:

```javascript
// Add helper to prepare next/prev video states
const prepareVideoForSection = (targetSection, direction) => {
  const videoRef = videoRefs[targetSection]?.current;
  if (videoRef && videoRef.duration) {
    // If direction is positive (scrolling forward), set start frame
    // If direction is negative (scrolling backward), set end frame
    videoRef.currentTime = direction >= 0 ? 0 : videoRef.duration - 0.05;
  }
};

const handleSetSection = (idx) => {
  prepareVideoForSection(idx, idx > activeSection ? 1 : -1);
  setActiveSection(idx);
  virtualProgress.current = 0;
  smoothProgress.current = 0;
};
```
Integrate the same helper inside the wheel scroll listener:
```javascript
if (virtualProgress.current > 1.0) {
  if (activeSection < 3) {
    const nextSection = activeSection + 1;
    prepareVideoForSection(nextSection, 1);
    setActiveSection(nextSection);
    virtualProgress.current = 0;
    smoothProgress.current = 0;
  } else {
    virtualProgress.current = 1.0;
  }
} else if (virtualProgress.current < 0.0) {
  if (activeSection > 0) {
    const prevSection = activeSection - 1;
    prepareVideoForSection(prevSection, -1);
    setActiveSection(prevSection);
    virtualProgress.current = 1.0;
    smoothProgress.current = 1.0;
  } else {
    virtualProgress.current = 0.0;
  }
}
```

### 5.4 Seek Thresholding inside the requestAnimationFrame loop
Improve seek efficiency in `updateScrubbing`:

```javascript
useEffect(() => {
  let animId;
  const updateScrubbing = () => {
    smoothProgress.current = THREE.MathUtils.lerp(smoothProgress.current, virtualProgress.current, 0.08);

    const activeVideo = videoRefs[activeSection]?.current;
    if (activeVideo && activeVideo.duration) {
      // readyState 3 (HAVE_FUTURE_DATA) or 4 (HAVE_ENOUGH_DATA)
      if (activeVideo.readyState >= 3) {
        const targetTime = smoothProgress.current * activeVideo.duration;
        // Avoid seeking if the change is less than 30ms (prevents decoder thrashing)
        if (Math.abs(activeVideo.currentTime - targetTime) > 0.03) {
          activeVideo.currentTime = targetTime;
        }
      }
    }
    animId = requestAnimationFrame(updateScrubbing);
  };

  updateScrubbing();
  return () => cancelAnimationFrame(animId);
}, [activeSection, videoRefs]);
```
