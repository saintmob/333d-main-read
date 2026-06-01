import * as THREE from 'three';

export const routePoints = [
  new THREE.Vector3(0, 0, 30),
  new THREE.Vector3(-3.5, 1.8, 16),
  new THREE.Vector3(-1.4, 0.6, 2),
  new THREE.Vector3(1.9, -0.8, -12),
  new THREE.Vector3(0.8, 1.3, -26),
  new THREE.Vector3(0, 1.8, -42),
  new THREE.Vector3(0, 2.2, -56),
];

export const routeCurve = new THREE.CatmullRomCurve3(routePoints, false, 'catmullrom', 0.85);
export const routeMarkerPositions = routeCurve.getSpacedPoints(99);
export const routeSymbolSequence = ['♪', '♫', '♬', '♩', '♭', '♯', '♮'];

export function getRouteSymbol(index: number) {
  return routeSymbolSequence[index % routeSymbolSequence.length];
}
