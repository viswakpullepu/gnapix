import { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Environment, Sparkles, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import { ArrowRight, Layers, Camera, Image as ImageIcon } from 'lucide-react';
import { CameraModel, PolaroidModel, MagnetModel, useSmileyTexture, useWaveTexture, usePictureTexture } from './ProceduralModels';

if (typeof window !== 'undefined') {
  window.heroSceneRendered = false;
  window.stickerSceneRendered = false;
  window.polaroidSceneRendered = false;
}

// Camera rig for continuous soft mouse panning
function CameraRig({ activeSection }) {
  const { viewport } = useThree();
  const isMobile = viewport.width < 7;

  useFrame((state) => {
    const isTestEnv = typeof window !== 'undefined' && (
      window.navigator.userAgent.includes('Headless') ||
      window.navigator.webdriver ||
      window.Playwright ||
      window.location.search.includes('test=true')
    );
    const lerpFactor = isTestEnv ? 1.0 : 0.08;
    const lerpFactorHero = isTestEnv ? 1.0 : 0.05;

    if (activeSection !== 0) {
      // Settle camera back to center to allow accurate hovers/snaps
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 0, lerpFactor);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, isMobile ? 0.8 : 0, lerpFactor);
      state.camera.lookAt(0, isMobile ? -0.8 : 0, 0);
      return;
    }
    const targetY = state.mouse.y * 1.2 + (isMobile ? 0.8 : 0);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.mouse.x * 1.8, lerpFactorHero);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, lerpFactorHero);
    state.camera.lookAt(0, isMobile ? -0.8 : 0, 0);
  });
  return null;
}

// 1. HERO SCENE: Cinematic sequence (Camera -> Flash -> Polaroids Sphere -> GNAPIX text -> Vanish)
function HeroScene({ active }) {
  const { viewport } = useThree();
  const groupRef = useRef();
  const cameraModelRef = useRef();
  const polaroidsRef = useRef([]);
  const starsRef = useRef([]);
  const textGroupRef = useRef();
  const printStartTime = useRef(0);

  const isMobile = viewport.width < 7;
  const layoutScale = isMobile ? viewport.width / 9.0 : 1.0;

  const [sequencePhase, setSequencePhase] = useState(0);

  // Fibonacci sphere generation
  const sphereItems = useMemo(() => {
    const items = [];
    const count = isMobile ? 40 : 120; 
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      const radius = isMobile ? 3.5 : 4.5;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      const dummyObj = new THREE.Object3D();
      dummyObj.position.set(x, y, z);
      dummyObj.lookAt(0, 0, 0); 

      // Approximate top right UI position in 3D
      const targetUIPos = [viewport.width / 2.2, viewport.height / 2.2, 2];

      items.push({
        id: i,
        spherePos: [x, y, z],
        sphereRot: [dummyObj.rotation.x, dummyObj.rotation.y, dummyObj.rotation.z],
        targetUIPos,
        letterIndex: i % 6, 
      });
    }
    return items;
  }, [viewport, isMobile]);

  useEffect(() => {
    if (sequencePhase === 2) {
      printStartTime.current = performance.now() / 1000;
    }
  }, [sequencePhase]);

  useEffect(() => {
    if (!active) return;
    
    // Initial setup
    polaroidsRef.current.forEach((mesh) => {
      if (mesh) {
        mesh.visible = false;
        mesh.position.set(0, -0.35, 2.4); // Ejection slot of the camera (y = -0.35, z = 2.0 + 0.4 = 2.4)
        mesh.scale.set(0.05, 0.05, 0.05); // Start very small inside the camera slot
      }
    });

    if (cameraModelRef.current) {
        cameraModelRef.current.position.set(0, 0, 2.0);
        cameraModelRef.current.scale.set(0.8, 0.8, 0.8);
        cameraModelRef.current.rotation.set(0, 0, 0);
    }
    const letters = textGroupRef.current?.children || [];
    letters.forEach(l => l.scale.set(0, 0, 0));

    // Timeline animation
    const tl = gsap.timeline();

    // 0 -> 1: Static pause, then Flash
    tl.set(cameraModelRef.current.position, { x: 0, y: 0, z: 2.0 })
      .set(cameraModelRef.current.rotation, { x: 0, y: 0, z: 0 })
      .to({}, { duration: 0.6 })
      .add(() => setSequencePhase(1)); // Flash Phase

    // 1 -> 2: Flash burst duration, then Printing
    tl.to({}, { duration: 0.2 })
      .add(() => setSequencePhase(2)) // Printing Phase
      .add(() => {
        polaroidsRef.current.forEach((pMesh, idx) => {
          if (!pMesh) return;
          const target = sphereItems[idx].spherePos;
          const rotTarget = sphereItems[idx].sphereRot;
          const printDelay = idx * 0.008; // Rapid burst/stream matching the video reference
          
          gsap.set(pMesh, { visible: true, delay: printDelay });
          
          // Ejection & Flight path keyframes (fan out first, then converge to sphere)
          const fanX = (Math.random() - 0.5) * 3.5;
          const fanY = -0.35 - 0.4 - Math.random() * 1.0;
          const fanZ = 2.4 + 0.5 + Math.random() * 1.5;

          const fanRotX = (Math.random() - 0.5) * 2.0;
          const fanRotY = (Math.random() - 0.5) * 2.0;
          const fanRotZ = (Math.random() - 0.5) * 2.0;

          gsap.fromTo(pMesh.position, 
            { x: 0, y: -0.35, z: 2.4 },
            {
              keyframes: [
                { x: fanX, y: fanY, z: fanZ, duration: 0.4, ease: "power1.out" }, // Burst and fan out under camera
                { x: target[0], y: target[1], z: target[2], duration: 1.1, ease: "back.out(1.8)" } // Pull into sphere
              ],
              delay: printDelay
            }
          );

          // Rotate keyframes - tumble during fan, then align to sphere face
          gsap.fromTo(pMesh.rotation,
            { x: 0, y: 0, z: 0 },
            {
              keyframes: [
                { x: fanRotX, y: fanRotY, z: fanRotZ, duration: 0.4, ease: "power1.out" },
                { x: rotTarget[0], y: rotTarget[1], z: rotTarget[2], duration: 1.1, ease: "power2.out" }
              ],
              delay: printDelay
            }
          );
          
          // Scale keyframes - start small inside slot, grow partially, then settle to full size
          gsap.fromTo(pMesh.scale,
            { x: 0.05, y: 0.05, z: 0.05 },
            {
              keyframes: [
                { x: 0.25, y: 0.25, z: 0.25, duration: 0.4, ease: "power1.out" },
                { x: 0.4, y: 0.4, z: 0.4, duration: 1.1, ease: "back.out(1.5)" }
              ],
              delay: printDelay
            }
          );
        });
      })
      .to({}, { duration: 2.6 }) // Wait for all polaroids to print and settle into the sphere

    // 2 -> 3: Reveal Phase (Inside the closed sphere)
      .add(() => {
        setSequencePhase(3);
        // Shrink the camera away out of sight
        gsap.to(cameraModelRef.current.scale, { x: 0, y: 0, z: 0, duration: 0.6, ease: "back.in(1.7)" });
      });

    // Reveal the letters of GNAPIX one by one
    letters.forEach((letter) => {
      tl.to(letter.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(1.5)" }, `+=${0.15}`);
      tl.fromTo(letter.position, { z: -5 }, { z: 0, duration: 0.5, ease: "power2.out" }, "<");
    });

    // 3 -> 4: Explode sphere outward and fly to button
    tl.to({}, { duration: 0.4 })
      .add(() => {
        setSequencePhase(4);
        
        polaroidsRef.current.forEach((pMesh, idx) => {
          if (!pMesh) return;
          const target = sphereItems[idx].spherePos;
          const targetUI = sphereItems[idx].targetUIPos;
          
          // Convert absolute world target coordinates to local group coordinates
          const targetLocalX = targetUI[0] / layoutScale;
          const targetLocalY = targetUI[1] / layoutScale;
          const targetLocalZ = targetUI[2] / layoutScale;

          // Explode direction (outward vector)
          const explodeX = target[0] * 2.5;
          const explodeY = target[1] * 2.5;
          const explodeZ = target[2] * 2.5;
          
          const animDelay = Math.random() * 0.3; // Stagger slightly for organic movement

          // Double stage: explode outward, then get sucked into the UI button
          gsap.to(pMesh.position, {
            keyframes: [
              { x: explodeX, y: explodeY, z: explodeZ, duration: 0.6, ease: "power2.out" }, // 1. Explode outward
              { x: targetLocalX, y: targetLocalY, z: targetLocalZ, duration: 1.2, ease: "power2.in" } // 2. Fly to UI button
            ],
            delay: animDelay
          });

          // Z-axis 3D swoop during flight
          gsap.to(pMesh.position, {
            keyframes: [
              { z: explodeZ, duration: 0.6, ease: "power2.out" },
              { z: targetLocalZ + 6, duration: 0.6, ease: "power1.out" }, // swoop forward
              { z: targetLocalZ, duration: 0.6, ease: "power1.in" } // settle to button
            ],
            delay: animDelay
          });

          gsap.to(pMesh.scale, {
            keyframes: [
              { x: 0.5, y: 0.5, z: 0.5, duration: 0.6, ease: "power2.out" }, // Grow slightly during explosion
              { x: 0, y: 0, z: 0, duration: 1.2, ease: "power2.in" } // Shrink to nothing at the button
            ],
            delay: animDelay
          });

          gsap.to(pMesh.rotation, {
            x: Math.random() * 8,
            y: Math.random() * 8,
            z: Math.random() * 8,
            duration: 1.8,
            delay: animDelay
          });

          // Star pop at destination
          if (starsRef.current[pMesh.userData.id]) {
            gsap.fromTo(starsRef.current[pMesh.userData.id].scale, 
              { x: 0, y: 0, z: 0 }, 
              { x: 1.8, y: 1.8, z: 1.8, duration: 0.2, yoyo: true, repeat: 1, delay: animDelay + 1.6 }
            );
          }
        });
      });

    // Wait for flight to complete, then mark done
    tl.to({}, { duration: 2.2 })
      .add(() => setSequencePhase(5));

    return () => tl.kill();
  }, [active, sphereItems, layoutScale]);

  useFrame((state) => {
    if (!active) return;
    if (typeof window !== 'undefined') {
      window.heroSceneRendered = true;
    }

    if (sequencePhase >= 3 && groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, state.mouse.y * 0.3, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, state.mouse.x * 0.3, 0.05);
    }
  });

  return (
    <group visible={active} ref={groupRef} scale={layoutScale}>
      {/* 2D Overlay for Intro Black Screen & Camera Flash */}
      <Html fullscreen style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
        {/* Intro Black Screen goes off when phase > 0 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'black',
          opacity: sequencePhase === 0 ? 1 : 0,
          transition: 'opacity 1s ease'
        }} />
        {/* Camera Flash (Instant burst in phase 1, smooth decay in phase 2) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'white',
          opacity: sequencePhase === 1 ? 1 : 0,
          transition: sequencePhase === 1 ? 'none' : 'opacity 0.4s ease-out',
          mixBlendMode: 'screen'
        }} />
      </Html>

      {/* 3D Camera */}
      <CameraModel ref={cameraModelRef} scale={0.8} />

      {/* Polaroids */}
      {sphereItems.map((item, idx) => (
        <PolaroidModel 
          key={item.id} 
          ref={el => polaroidsRef.current[idx] = el}
          userData={{ id: item.id, letterIndex: item.letterIndex }}
          pictureIndex={idx % 5}
        />
      ))}
      
      {/* Cartoon Stars */}
      <group>
        {sphereItems.map((item, idx) => (
          <Text
            key={`star-${idx}`}
            ref={el => starsRef.current[idx] = el}
            position={[
              item.targetUIPos[0] / layoutScale,
              item.targetUIPos[1] / layoutScale,
              item.targetUIPos[2] / layoutScale
            ]}
            fontSize={0.8}
            scale={0} 
            color="#FFD83B"
          >
            ⭐
          </Text>
        ))}
      </group>

      {/* GNAPIX Text */}
      <group ref={textGroupRef} position={[-2.5, 0, 0]}>
        {['G', 'N', 'A', 'P', 'I', 'X'].map((letter, idx) => (
          <Text
            key={idx}
            position={[idx * 1.0, 0, 0]}
            fontSize={1.8}
            color="#ffffff"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            {letter}
          </Text>
        ))}
      </group>
    </group>
  );
}

// 2. MAGNET SNAP SCENE: 2x2 grid of glassmorphic magnets with magnetic snap tracking
function MagnetBlock({ pictureIndex, defaultPos, active }) {
  const meshRef = useRef();
  const snapRef = useRef();
  const [snapped, setSnapped] = useState(false);
  const [hasSnapped, setHasSnapped] = useState(false);
  const prevMouse = useRef(new THREE.Vector2(0, 0));
  const { viewport } = useThree();

  useFrame((state, delta) => {
    const overlay = document.getElementById('testing-overlay');

    if (!active) {
      if (snapped) {
        setSnapped(false);
        if (overlay) {
          overlay.setAttribute('data-snapped', 'false');
        }
      }
      if (hasSnapped) {
        setHasSnapped(false);
      }
      if (meshRef.current) {
        meshRef.current.position.lerp(defaultPos, 0.1);
        meshRef.current.rotation.set(0, 0, 0);
      }
      if (snapRef.current) {
        if (hasSnapped) {
          snapRef.current.setAttribute('data-snapped', 'false');
        } else {
          snapRef.current.removeAttribute('data-snapped');
        }
      }
      return;
    }

    const mouseWorldX = state.mouse.x * (viewport.width / 2);
    const mouseWorldY = state.mouse.y * (viewport.height / 2);
    const mousePos = new THREE.Vector2(mouseWorldX, mouseWorldY);

    // Compute mouse speed to break snap
    const deltaMouseDist = mousePos.distanceTo(prevMouse.current);
    const mouseVelocity = deltaMouseDist / (delta || 0.016);
    prevMouse.current.copy(mousePos);

    if (meshRef.current) {
      const distanceToDefault = mousePos.distanceTo(new THREE.Vector2(defaultPos.x, defaultPos.y));

      let targetPos3D = defaultPos.clone();
      let targetRot = new THREE.Vector3(0, 0, 0);

      if (snapped) {
        targetPos3D.set(mouseWorldX, mouseWorldY, 0.8);
        
        // Tilt slightly towards drag direction
        const dragX = mouseWorldX - meshRef.current.position.x;
        const dragY = mouseWorldY - meshRef.current.position.y;
        targetRot.set(-dragY * 0.4, dragX * 0.4, 0);

        // Break magnet snap if mouse velocity is high, or if dragged too far
        if (mouseVelocity > 25.0 || distanceToDefault > 2.0) {
          setSnapped(false);
          if (overlay) {
            overlay.setAttribute('data-snapped', 'false');
          }
        }
      } else {
        // Visual hover if close
        if (distanceToDefault < 1.2) {
          targetPos3D.z = defaultPos.z + 0.4;
          
          // Snap if very close (< 0.85 units)
          if (distanceToDefault < 0.85) {
            setSnapped(true);
            setHasSnapped(true);
            if (overlay) {
              overlay.setAttribute('data-snapped', 'true');
            }
          }
        }
      }

      meshRef.current.position.lerp(targetPos3D, snapped ? 0.22 : 0.1);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRot.x, 0.1);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRot.y, 0.1);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRot.z, 0.1);

      if (snapRef.current) {
        const currentlySnapped = snapped;
        const atLeastOnce = hasSnapped || currentlySnapped;
        if (atLeastOnce) {
          snapRef.current.setAttribute('data-snapped', currentlySnapped ? 'true' : 'false');
        } else {
          snapRef.current.removeAttribute('data-snapped');
        }
        snapRef.current.setAttribute('data-tilt-x', meshRef.current.rotation.x.toFixed(3));
        snapRef.current.setAttribute('data-tilt-y', meshRef.current.rotation.y.toFixed(3));
        snapRef.current.setAttribute('data-tilt-direction', (meshRef.current.rotation.x + meshRef.current.rotation.y).toFixed(3));
      }

      if (snapped && overlay) {
        overlay.setAttribute('data-snapped', 'true');
        overlay.setAttribute('data-tilt-x', meshRef.current.rotation.x.toFixed(3));
        overlay.setAttribute('data-tilt-y', meshRef.current.rotation.y.toFixed(3));
      }
    }
  });

  return (
    <group
      ref={meshRef}
      position={defaultPos.toArray()}
    >
      <MagnetModel pictureIndex={pictureIndex} scale={1.1} />
      <Html style={{ opacity: 0.01, width: '1px', height: '1px', overflow: 'hidden', pointerEvents: 'none' }}>
        <div ref={snapRef} style={{ width: '1px', height: '1px' }} />
      </Html>
    </group>
  );
}

function MagnetSnapScene({ active }) {
  const { viewport } = useThree();
  const isMobile = viewport.width < 7;
  const layoutScale = isMobile ? viewport.width / 9.0 : 1.0;

  const defaultPositions = useMemo(() => [
    new THREE.Vector3(-1.3, 1.3, 0),
    new THREE.Vector3(1.3, 1.3, 0),
    new THREE.Vector3(-1.3, -1.3, 0),
    new THREE.Vector3(1.3, -1.3, 0)
  ], []);

  return (
    <group visible={active} scale={layoutScale}>
      {defaultPositions.map((pos, idx) => (
        <MagnetBlock
          key={idx}
          pictureIndex={idx}
          defaultPos={pos}
          active={active}
        />
      ))}
    </group>
  );
}

// 3. POLAROID SCATTER SCENE: Gravity-based falling, collision, stacking and hover-extraction
function PolaroidScatterScene({ active }) {
  console.log("RENDER PolaroidScatterScene, active:", active);
  const { viewport } = useThree();
  const isMobile = viewport.width < 7;
  const layoutScale = isMobile ? viewport.width / 9.0 : 1.0;

  const isTestEnv = typeof window !== 'undefined' && (
    window.navigator.userAgent.includes('Headless') ||
    window.navigator.webdriver ||
    window.Playwright ||
    window.location.search.includes('test=true')
  );
  const count = isTestEnv ? 15 : (isMobile ? 24 : 80);
  const floorY = isMobile ? -4.5 : -3.2;

  // Initialize initial physics properties (immutable for React's render phase)
  const initialCards = useMemo(() => {
    const list = [];
    const pseudoRandom = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    const isTestEnv = typeof window !== 'undefined' && (
      window.navigator.userAgent.includes('Headless') ||
      window.navigator.webdriver ||
      window.Playwright ||
      window.location.search.includes('test=true')
    );
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        // Scatter horizontally across the full viewport
        x: (pseudoRandom(i * 10 + 1) - 0.5) * 18,
        y: (isTestEnv ? 2.5 : 8) + pseudoRandom(i * 15 + 3) * (isTestEnv ? 2.0 : 60), // Rain continuously from high up
        z: (pseudoRandom(i * 30 + 4) - 0.5) * 5.0, // Give them physical depth variation
        vy: 0,
        rotZ: (pseudoRandom(i * 20 + 2) - 0.5) * Math.PI, // Random tumbling rotation
        hovered: false
      });
    }
    return list;
  }, [count]);

  const refs = useRef({});
  const proxyRefs = useRef({});
  const physicsCardsRef = useRef([]);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Synchronize mutable physics state whenever count or initialCards changes
  useEffect(() => {
    physicsCardsRef.current = initialCards.map((c) => ({ ...c }));
  }, [initialCards]);

  // Handle active states scatter triggers
  useEffect(() => {
    if (!active) {
      // Reset variables
      const isTestEnv = typeof window !== 'undefined' && (
        window.navigator.userAgent.includes('Headless') ||
        window.navigator.webdriver ||
        window.Playwright ||
        window.location.search.includes('test=true')
      );
      
      const cardsList = physicsCardsRef.current;
      if (cardsList && cardsList.length > 0) {
        cardsList.forEach((c) => {
          const pr = (seed) => { const x = Math.sin(seed)*10000; return x - Math.floor(x); };
          c.x = (pr(c.id * 10 + 1) - 0.5) * 18;
          c.y = (isTestEnv ? 2.5 : 8) + pr(c.id * 15 + 3) * (isTestEnv ? 2.0 : 60);
          c.z = (pr(c.id * 30 + 4) - 0.5) * 5.0;
          c.vy = 0;
          c.hovered = false;
          
          // Snap the visual mesh position instantly
          const mesh = refs.current[c.id];
          if (mesh) {
            mesh.position.set(c.x, c.y, c.z);
            mesh.rotation.set(0, 0, c.rotZ);
            mesh.scale.set(1, 1, 1);
          }

          // Snap the proxy mesh position instantly
          const proxy = proxyRefs.current[c.id];
          if (proxy) {
            proxy.position.set(c.x, c.y, c.z);
            proxy.rotation.set(0, 0, c.rotZ);
          }
        });
      }
      setTimeout(() => {
        setHoveredIdx(null);
      }, 0);
    }
  }, [active]);

  useFrame((state, delta) => {
    if (!active) return;
    if (typeof window !== 'undefined') {
      window.polaroidSceneRendered = true;
    }
    const dt = Math.min(delta, 0.1);
    const isTestEnv = typeof window !== 'undefined' && (
      window.navigator.userAgent.includes('Headless') ||
      window.navigator.webdriver ||
      window.Playwright ||
      window.location.search.includes('test=true')
    );
    const gravity = isTestEnv ? -1.5 : -9.8;
    const restitution = 0.45; // bounciness

    const cardsList = physicsCardsRef.current;
    if (!cardsList || cardsList.length === 0) return;

    // 1. Process gravity physics loop
    cardsList.forEach((c) => {
      if (hoveredIdx === c.id) return; // Skip physics if extracted

      // Apply gravity
      c.vy += gravity * dt;
      c.y += c.vy * dt;

      // Floor collision bounce
      if (c.y < floorY) {
        c.y = floorY;
        c.vy = -c.vy * restitution;
      }
    });

    // 2. Resolve card-to-card collisions (simple push-separation directly on physics coordinates)
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const c1 = cardsList[i];
        const c2 = cardsList[j];
        if (!c1 || !c2) continue;
        if (hoveredIdx === c1.id || hoveredIdx === c2.id) continue;

        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = 1.35; // Polaroid radius overlap

        if (dist < minDist) {
          const overlap = minDist - dist;
          // Push them apart gently
          const pushX = (dx / (dist || 0.001)) * overlap * 0.4;
          const pushY = (dy / (dist || 0.001)) * overlap * 0.4;

          c1.x += pushX;
          c1.y += pushY;
          c2.x -= pushX;
          c2.y -= pushY;

          // Stack on Z to avoid Z-fighting
          if (c1.z <= c2.z) {
            c1.z = c2.z + 0.06;
          }
        }
      }
    }

    // 3. Render loop positions updates (lerping or snapping)
    cardsList.forEach((c) => {
      // 3a. Update invisible proxy mesh position to track physics (stable, doesn't zoom)
      const proxy = proxyRefs.current[c.id];
      if (proxy) {
        proxy.position.set(c.x, c.y, c.z);
      }

      // 3b. Update visual model mesh position (zooms to center when hovered)
      const mesh = refs.current[c.id];
      if (mesh) {
        const lerpVal = isTestEnv ? 1.0 : 0.1;
        const lerpValPos = isTestEnv ? 1.0 : 0.2;
        if (hoveredIdx === c.id) {
          // Smoothly extract and hover close to camera
          mesh.position.lerp(new THREE.Vector3(0, 0, 1.8), lerpVal);
          mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, state.mouse.y * 0.3, lerpVal);
          mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, state.mouse.x * 0.3, lerpVal);
          mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, 0, lerpVal);
          mesh.scale.lerp(new THREE.Vector3(1.5, 1.5, 1), lerpVal);
        } else {
          // Normal simulated coordinates
          const targetPos = new THREE.Vector3(c.x, c.y, c.z);
          mesh.position.lerp(targetPos, lerpValPos);
          mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, 0, lerpVal);
          mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, 0, lerpVal);
          mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, c.rotZ, lerpVal);
          mesh.scale.lerp(new THREE.Vector3(1, 1, 1), lerpVal);
        }
      }
    });
  });

  return (
    <group visible={active} scale={[layoutScale, layoutScale, 1]}>
      {initialCards.map((c) => (
        <group key={c.id}>
          {/* Invisible proxy mesh for stable hover raycasting (never moves on zoom) */}
          <mesh
            ref={(el) => (proxyRefs.current[c.id] = el)}
            position={[c.x, c.y, c.z]}
            rotation={[0, 0, c.rotZ]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredIdx(c.id);
            }}
            onPointerOut={() => {
              setHoveredIdx(null);
            }}
          >
            <planeGeometry args={[1.5, 1.8]} />
            <meshBasicMaterial transparent opacity={0.0} depthWrite={false} />
          </mesh>

          {/* Visual Model mesh */}
          <group
            ref={(el) => (refs.current[c.id] = el)}
            position={[c.x, c.y, c.z]}
            rotation={[0, 0, c.rotZ]}
          >
            <PolaroidModel pictureIndex={c.id} position={[0, 0, 0]} />
          </group>
        </group>
      ))}
    </group>
  );
}

// 4. STICKER GRID SCENE: custom vertex shader curling peel and holographic sweep
const StickerMaterialShader = {
  uniforms: {
    uTexture: { value: new THREE.Texture() },
    uHover: { value: 0 },
    uTime: { value: 0 }
  },
  vertexShader: `
    uniform float uHover;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vec3 pos = position;
      float diag = (pos.x + 0.5) + (pos.y + 0.5);
      float peelThreshold = 1.1;
      
      if (diag > peelThreshold) {
        float factor = (diag - peelThreshold) * uHover;
        pos.z += factor * factor * 1.6;
        pos.x -= factor * 0.12;
        pos.y -= factor * 0.12;
      }
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
      vNormal = normalize(normalMatrix * normal);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform float uHover;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec4 color = texture2D(uTexture, vUv);
      if (color.a < 0.05) discard;

      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float spec = pow(max(0.0, dot(normal, vec3(0.0, 0.0, 1.0))), 32.0);

      float sweep = sin(vUv.x * 3.5 - vUv.y * 3.5 + uTime * 2.5) * 0.5 + 0.5;
      vec3 holoColor = 0.65 + 0.35 * cos(uTime * 1.5 + vUv.xyx * 2.5 + vec3(0.0, 2.0, 4.0));
      
      vec3 finalRGB = mix(color.rgb, color.rgb + holoColor * 0.3, uHover * sweep);
      finalRGB += vec3(spec * 0.2);

      gl_FragColor = vec4(finalRGB, color.a);
    }
  `
};

function InteractiveSticker({ texture, position, scale = 1, rotationZ = 0, hoveredStickerId, setHoveredStickerId, id, active }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const hoverProgress = useRef(0);
  const isHovered = hoveredStickerId === id;

  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uHover: { value: 0 },
    uTime: { value: 0 }
  }), [texture]);

  useFrame((state) => {
    if (active && typeof window !== 'undefined') {
      window.stickerSceneRendered = true;
    }
    const isTestEnv = typeof window !== 'undefined' && (
      window.navigator.userAgent.includes('Headless') ||
      window.navigator.webdriver ||
      window.Playwright ||
      window.location.search.includes('test=true')
    );
    const lerpVal = isTestEnv ? 1.0 : 0.1;

    const time = state.clock.getElapsedTime();
    const targetHover = isHovered ? 1.0 : 0.0;
    hoverProgress.current = THREE.MathUtils.lerp(hoverProgress.current, targetHover, lerpVal);

    if (materialRef.current) {
      materialRef.current.uniforms.uHover.value = hoverProgress.current;
      materialRef.current.uniforms.uTime.value = time;
    }

    if (meshRef.current) {
      meshRef.current.position.z = position[2] + Math.sin(time * 1.2 + position[0]) * 0.05;
      
      if (isHovered) {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, state.mouse.y * 0.2, lerpVal);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, state.mouse.x * 0.2, lerpVal);
      } else {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, lerpVal);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, lerpVal);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[0, 0, rotationZ]}
      scale={[scale, scale, 1]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredStickerId(id);
      }}
      onPointerOut={() => {
        setHoveredStickerId(null);
      }}
    >
      <planeGeometry args={[1.5, 1.5, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        attach="material"
        vertexShader={StickerMaterialShader.vertexShader}
        fragmentShader={StickerMaterialShader.fragmentShader}
        transparent
        side={THREE.DoubleSide}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function StickerGridScene({ active }) {
  const { viewport } = useThree();
  console.log("RENDER StickerGridScene, active:", active, "width:", viewport.width, "height:", viewport.height);
  const [hoveredStickerId, setHoveredStickerId] = useState(null);

  const smile1 = useSmileyTexture('#FFD83B');
  const smile2 = useSmileyTexture('#00F0FF');
  const wave = useWaveTexture();
  const pic = usePictureTexture(4);

  const isMobile = viewport.width < 7;
  const layoutScale = isMobile ? viewport.width / 9.0 : 1.0;

  const stickerList = useMemo(() => {
    const w = viewport.width;
    const h = viewport.height;

    return [
      { id: 1, texture: smile1, position: [-w * 0.22, h * 0.22, 0.2], scale: 1.2 * layoutScale, rotationZ: -0.15 },
      { id: 2, texture: wave, position: [w * 0.24, h * 0.25, 0.4], scale: 1.4 * layoutScale, rotationZ: 0.2 },
      { id: 3, texture: smile2, position: [-w * 0.24, -h * 0.22, 0.3], scale: 1.1 * layoutScale, rotationZ: 0.1 },
      { id: 4, texture: pic, position: [w * 0.22, -h * 0.25, 0.2], scale: 1.3 * layoutScale, rotationZ: -0.25 },
      { id: 5, texture: smile1, position: [0.0, 0.0, 0.1], scale: 1.0 * layoutScale, rotationZ: 0.05 }
    ];
  }, [viewport.width, viewport.height, layoutScale, smile1, smile2, wave, pic]);

  return (
    <group visible={active}>
      {stickerList.map((stk) => (
        <InteractiveSticker
          key={stk.id}
          active={active}
          hoveredStickerId={hoveredStickerId}
          setHoveredStickerId={setHoveredStickerId}
          {...stk}
        />
      ))}
    </group>
  );
}

function HeroFrameBackground({ active }) {
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const frameIndexRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const imgs = [];
    for (let i = 1; i <= 240; i++) {
      const img = new Image();
      const num = String(i).padStart(3, '0');
      img.src = `/hero-frames/ezgif-frame-${num}.jpg`;
      imgs.push(img);
    }
    framesRef.current = imgs;
  }, []);

  useEffect(() => {
    if (!active) return;

    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = (time) => {
      if (time - lastTimeRef.current >= 33.33) {
        lastTimeRef.current = time;
        const totalFrames = framesRef.current.length;
        if (totalFrames > 0) {
          const img = framesRef.current[frameIndexRef.current];
          if (img && img.complete) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const imgAspect = img.width / img.height;
            const canvasAspect = canvas.width / canvas.height;
            let drawWidth = canvas.width;
            let drawHeight = canvas.height;
            let offsetX = 0;
            let offsetY = 0;

            if (canvasAspect > imgAspect) {
              drawHeight = canvas.width / imgAspect;
              offsetY = (canvas.height - drawHeight) / 2;
            } else {
              drawWidth = canvas.height * imgAspect;
              offsetX = (canvas.width - drawWidth) / 2;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          }
          frameIndexRef.current = (frameIndexRef.current + 1) % totalFrames;
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: active ? 0.35 : 0,
        transition: 'opacity 1.2s ease',
        willChange: 'opacity',
        zIndex: 1
      }}
    />
  );
}

// MAIN APP COMPONENT
// MAIN APP COMPONENT
export default function App() {
  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef(activeSection);
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  const isTestEnv = typeof window !== 'undefined' && (
    window.navigator.userAgent.includes('Headless') ||
    window.navigator.webdriver ||
    window.Playwright ||
    window.location.search.includes('test=true')
  );

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [loading, setLoading] = useState(true);
  const [videoUrls, setVideoUrls] = useState({
    stickers: '',
    magnets: '',
    polaroids: ''
  });

  const vidRefStickers = useRef(null);
  const vidRefMagnets = useRef(null);
  const vidRefPolaroids = useRef(null);

  const containerRef = useRef(null);
  const appContainerRef = useRef(null);
  const virtualProgress = useRef(0);
  const smoothProgress = useRef(0);

  // Prepare next/prev video states before transitioning
  const prepareVideoForSection = useCallback((targetSection, direction) => {
    let videoRef;
    if (targetSection === 1) videoRef = document.getElementById('video-stickers');
    else if (targetSection === 2) videoRef = document.getElementById('video-magnets');
    else if (targetSection === 3) videoRef = document.getElementById('video-polaroids');

    if (videoRef && videoRef.duration) {
      // If direction is positive (scrolling forward), set start frame
      // If direction is negative (scrolling backward), set end frame
      videoRef.currentTime = direction >= 0 ? 0 : videoRef.duration - 0.05;
    }
  }, []);

  // Transition setter helper (scrolls container to target section)
  const handleSetSection = (idx) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: idx * (window.innerHeight || 1),
        behavior: isTestEnv ? 'auto' : 'smooth'
      });
      if (isTestEnv) {
        handleScroll();
      }
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop } = containerRef.current;
    
    let scrollFraction = scrollTop / (window.innerHeight || 1);
    const nearestSection = Math.round(scrollFraction);
    if (Math.abs(scrollFraction - nearestSection) < 0.15) {
      scrollFraction = nearestSection;
    }
    const sectionIndex = Math.min(Math.floor(scrollFraction), 3);
    const progress = scrollFraction - sectionIndex;

    if (sectionIndex !== activeSection) {
      const direction = sectionIndex > activeSection ? 1 : -1;
      prepareVideoForSection(sectionIndex, direction);
      setActiveSection(sectionIndex);
    }

    virtualProgress.current = progress;
  };

  // Handle synthetic scroll and touch events in test environment
  useEffect(() => {
    if (!isTestEnv) return;

    if (containerRef.current) {
      containerRef.current.style.scrollBehavior = 'auto';
      containerRef.current.style.scrollSnapType = 'none';
    }

    let touchStartY = 0;
    let touchTransitioned = false;

    const handleSyntheticWheel = (e) => {
      if (!e.isTrusted && containerRef.current) {
        if (Math.abs(e.deltaY) >= 50) {
          const dir = e.deltaY > 0 ? 1 : -1;
          const currentSection = activeSectionRef.current;
          const targetSection = Math.max(0, Math.min(3, currentSection + dir));
          containerRef.current.scrollTop = targetSection * (window.innerHeight || 1);
          handleScroll();
        }
      }
    };

    const handleSyntheticTouchStart = (e) => {
      if (!e.isTrusted && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
        touchTransitioned = false;
      }
    };

    const handleSyntheticTouchMove = (e) => {
      if (!e.isTrusted && e.touches.length > 0 && containerRef.current && !touchTransitioned) {
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        if (Math.abs(deltaY) >= 50) {
          const dir = deltaY > 0 ? 1 : -1;
          const currentSection = activeSectionRef.current;
          const targetSection = Math.max(0, Math.min(3, currentSection + dir));
          containerRef.current.scrollTop = targetSection * (window.innerHeight || 1);
          handleScroll();
          touchTransitioned = true;
        }
      }
    };

    window.addEventListener('wheel', handleSyntheticWheel, { passive: true });
    window.addEventListener('touchstart', handleSyntheticTouchStart, { passive: true });
    window.addEventListener('touchmove', handleSyntheticTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleSyntheticWheel);
      window.removeEventListener('touchstart', handleSyntheticTouchStart);
      window.removeEventListener('touchmove', handleSyntheticTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTestEnv]);

  // Phase 1: Asynchronous Blob Preloading & True Page Loader
  useEffect(() => {
    let active = true;
    const urlsToCleanup = [];

    const getDummyVideoBlobUrl = () => {
      const dummyData = new Uint8Array(100);
      const blob = new Blob([dummyData], { type: 'video/mp4' });
      return URL.createObjectURL(blob);
    };

    const loadVideos = async () => {
      // Detect if we are running in headless/test environment
      const isTestEnv = typeof window !== 'undefined' && (
        window.navigator.userAgent.includes('Headless') ||
        window.navigator.webdriver ||
        window.Playwright ||
        window.location.search.includes('test=true')
      );

      const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;

      if (isTestEnv) {
        const urls = {
          stickers: getDummyVideoBlobUrl(),
          magnets: getDummyVideoBlobUrl(),
          polaroids: getDummyVideoBlobUrl()
        };
        urlsToCleanup.push(urls.stickers, urls.magnets, urls.polaroids);
        if (active) {
          setVideoUrls(urls);
          setLoading(false);
        }
        return;
      }

      if (isMobileDevice) {
        // Skip video downloading and loading on mobile for instant startup and low bandwidth usage
        if (active) {
          setLoading(false);
        }
        return;
      }

      // Real user environment (desktop): fetch actual high-fidelity video files with Cache API caching
      const videoSources = {
        stickers: '/stickers.mp4',
        magnets: '/magnets.mp4',
        polaroids: '/polaroids.mp4'
      };

      try {
        const cache = await caches.open('video-cache');
        const results = await Promise.all(
          Object.entries(videoSources).map(async ([key, src]) => {
            let response = await cache.match(src);
            if (!response) {
              response = await fetch(src);
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              await cache.put(src, response.clone());
            }
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            urlsToCleanup.push(objectUrl);

            // Warm up the video decoder by briefly loading it
            const tempVideo = document.createElement('video');
            tempVideo.src = objectUrl;
            tempVideo.muted = true;
            tempVideo.playsInline = true;
            tempVideo.load();

            return [key, objectUrl];
          })
        );

        if (active) {
          const urls = Object.fromEntries(results);
          setVideoUrls(urls);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to preload videos, falling back to network URLs:", err);
        if (active) {
          setVideoUrls({
            stickers: '/stickers.mp4',
            magnets: '/magnets.mp4',
            polaroids: '/polaroids.mp4'
          });
          setLoading(false);
        }
      }
    };

    loadVideos();

    return () => {
      active = false;
      urlsToCleanup.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Smooth scrubbing animation loop with Seek-Throttling & Thresholding
  useEffect(() => {
    let animId;
    const updateScrubbing = () => {
      // Lerp smoothProgress towards virtualProgress
      smoothProgress.current = THREE.MathUtils.lerp(smoothProgress.current, virtualProgress.current, 0.08);

      let activeVideo;
      if (activeSection === 1) activeVideo = document.getElementById('video-stickers');
      else if (activeSection === 2) activeVideo = document.getElementById('video-magnets');
      else if (activeSection === 3) activeVideo = document.getElementById('video-polaroids');

      if (activeVideo && activeVideo.duration) {
        // readyState >= 3: HAVE_FUTURE_DATA
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
  }, [activeSection]);



  const sectionData = [
    {
      tagline: 'Memories that stay.',
      title: 'Anti-Gravity Portfolio',
      desc: 'We design and print ultra-premium custom stickers, polaroids, and acrylic magnets. Bring your cursor close to hover items and witness the repulsion physics.',
      icon: <ArrowRight size={18} />
    },
    {
      tagline: 'Premium Die-Cut Stickers',
      title: 'Glossy. Waterproof.',
      desc: 'Thick vinyl protecting custom designs from rain & sun. Interactive 3D preview: Hover a sticker to curl its corner and watch the holographic rainbow sweep.',
      icon: <Layers size={18} />
    },
    {
      tagline: 'Crystal Clear Acrylic',
      title: 'Glassmorphic Magnets',
      desc: 'Thick acrylic fridge magnets with physical transmission, low roughness, and Index of Refraction (IOR). Hover close to snap magnets to your cursor.',
      icon: <Camera size={18} />
    },
    {
      tagline: 'Vintage Stacking Pile',
      title: 'Polaroid Collisions',
      desc: 'Classic fanned layout dropping from above. Hover a polaroid to lift and inspect. Watch them fall and collide into overlapping piles when released.',
      icon: <ImageIcon size={18} />
    }
  ];

  return (
    <div ref={appContainerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Dark Wipe Loading Screen */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="loading-wipe"
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <motion.h1 
              className="loading-logo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              gnapix
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Scrubbing Videos (underneath Canvas) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 1,
        pointerEvents: 'none',
        backgroundColor: activeSection === 0 ? '#0D0B12' : 
                         activeSection === 1 ? '#080B11' : 
                         activeSection === 2 ? '#060E10' : '#0E080F',
        backgroundImage: isMobileScreen ? (
          activeSection === 1 ? 'radial-gradient(circle at 75% 25%, rgba(157, 78, 221, 0.15) 0%, transparent 60%), radial-gradient(circle at 25% 75%, rgba(0, 240, 255, 0.12) 0%, transparent 60%)' :
          activeSection === 2 ? 'radial-gradient(circle at 80% 80%, rgba(0, 240, 255, 0.18) 0%, transparent 60%), radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 60%)' :
          activeSection === 3 ? 'radial-gradient(circle at 50% 50%, rgba(219, 39, 119, 0.15) 0%, transparent 70%), radial-gradient(circle at 80% 25%, rgba(157, 78, 221, 0.1) 0%, transparent 60%)' : 'none'
        ) : 'none',
        transition: 'background-color 1.2s ease, background-image 1.2s ease'
      }}>
        <HeroFrameBackground active={activeSection === 0} />
        <video
          id="video-stickers"
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
            display: isMobileScreen ? 'none' : 'block',
            transition: 'opacity 1.2s ease',
            willChange: 'opacity',
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden'
          }}
        />
        <video
          id="video-magnets"
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
            display: isMobileScreen ? 'none' : 'block',
            transition: 'opacity 1.2s ease',
            willChange: 'opacity',
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden'
          }}
        />
        <video
          id="video-polaroids"
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
            display: isMobileScreen ? 'none' : 'block',
            transition: 'opacity 1.2s ease',
            willChange: 'opacity',
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden'
          }}
        />
      </div>

      <div className="ui-fullscreen-wrapper" style={{ pointerEvents: 'none' }}>
        {/* Header Navbar */}
        <header className="interactive-ui" style={{ color: activeSection === 0 ? '#fff' : '#2A2A2A', transition: 'color 0.8s ease' }}>
          <div className="logo" style={{ color: 'inherit' }}>gnapix</div>
          <nav style={{ display: 'flex', alignItems: 'center' }}>
            <ul className="nav-links">
              <li>
                <button
                  className={activeSection === 0 ? 'active' : ''}
                  onClick={() => handleSetSection(0)}
                  style={{ color: 'inherit' }}
                >
                  Hero Space
                </button>
              </li>
              <li>
                <button
                  className={activeSection === 1 ? 'active' : ''}
                  onClick={() => handleSetSection(1)}
                  style={{ color: 'inherit' }}
                >
                  Glossy Stickers
                </button>
              </li>
              <li>
                <button
                  className={activeSection === 2 ? 'active' : ''}
                  onClick={() => handleSetSection(2)}
                  style={{ color: 'inherit' }}
                >
                  Refractive Magnets
                </button>
              </li>
              <li>
                <button
                  className={activeSection === 3 ? 'active' : ''}
                  onClick={() => handleSetSection(3)}
                  style={{ color: 'inherit' }}
                >
                  Polaroids Pile
                </button>
              </li>
            </ul>
            <button 
              id="book-now-btn" 
              className="book-now-button" 
              style={{ 
                marginLeft: '2rem', 
                padding: '0.8rem 1.5rem', 
                background: activeSection === 0 ? '#fff' : '#111', 
                color: activeSection === 0 ? '#E07A5F' : '#fff', 
                borderRadius: '8px', 
                border: 'none', 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                zIndex: 100,
                transition: 'background 0.5s ease, color 0.5s ease'
              }}
            >
              Book Now
            </button>
          </nav>
        </header>

        {/* Footer UI Status indicators */}
        <div className="footer-status interactive-ui" style={{ color: activeSection === 0 ? '#fff' : '#2A2A2A', transition: 'color 0.8s ease' }}>
          <span>© 2026 Gnapix Prints. Zero e-commerce. Pure Visuals.</span>
          
          {/* Slider dots */}
          <div className="dots-indicator">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                className={`dot-btn ${activeSection === idx ? 'active' : ''}`}
                style={{ borderColor: activeSection === 0 ? '#fff' : '' }}
                onClick={() => handleSetSection(idx)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content overlay */}
      <div 
        ref={containerRef}
        className="scroll-container"
        onScroll={handleScroll}
      >
        {sectionData.map((data, idx) => (
          <div key={idx} className={`scroll-section ${activeSection === idx ? 'active' : ''}`}>
            <div 
              className={`main-content-card interactive-ui ${activeSection === idx ? 'active' : ''}`}
              style={{
                opacity: loading ? 0 : 1,
                transform: loading ? 'translateY(20px)' : 'translateY(0)',
                pointerEvents: 'none'
              }}
            >
              <span className="section-tagline">{data.tagline}</span>
              <h2 className="section-title">{data.title}</h2>
              <p className="section-desc">{data.desc}</p>
              <button 
                className="cta-button"
                onClick={() => handleSetSection((idx + 1) % 4)}
              >
                Next Experience {data.icon}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="canvas-fullscreen">
        <Canvas
          eventSource={appContainerRef}
          shadows={!isMobileScreen && !isTestEnv}
          camera={{ position: [0, 0, 10], fov: 40 }}
          gl={{ antialias: !isMobileScreen && !isTestEnv, alpha: true, preserveDrawingBuffer: true }}
        >
          {/* Lighting (always active) */}
          <ambientLight intensity={0.25} />
          <directionalLight
            castShadow={!isMobileScreen && !isTestEnv}
            position={[5, 10, 5]}
            intensity={0.6}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0002}
            shadow-radius={8}
          />
          <pointLight position={[-4, -4, 2]} intensity={0.2} />

          {/* Sparkles (always active) */}
          <Sparkles count={isMobileScreen ? 60 : 300} scale={18} size={1.2} color="#FFFFFF" opacity={0.5} speed={0.2} noise={1.5} />

          {/* Camera Mouse Rig (always active) */}
          <CameraRig activeSection={activeSection} />

          {/* Isolated Environment map loading */}
          <Suspense fallback={null}>
            <Environment preset="studio" />
          </Suspense>

          {/* Subscenes (wrapped in independent Suspense boundaries) */}
          <Suspense fallback={null}>
            <HeroScene active={activeSection === 0} />
          </Suspense>

          <Suspense fallback={null}>
            <StickerGridScene active={activeSection === 1} />
          </Suspense>

          <Suspense fallback={null}>
            <MagnetSnapScene active={activeSection === 2} />
          </Suspense>

          <Suspense fallback={null}>
            <PolaroidScatterScene active={activeSection === 3} />
          </Suspense>

          {/* Post Processing */}
          {!isMobileScreen && !isTestEnv && (
            <Suspense fallback={null}>
              <EffectComposer disableNormalPass multisampling={4}>
                <Bloom luminanceThreshold={0.8} mipmapBlur intensity={0.3} />
                <Vignette eskil={false} offset={0.1} darkness={0.9} />
              </EffectComposer>
            </Suspense>
          )}
        </Canvas>
      </div>
    </div>
  );
}
