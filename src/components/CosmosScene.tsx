import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { particlesData, ParticleData } from '../data/particles';
import { getRouteSymbol, routeCurve, routeMarkerPositions } from '../data/route';
import { CustomControls } from './CustomControls';
import { ExhibitionWork, fetchWorks } from '../lib/api';

const WHITE = '#f8fbff';
const MAX_SHOWCASE_WORKS = 100;
const PRELOAD_WORKS = 8;
const PLACEHOLDER_CARD_URL = '/assets/route-note-card.png';
const CARD_TEXTURE_WIDTH = 640;
const CARD_TEXTURE_HEIGHT = 448;
const DEFAULT_CARD_SCALE = 0.72;
const DEFAULT_ROUTE_SPREAD = 0.7;

function createNoteTexture(symbol: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 156px "Arial Unicode MS", "Times New Roman", Georgia, serif';

  for (const blur of [34, 22, 12]) {
    ctx.shadowColor = 'rgba(245, 249, 255, 1)';
    ctx.shadowBlur = blur;
    ctx.fillStyle = 'rgba(245, 249, 255, 0.28)';
    ctx.fillText(symbol, 128, 126);
  }

  ctx.shadowBlur = 10;
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 3;
  ctx.strokeText(symbol, 128, 126);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(symbol, 128, 126);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function createRouteCardTexture(image: HTMLImageElement, symbol: string, cornerIndex: number) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_TEXTURE_WIDTH;
  canvas.height = CARD_TEXTURE_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  const cardX = 32;
  const cardY = 22;
  const cardW = 576;
  const cardH = 404;
  const radius = 34;
  const sourceAspect = image.width / image.height;
  const cardAspect = cardW / cardH;
  const drawW = sourceAspect > cardAspect ? cardW : cardH * sourceAspect;
  const drawH = sourceAspect > cardAspect ? cardW / sourceAspect : cardH;
  const drawX = cardX + (cardW - drawW) / 2;
  const drawY = cardY + (cardH - drawH) / 2;
  const corners = [
    [cardX + 50, cardY + 50],
    [cardX + cardW - 50, cardY + 50],
    [cardX + cardW - 50, cardY + cardH - 50],
    [cardX + 50, cardY + cardH - 50],
  ];
  const [noteX, noteY] = corners[cornerIndex % corners.length];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.shadowColor = 'rgba(170, 210, 255, 0.55)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.fill();

  ctx.save();
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.clip();
  ctx.fillStyle = '#020712';
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.drawImage(image, drawX, drawY, drawW, drawH);
  ctx.restore();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.stroke();

  ctx.shadowColor = 'rgba(123, 62, 235, 0.48)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(noteX, noteY, 39, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 48px "Arial Unicode MS", "Times New Roman", Georgia, serif';
  ctx.fillStyle = '#7c2de2';
  ctx.fillText(symbol, noteX, noteY + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`图片加载失败: ${url}`));
    image.src = url;
  });
}

function createStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 58);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.18, 'rgba(255,255,255,0.95)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 16;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(64, 4);
  ctx.lineTo(64, 124);
  ctx.moveTo(4, 64);
  ctx.lineTo(124, 64);
  ctx.stroke();
  return new THREE.CanvasTexture(canvas);
}

function Particle({ data }: { data: ParticleData }) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const texture = useMemo(() => createNoteTexture(data.symbol), [data.symbol]);

  useFrame(({ clock }) => {
    if (spriteRef.current) {
      const time = clock.elapsedTime;
      spriteRef.current.position.y = Math.sin(time * data.drift + data.position[0]) * (0.34 + data.depth * 0.42);
      spriteRef.current.material.rotation = data.rotation + Math.sin(time * 0.35 + data.position[2]) * 0.08;
    }
  });

  return (
    <group position={data.position}>
      <sprite
        ref={spriteRef}
        scale={[data.scale, data.scale, 1]}
      >
        <spriteMaterial
          map={texture}
          color={WHITE}
          transparent
          opacity={0.9 - data.depth * 0.48}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}

function RouteNote({
  position,
  symbol,
  noteIndex,
  work,
  preload = false,
  cardScaleFactor,
}: {
  position: THREE.Vector3;
  symbol: string;
  noteIndex: number;
  work?: ExhibitionWork;
  preload?: boolean;
  cardScaleFactor: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [armed, setArmed] = useState(preload);
  const [activeTexture, setActiveTexture] = useState<THREE.Texture | null>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const placeholderTexture = useLoader(THREE.TextureLoader, PLACEHOLDER_CARD_URL);

  useEffect(() => {
    placeholderTexture.colorSpace = THREE.SRGBColorSpace;
    placeholderTexture.needsUpdate = true;
  }, [placeholderTexture]);

  const displayPosition = useMemo(() => {
    const lane = noteIndex % 6;
    const sideLane = lane % 3;
    const sideBias = lane < 3 ? -1 : 1;
    const xOffset = sideBias * (0.55 + sideLane * 0.52);
    const heightOffset = sideLane === 0 ? -0.38 : sideLane === 1 ? 0.2 : -0.86;
    const zOffset = sideLane * 0.34;
    return new THREE.Vector3(position.x + xOffset, position.y + heightOffset, position.z + zOffset);
  }, [position, noteIndex]);

  const cardScale = useMemo(() => {
    const depthRatio = noteIndex / Math.max(1, routeMarkerPositions.length - 1);
    const height = THREE.MathUtils.lerp(0.78, 0.22, depthRatio) * cardScaleFactor;
    const hoverFactor = hovered ? 1.12 : 1;
    return [height * 1.48 * hoverFactor, height * hoverFactor, 1] as [number, number, number];
  }, [cardScaleFactor, hovered, noteIndex]);

  const targetUrl = work?.url || '';
  const coverUrl = work?.coverUrl || '';
  const hasWork = Boolean(targetUrl && coverUrl);

  useEffect(() => {
    if (!activeTexture) return;
    return () => {
      activeTexture.dispose();
    };
  }, [activeTexture]);

  useEffect(() => {
    if (!armed || !hasWork) {
      setActiveTexture(null);
      return;
    }

    let cancelled = false;
    loadImage(coverUrl)
      .then((image) => {
        if (cancelled) return;
        setActiveTexture(createRouteCardTexture(image, symbol, noteIndex));
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn('Unable to load work cover', error);
          setActiveTexture(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [armed, hasWork, coverUrl, symbol, noteIndex]);

  useCursor(hovered, 'pointer', 'auto');

  useFrame(({ camera, clock }) => {
    const distance = camera.position.distanceTo(displayPosition);
    const loadDistance = preload ? 38 : 24;
    const unloadDistance = preload ? 64 : 42;

    if (!armed && distance < loadDistance) {
      setArmed(true);
    } else if (armed && distance > unloadDistance) {
      setArmed(false);
    }

    if (spriteRef.current) {
      if (!hovered && distance > 82 && !armed) return;

      const time = clock.elapsedTime;
      const phase = noteIndex * 1.37;
      const sideBias = noteIndex % 2 === 0 ? -1 : 1;
      const sideSweep = Math.sin(time * 0.34 + phase) * (0.16 + (noteIndex % 4) * 0.045);
      const orbitSweep = Math.cos(time * 0.28 + phase * 0.7) * (0.08 + (noteIndex % 3) * 0.03);
      const lowPass = noteIndex % 6 < 4 ? -0.08 : 0;
      const xDrift = sideBias * (0.08 + (noteIndex % 5) * 0.018) + sideSweep;
      const yDrift = lowPass + Math.cos(time * 0.38 + phase * 0.8) * (0.025 + (noteIndex % 3) * 0.012);
      const zDrift = Math.sin(time * 0.32 + phase * 1.2) * (0.08 + (noteIndex % 4) * 0.025) + orbitSweep;
      spriteRef.current.material.rotation = Math.sin(time * 0.45 + displayPosition.x + phase) * 0.08;
      spriteRef.current.position.set(
        displayPosition.x + xDrift,
        displayPosition.y + yDrift,
        displayPosition.z + zDrift,
      );
    }
  });

  const texture = activeTexture || placeholderTexture;

  return (
    <sprite
      ref={spriteRef}
      position={displayPosition}
      scale={cardScale}
      onClick={() => {
        if (targetUrl) {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <spriteMaterial
        map={texture}
        transparent
        opacity={hovered ? 1 : activeTexture ? 0.99 : 0.92}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

function SparkleField() {
  const texture = useMemo(createStarTexture, []);
  const stars = useMemo(() => {
    return Array.from({ length: 34 }).map((_, i) => {
      const x = -28 + ((i * 13) % 56);
      const y = -5 + ((i * 19) % 34);
      const z = -14 + ((i * 17) % 22);
      return {
        position: [x, y, z] as [number, number, number],
        scale: 0.35 + (i % 5) * 0.18,
        rotation: (i % 7) * 0.35,
      };
    });
  }, []);

  return (
    <>
      {stars.map((star, i) => (
        <sprite key={i} position={star.position} scale={[star.scale, star.scale, 1]}>
          <spriteMaterial
            map={texture}
            rotation={star.rotation}
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </>
  );
}

function GroundDust() {
  const { fine, bright } = useMemo(() => {
    const fineCount = 18000;
    const finePositions = new Float32Array(fineCount * 3);
    for (let i = 0; i < fineCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.pow(Math.random(), 0.28) * 380;
      finePositions[i * 3] = Math.cos(angle) * radius;
      finePositions[i * 3 + 1] = -12.2 + Math.random() * 0.42;
      finePositions[i * 3 + 2] = Math.sin(angle) * radius * 0.48 - Math.random() * 34;
    }

    const brightCount = 2600;
    const brightPositions = new Float32Array(brightCount * 3);
    for (let i = 0; i < brightCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.pow(Math.random(), 0.42) * 190;
      brightPositions[i * 3] = Math.cos(angle) * radius;
      brightPositions[i * 3 + 1] = -11.95 + Math.random() * 0.6;
      brightPositions[i * 3 + 2] = Math.sin(angle) * radius * 0.5 - Math.random() * 26;
    }

    const fineGeometry = new THREE.BufferGeometry();
    fineGeometry.setAttribute('position', new THREE.BufferAttribute(finePositions, 3));
    const brightGeometry = new THREE.BufferGeometry();
    brightGeometry.setAttribute('position', new THREE.BufferAttribute(brightPositions, 3));
    return { fine: fineGeometry, bright: brightGeometry };
  }, []);

  return (
    <>
      <points geometry={fine}>
        <pointsMaterial
          size={0.16}
          color={WHITE}
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <points geometry={bright}>
        <pointsMaterial
          size={0.34}
          color={WHITE}
          transparent
          opacity={0.78}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </>
  );
}

function SpiralRings() {
  const groupRef = useRef<THREE.Group>(null);
  const rings = useMemo(() => {
    return [12, 23, 36].map((radius, ringIndex) => {
      const group = new THREE.Group();
      const segmentCount = 34;
      const visibleFraction = 0.46;

      for (let segment = 0; segment < segmentCount; segment += 1) {
        const start = (segment / segmentCount) * Math.PI * 2;
        const end = start + (Math.PI * 2 / segmentCount) * visibleFraction;
        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= 10; i += 1) {
          const angle = start + (end - start) * (i / 10);
          points.push(new THREE.Vector3(Math.cos(angle) * radius, -11.55, Math.sin(angle) * radius * 0.42));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const core = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 12, 0.035 + ringIndex * 0.012, 8, false),
          new THREE.MeshBasicMaterial({
            color: WHITE,
            transparent: true,
            opacity: 0.22 - ringIndex * 0.04,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          }),
        );
        const glow = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 12, 0.24 + ringIndex * 0.08, 10, false),
          new THREE.MeshBasicMaterial({
            color: WHITE,
            transparent: true,
            opacity: 0.045,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          }),
        );

        group.add(glow);
        group.add(core);
      }

      group.rotation.y = ringIndex * 0.1;
      return group;
    });
  }, []);

  const halo = useMemo(() => {
    const count = 2200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 34 + Math.random() * 180;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -12.05 + Math.random() * 0.32;
      positions[i * 3 + 2] = Math.sin(angle) * radius * 0.42;
    }
    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return bufferGeometry;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.02;
  });

  return (
    <group ref={groupRef}>
      <points geometry={halo}>
        <pointsMaterial
          size={0.06}
          color={WHITE}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      {rings.map((ring, i) => (
        <primitive key={i} object={ring} />
      ))}
    </group>
  );
}

export function CosmosScene() {
  const [works, setWorks] = useState<ExhibitionWork[]>([]);
  const [cardScaleFactor, setCardScaleFactor] = useState(DEFAULT_CARD_SCALE);
  const [routeSpread, setRouteSpread] = useState(DEFAULT_ROUTE_SPREAD);

  useEffect(() => {
    let cancelled = false;

    async function loadWorks() {
      try {
        const nextWorks = await fetchWorks();
        if (!cancelled) {
          setWorks(nextWorks.slice(0, MAX_SHOWCASE_WORKS));
        }
      } catch (error) {
        console.warn('Unable to load Review works', error);
      }
    }

    loadWorks();
    window.addEventListener('works-updated', loadWorks);

    const handleCardScaleChange = (event: Event) => {
      const nextScale = (event as CustomEvent<number>).detail;
      if (typeof nextScale !== 'number' || Number.isNaN(nextScale)) return;
      setCardScaleFactor(THREE.MathUtils.clamp(nextScale, 0.38, 1.2));
    };
    const handleRouteSpreadChange = (event: Event) => {
      const nextSpread = (event as CustomEvent<number>).detail;
      if (typeof nextSpread !== 'number' || Number.isNaN(nextSpread)) return;
      setRouteSpread(THREE.MathUtils.clamp(nextSpread, 0.35, 1));
    };

    window.addEventListener('route-card-scale-change', handleCardScaleChange);
    window.addEventListener('route-spread-change', handleRouteSpreadChange);

    return () => {
      cancelled = true;
      window.removeEventListener('works-updated', loadWorks);
      window.removeEventListener('route-card-scale-change', handleCardScaleChange);
      window.removeEventListener('route-spread-change', handleRouteSpreadChange);
    };
  }, []);

  const showcaseWorks = useMemo(() => works.slice(0, MAX_SHOWCASE_WORKS), [works]);
  const routeEndProgress = useMemo(() => {
    if (!showcaseWorks.length) return 0.18;
    const countRatio = showcaseWorks.length / MAX_SHOWCASE_WORKS;
    return THREE.MathUtils.clamp((0.22 + countRatio * 0.78) * routeSpread, 0.18, 1);
  }, [routeSpread, showcaseWorks.length]);
  const showcasePositions = useMemo(() => {
    const count = showcaseWorks.length;
    if (!count) return [];
    if (count === 1) return [routeCurve.getPoint(0.08)];

    return showcaseWorks.map((_, index) => {
      const progress = (index / Math.max(1, count - 1)) * routeEndProgress;
      return routeCurve.getPoint(progress);
    });
  }, [routeEndProgress, showcaseWorks]);

  return (
    <div className="absolute inset-0 h-full w-full bg-black">
      <Canvas camera={{ position: [0, 7, 35], fov: 52 }}>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 28, 82]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[0, -4, 8]} intensity={34} color={WHITE} distance={44} />
        <pointLight position={[0, 14, -8]} intensity={18} color={WHITE} distance={60} />

        <GroundDust />
        <SpiralRings />
        <SparkleField />

        {showcaseWorks.map((work, i) => (
          <RouteNote
            key={work.id || `review-work-${i}`}
            position={showcasePositions[i] || routeMarkerPositions[i] || routeMarkerPositions[routeMarkerPositions.length - 1]}
            symbol={getRouteSymbol(i)}
            noteIndex={i}
            work={work}
            preload={i < PRELOAD_WORKS}
            cardScaleFactor={cardScaleFactor}
          />
        ))}

        {particlesData.map((particle, i) => (
          <Particle key={i} data={particle} />
        ))}

        <CustomControls routeEndProgress={routeEndProgress} />
      </Canvas>
    </div>
  );
}
