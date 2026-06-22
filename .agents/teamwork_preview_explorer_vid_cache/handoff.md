# Handoff Report: Video Caching and Smooth Scrubbing Analysis

## 1. Observation
- **File Paths and Lines**:
  - `src/App.jsx:717-768`: The `<video>` tags are defined with raw string sources like `/stickers.mp4` and `preload="auto"` style opacity configurations:
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
  - `src/App.jsx:557-562`: A hardcoded timeout sets `loading` to false after 1.5 seconds, regardless of whether video data is cached or loaded:
    ```javascript
    useEffect(() => {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }, []);
    ```
  - `src/App.jsx:565-583`: The update function updates `currentTime` on the active video in every single frame cycle in a `requestAnimationFrame` loop, checked by `readyState >= 2`:
    ```javascript
    const updateScrubbing = () => {
      // Lerp smoothProgress towards virtualProgress
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
  - `src/App.jsx:541-545`: The `videoRefs` maps index `1`, `2`, and `3` to sticker, magnet, and polaroid video refs respectively:
    ```javascript
    const videoRefs = useMemo(() => ({
      1: vidRefStickers,
      2: vidRefMagnets,
      3: vidRefPolaroids
    }), [vidRefStickers, vidRefMagnets, vidRefPolaroids]);
    ```

---

## 2. Logic Chain
1. **Observation 1 (No In-Memory Cache)**: Because videos use direct path strings (`/stickers.mp4`), the browser fetches frames on-demand via range requests during scrubbing. Under rapid scroll operations, this causes network-bound buffering, resulting in blank/black frames.
2. **Observation 2 (Transition Flash)**: Resets to `smoothProgress` occur simultaneously with `activeSection` state changes. The target video element begins its `1.2s` opacity fade-in while simultaneously initiating a seek from its previous position. Seeking is asynchronous, so for the first few frames, the video displays its old frame or goes blank before the seek resolves.
3. **Observation 3 (Decoder Thrashing)**: Because the `updateScrubbing` loop updates `.currentTime` on every single frame without checking if the seek delta is significant, it forces the browser's video decoder to process too many concurrent seek calls. This causes hardware decoding lag, dropped frames, and visible flashing.
4. **Conclusion**: Migrating to fetch-based Blob caching (`URL.createObjectURL(blob)`), ensuring videos pre-seek *before* fading in, and applying a seek threshold of 30ms will eliminate these latency bottlenecks and resolve the flashing/black frames.

---

## 3. Caveats
- Since this is a read-only investigation, the proposed code changes were not run or tested directly on target browsers.
- Browser-specific behavior on mobile devices (e.g., aggressive video decoder resource eviction on iOS Safari) could still trigger brief delays if the video element is kept completely inactive for a long time. However, the proposed Blob URL caching and hardware acceleration styles minimize this risk.

---

## 4. Conclusion
We have established a concrete four-phase implementation plan:
1. **Fetch & Blob caching** during the page load stage (tied directly to the React `loading` screen state).
2. **Pre-transition seek reset** to initialize the correct starting/ending frame of a video *before* its opacity transition starts.
3. **Seek-thresholding** (30ms delta guard) in the `requestAnimationFrame` loop to prevent decoder thrashing.
4. **CSS Promotion** to promote videos to their own GPU layers.
Applying this plan will solve the acceptance criteria for Milestone 2.

---

## 5. Verification Method
- **Check Analysis File**: Confirm that `analysis.md` has been successfully created and contains the technical details of the proposed plan.
- **Inspect App.jsx**: Verify that the line numbers and code snippets cited in this handoff map exactly to the source files.
- **Implementation Validation**: When the implementer applies the plan, verify that:
  - Video sources in the HTML inspector use `blob:http://...` instead of `/stickers.mp4`.
  - Continuous scrubbing does not request any additional bytes in the Network tab.
  - Video transition between screens occurs smoothly without showing old frames or flashing black.
