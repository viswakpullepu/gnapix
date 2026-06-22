/* eslint-disable react-refresh/only-export-components */
import { useMemo, forwardRef } from 'react';
import * as THREE from 'three';

// Helper to generate a soft, premium smiley canvas texture
export function useSmileyTexture(color = '#FFD83B') {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    ctx.imageSmoothingEnabled = true;

    // Background fill
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2A2A2A';
    ctx.lineWidth = 16;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#2A2A2A';
    ctx.beginPath();
    ctx.arc(170, 200, 28, 0, Math.PI * 2);
    ctx.arc(342, 200, 28, 0, Math.PI * 2);
    ctx.fill();

    // Blush cheeks
    ctx.fillStyle = 'rgba(255, 100, 100, 0.4)';
    ctx.beginPath();
    ctx.arc(110, 270, 35, 0, Math.PI * 2);
    ctx.arc(402, 270, 35, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#2A2A2A';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(256, 250, 120, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }, [color]);
}

// Helper to generate neon wave canvas texture
export function useWaveTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#FF4565');
    gradient.addColorStop(0.5, '#8F00FF');
    gradient.addColorStop(1, '#00F0FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Wave lines
    ctx.strokeStyle = 'rgba(254, 251, 247, 0.85)';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 512; i += 8) {
      const y = 256 + Math.sin(i * 0.02) * 80;
      if (i === 0) ctx.moveTo(i, y);
      else ctx.lineTo(i, y);
    }
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }, []);
}

// Helper to generate generic picture texture for Polaroids
export function usePictureTexture(index) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const colors = [
      ['#FF7E5F', '#FEB47B'],
      ['#4FACFE', '#00F2FE'],
      ['#F35588', '#FF8F8F'],
      ['#11998e', '#38ef7d'],
      ['#D4145A', '#FBB03B']
    ];
    const picked = colors[index % colors.length];

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, picked[0]);
    gradient.addColorStop(1, picked[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(256, 220, 100, 0, Math.PI * 2);
    ctx.fill();

    // Mountains
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.lineTo(180, 260);
    ctx.lineTo(340, 512);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(140, 512);
    ctx.lineTo(320, 300);
    ctx.lineTo(512, 512);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }, [index]);
}

// 3D Camera Model (ForwardRef support)
export const CameraModel = forwardRef((props, ref) => {
  return (
    <group ref={ref} {...props}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.0, 0.8]} />
        <meshPhysicalMaterial
          color="#1A1A1A"
          roughness={0.15}
          metalness={0.85}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.2, 0.2, 0.6]} />
        <meshPhysicalMaterial color="#A0522D" roughness={0.3} clearcoat={0.3} />
      </mesh>
      <mesh position={[0.45, 0.7, 0.1]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 32]} />
        <meshStandardMaterial color="#FAF8F5" metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.3, 64]} />
        <meshPhysicalMaterial color="#282828" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.61]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.04, 64]} />
        <meshPhysicalMaterial
          color="#00f0ff"
          transmission={0.95}
          opacity={1}
          transparent={true}
          roughness={0.01}
          ior={1.65}
        />
      </mesh>
      <mesh position={[-0.4, 0.35, 0.41]} castShadow>
        <boxGeometry args={[0.26, 0.16, 0.04]} />
        <meshStandardMaterial color="#FAF8F5" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
});

// 3D Polaroid Model (ForwardRef support)
export const PolaroidModel = forwardRef(({ pictureIndex = 0, ...props }, ref) => {
  const picTexture = usePictureTexture(pictureIndex);

  return (
    <group ref={ref} {...props}>
      {/* Thicker, more substantial polaroid frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.8, 0.12]} />
        <meshPhysicalMaterial color="#FDFBF7" roughness={0.7} metalness={0.05} clearcoat={0.1} />
      </mesh>
      {/* High-end glossy photograph area */}
      <mesh position={[0, 0.15, 0.065]}>
        <planeGeometry args={[1.32, 1.22]} />
        <meshPhysicalMaterial 
          map={picTexture} 
          roughness={0.2} 
          metalness={0.0} 
          clearcoat={0.4} 
          clearcoatRoughness={0.2} 
          polygonOffset={true}
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
      {/* Small textured bottom lip */}
      <mesh position={[0, -0.6, 0.064]}>
        <planeGeometry args={[1.32, 0.28]} />
        <meshStandardMaterial color="#FDFBF7" roughness={0.9} polygonOffset={true} polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
    </group>
  );
});

// 3D Magnet Model (ForwardRef support)
export const MagnetModel = forwardRef(({ pictureIndex = 1, ...props }, ref) => {
  const picTexture = usePictureTexture(pictureIndex);

  return (
    <group ref={ref} {...props}>
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[1.22, 1.22]} />
        <meshBasicMaterial map={picTexture} toneMapped={false} polygonOffset={true} polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      
      <mesh position={[0, 0, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 1.3, 0.09]} />
        <meshPhysicalMaterial
          transmission={1.0}
          roughness={0.0}
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          ior={1.6}
          thickness={1.2}
          transparent={true}
          dispersion={0.5}
          color="#ffffff"
        />
      </mesh>

      {[-0.55, 0.55].map((x) =>
        [-0.55, 0.55].map((y) => (
          <mesh key={`${x}-${y}`} position={[x, y, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.03, 32]} />
            <meshStandardMaterial color="#e0e0e0" metalness={0.98} roughness={0.02} />
          </mesh>
        ))
      )}
    </group>
  );
});

// 3D Sticker Model (ForwardRef support)
export const StickerModel = forwardRef(({ texture, ...props }, ref) => {
  return (
    <mesh ref={ref} {...props} castShadow>
      <cylinderGeometry args={[0.6, 0.6, 0.02, 64]} />
      <meshPhysicalMaterial
        map={texture}
        roughness={0.02}
        metalness={0.2}
        clearcoat={1.0}
        clearcoatRoughness={0.01}
        iridescence={0.8}
        iridescenceIOR={1.3}
        iridescenceThicknessRange={[100, 400]}
      />
    </mesh>
  );
});
