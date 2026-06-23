import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Float, MeshReflectorMaterial, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { CameraModel, PolaroidModel } from './ProceduralModels';

// Concept A: Zen Minimalist Pedestal
export function HeroSceneA({ active }) {
  const { viewport } = useThree();
  const isMobile = viewport.width < 7;
  const layoutScale = isMobile ? viewport.width / 9.0 : 1.0;

  return (
    <group visible={active} scale={layoutScale}>
      {/* Reflective Infinite Floor */}
      <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={50}
          roughness={0.15}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#101010"
          metalness={0.6}
        />
      </mesh>
      
      {/* Single Pristine Object */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3} position={[0, 0.2, 0]}>
        <CameraModel scale={1.2} />
      </Float>

      {/* Elegant Typography */}
      <Text
        position={[0, -0.6, 1.5]}
        fontSize={0.4}
        color="#888888"
        letterSpacing={0.15}
        anchorX="center"
        anchorY="middle"
      >
        gnapix
      </Text>
    </group>
  );
}

// Concept B: Flowing Silk / Liquid Metal
export function HeroSceneB({ active }) {
  const { viewport } = useThree();
  const isMobile = viewport.width < 7;
  const layoutScale = isMobile ? viewport.width / 9.0 : 1.0;
  const meshRef = useRef();

  useFrame((state) => {
    if (active && meshRef.current) {
      // Soft interactive tilt based on mouse
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, state.mouse.y * 0.5, 0.05);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, state.mouse.x * 0.5, 0.05);
    }
  });

  return (
    <group visible={active} scale={layoutScale}>
      {/* Liquid Metal Background */}
      <mesh ref={meshRef} position={[0, 0, -3]}>
        <planeGeometry args={[25, 25, 64, 64]} />
        <MeshDistortMaterial
          color="#1a1a1a"
          envMapIntensity={2.0}
          clearcoat={1}
          clearcoatRoughness={0.1}
          metalness={0.9}
          roughness={0.15}
          distort={0.4}
          speed={2}
        />
      </mesh>

      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.2} position={[0, 0, 1]}>
        <Text
          fontSize={1.8}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.08}
        >
          gnapix
        </Text>
      </Float>
    </group>
  );
}

// Concept C: Infinite Gallery Tunnel
export function HeroSceneC({ active }) {
  const { viewport } = useThree();
  const groupRef = useRef();
  const isMobile = viewport.width < 7;
  const layoutScale = isMobile ? viewport.width / 9.0 : 1.0;

  const tunnelItems = useMemo(() => {
    const items = [];
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const radius = 3.5;
      const seed = i * 1.5 + 0.5;
      const xVal = Math.sin(seed) * 10000;
      const randVal = xVal - Math.floor(xVal);
      const z = (randVal - 0.5) * 15;
      items.push({
        id: i,
        pos: [Math.cos(angle) * radius, Math.sin(angle) * radius, z],
        rot: [0, angle + Math.PI / 2, 0] // face inwards
      });
    }
    return items;
  }, []);

  useFrame((state, delta) => {
    if (!active) return;
    if (groupRef.current) {
      // Endless rotation
      groupRef.current.rotation.z -= delta * 0.15;
      // Mouse interaction
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, state.mouse.y * 0.5, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, state.mouse.x * 0.5, 0.05);
    }
  });

  return (
    <group visible={active} scale={layoutScale}>
      <group ref={groupRef}>
        {tunnelItems.map((item, i) => (
          <PolaroidModel key={item.id} position={item.pos} rotation={item.rot} scale={0.4} pictureIndex={i % 5} />
        ))}
      </group>
      
      <Float speed={1.2} rotationIntensity={0} floatIntensity={0.1} position={[0, 0, -1]}>
        <Text
          fontSize={1.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.1}
        >
          gnapix
        </Text>
      </Float>
    </group>
  );
}
