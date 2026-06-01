import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { routeCurve } from '../data/route';

const BASE_ROUTE_SPEED = 0.011;
const ROUTE_LOOK_AHEAD = 0.04;

export function CustomControls({ routeEndProgress = 1 }: { routeEndProgress?: number }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const routeProgress = useRef(0);
  const routeDirection = useRef(1);
  const routeSpeed = useRef(1);
  const routeEnd = useRef(routeEndProgress);

  useEffect(() => {
    camera.position.copy(routeCurve.points[0]);
    controlsRef.current?.target.copy(routeCurve.getPoint(0.05));

    const handleSpeedChange = (event: Event) => {
      const nextSpeed = (event as CustomEvent<number>).detail;
      if (typeof nextSpeed !== 'number' || Number.isNaN(nextSpeed)) return;
      routeSpeed.current = THREE.MathUtils.clamp(nextSpeed, 0.25, 3);
    };

    window.addEventListener('route-speed-change', handleSpeedChange);
    return () => {
      window.removeEventListener('route-speed-change', handleSpeedChange);
    };
  }, [camera]);

  useEffect(() => {
    routeEnd.current = THREE.MathUtils.clamp(routeEndProgress, 0.18, 1);
    if (routeProgress.current > routeEnd.current) {
      routeProgress.current = routeEnd.current;
      routeDirection.current = -1;
    }
  }, [routeEndProgress]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    routeProgress.current += delta * BASE_ROUTE_SPEED * routeSpeed.current * routeDirection.current;

    if (routeProgress.current >= routeEnd.current) {
      routeProgress.current = routeEnd.current;
      routeDirection.current = -1;
    } else if (routeProgress.current <= 0) {
      routeProgress.current = 0;
      routeDirection.current = 1;
    }

    const currentPoint = routeCurve.getPoint(routeProgress.current);
    const targetProgress = THREE.MathUtils.clamp(
      routeProgress.current + ROUTE_LOOK_AHEAD * routeDirection.current,
      0,
      routeEnd.current,
    );
    const nextPoint = routeCurve.getPoint(targetProgress);

    camera.position.copy(currentPoint);
    controlsRef.current.target.copy(nextPoint);
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      makeDefault
      enablePan={false}
      enableZoom
      zoomSpeed={1.2}
      rotateSpeed={1.8}
      minPolarAngle={Math.PI / 2}
      maxPolarAngle={Math.PI / 2}
    />
  );
}
