'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 1000;

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const mouse = useRef({ x: 0, y: 0 });

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const gold = new THREE.Color('#eab308');
    const purple = new THREE.Color('#6366f1');

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;

      const mix = Math.random();
      const c = gold.clone().lerp(purple, mix * 0.65);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const t = state.clock.elapsedTime;
    pts.rotation.y = t * 0.015 + mouse.current.x * 0.08;
    pts.rotation.x = Math.sin(t * 0.1) * 0.04 + mouse.current.y * 0.05;
  });

  return (
    <group
      onPointerMove={(e) => {
        mouse.current.x = (e.pointer.x ?? 0) * 0.5;
        mouse.current.y = (e.pointer.y ?? 0) * 0.5;
      }}
    >
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          vertexColors
          transparent
          opacity={0.32}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function EliteAmbientScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      style={{ width: '100%', height: '100%' }}
    >
      <ParticleField />
    </Canvas>
  );
}
