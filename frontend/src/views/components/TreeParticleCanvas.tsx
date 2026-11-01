import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { generateTreeParticles, TREE_BASE_Y } from '../../utils/treeParticles';
import { type NavItem } from '../../models/navigation.model';

export interface TreeParticleCanvasProps {
  className?: string;
  /** Progresso de crescimento da árvore (0 = partículas dispersas, 1 = árvore completa) */
  progress?: number;
  /** Ref opcional para controle a 60fps sem disparar re-render no React */
  progressRef?: React.RefObject<number>;
  /** Força de repulsão do mouse (padrão: 1.0) */
  repulsionStrength?: number;
  /** Quantidade de galhos principais quando `branches` não é informado (padrão: 5) */
  mainBranches?: number;
  /** Seções ancoradas nos galhos principais, da esquerda para a direita */
  branches?: readonly NavItem[];
  /** Seções ancoradas nas raízes, da esquerda para a direita */
  roots?: readonly NavItem[];
  /** Acionado ao clicar em um galho ou na raiz */
  onNodeClick?: (href: string, sectionId: string) => void;
}

const FOV = 45;
const REPULSION_RADIUS = 1.8;
const LABEL_GAP = 10;
const LABEL_EDGE_MARGIN = 4;
/** Raio (em unidades de mundo) do pincel que pinta as partículas sob o cursor */
const PAINT_RADIUS = 1.7;
/** Tamanho do array de grupos no shader: grupo 0 + galhos + raízes */
const MAX_GROUPS = 12;
const HIGHLIGHT_COLOR = '#ffdf00'; // semispe-yellow

interface LabelSlot {
  x: number;
  y: number;
}

/**
 * Em telas largas as pílulas não seguem as pontas dos galhos (assimétricas e em
 * movimento com o giro da árvore): ficam paradas em pares espelhados, na mesma
 * altura, logo fora do contorno da copa e das raízes já contando o vai-e-vem.
 * Unidades do mundo no plano z = 0, de fora para dentro em cada lado; `x` é o
 * ponto de onde a pílula cresce para fora.
 */
const WIDE_BRANCH_SLOTS: readonly LabelSlot[] = [
  { x: 6.4, y: 0.6 },
  { x: 4.9, y: 4.5 },
];
const WIDE_ROOT_SLOTS: readonly LabelSlot[] = [{ x: 3.2, y: -4.1 }];

/** Posição espelhada do rótulo `i` (da esquerda para a direita) entre `count`, ou null se não houver */
function mirroredSlot(slots: readonly LabelSlot[], i: number, count: number) {
  const slot = count % 2 === 0 ? slots[Math.min(i, count - 1 - i)] : undefined;
  return slot ? new THREE.Vector3(i < count / 2 ? -slot.x : slot.x, slot.y, 0) : null;
}

const labelBaseClass =
  'absolute top-0 left-0 opacity-0 will-change-transform flex items-center gap-2 whitespace-nowrap rounded-full border backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-white shadow-lg shadow-black/20 transition-colors duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-yellow group border-white/20 bg-white/10 hover:border-semispe-yellow hover:bg-semispe-yellow/15 focus-visible:border-semispe-yellow focus-visible:bg-semispe-yellow/15';

const labelDotClass =
  'w-1.5 h-1.5 rounded-full bg-[#3b9cd6] shadow-[0_0_8px_#3b9cd6] transition-colors duration-300 group-hover:bg-semispe-yellow group-hover:shadow-[0_0_8px_#ffdf00] group-focus-visible:bg-semispe-yellow';

// A animação roda inteira na GPU: a CPU só atualiza uniforms a cada frame
const particleVertexShader = /* glsl */ `
  attribute vec3 aScatter;
  attribute vec3 aColor;
  attribute vec4 aSeed;
  attribute float aGroup;

  uniform float uTime;
  uniform float uProgress;
  uniform float uScale;
  uniform float uSize;
  uniform float uBaseY;
  uniform vec3 uMouse;
  uniform float uRepel;
  uniform float uRepelRadius;
  uniform float uPaint;
  uniform float uPaintRadius;
  uniform vec3 uHighlight;
  uniform float uGroupGlow[${MAX_GROUPS}];

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // A árvore cresce da base para as pontas conforme a ordem de cada partícula
    float start = aSeed.w * 0.7;
    float p = smoothstep(start, start + 0.3, uProgress);

    vec3 pos = mix(aScatter, position, p);

    // Balanço de vento, mais forte quanto mais alto
    float h = max(position.y - uBaseY, 0.0);
    float sway = h * h * 0.012 * p;
    pos.x += sin(uTime * 0.7 + position.y * 0.6 + aSeed.x) * sway;
    pos.z += cos(uTime * 0.5 + position.x * 0.5 + aSeed.x) * sway;

    // Drift orgânico individual
    float phase = aSeed.x * 6.2831;
    float drift = 0.025 * (1.0 + (1.0 - p) * 4.0);
    pos += vec3(
      sin(uTime * 1.3 + phase),
      cos(uTime * 1.1 + phase * 1.7),
      sin(uTime * 0.9 + phase * 2.3)
    ) * drift;

    vec4 world = modelMatrix * vec4(pos, 1.0);

    // Destaque em amarelo: o galho/raiz do rótulo em hover inteiro, ou o
    // trecho da árvore sob o cursor (pincel)
    float paint = (1.0 - smoothstep(0.0, uPaintRadius, length(world.xy - uMouse.xy))) * uPaint;
    int group = int(clamp(aGroup + 0.5, 0.0, float(${MAX_GROUPS - 1})));
    float highlight = max(uGroupGlow[group], paint) * p;

    // Repulsão do mouse no plano da tela
    vec2 away = world.xy - uMouse.xy;
    float force = (1.0 - smoothstep(0.0, uRepelRadius, length(away))) * uRepel;
    world.xy += normalize(away + vec2(0.0001)) * force;
    world.z += (aSeed.z - 0.5) * force * 1.5;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aSeed.y * (1.0 + 0.3 * highlight) * uScale / -mv.z;

    float twinkle = 0.75 + 0.25 * sin(uTime * (1.0 + aSeed.z * 2.0) + phase);
    vColor = mix(aColor, uHighlight, highlight) * twinkle;
    vAlpha = mix(0.3, 1.0, p);
  }
`;

const particleFragmentShader = /* glsl */ `
  uniform float uOpacity;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    gl_FragColor = vec4(vColor, glow * glow * vAlpha * uOpacity);
  }
`;

const rippleVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const rippleFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;

  varying vec2 vUv;

  void main() {
    vec2 c = (vUv - 0.5) * 2.0;
    float r = length(c);
    float angle = atan(c.y, c.x);

    // Leve irregularidade para os anéis não ficarem círculos perfeitos
    float wobble = r + 0.015 * sin(angle * 3.0 + uTime * 0.4) + 0.01 * sin(angle * 7.0 - uTime * 0.3);
    float ring = smoothstep(0.82, 1.0, sin(wobble * 34.0 - uTime * 1.4));
    float fade = pow(1.0 - smoothstep(0.0, 1.0, r), 1.5);
    float glow = exp(-r * 7.0) * 0.6;

    // Azul (#1f71b7) e azul claro (#3b9cd6) do logotipo
    vec3 color = mix(vec3(0.12, 0.44, 0.72), vec3(0.23, 0.61, 0.84), ring * fade);
    gl_FragColor = vec4(color, (ring * 0.55 * fade + glow) * uProgress);
  }
`;

export function TreeParticleCanvas({
  className = '',
  progress = 1,
  progressRef: externalProgressRef,
  repulsionStrength = 1.0,
  mainBranches = 5,
  branches,
  roots,
  onNodeClick,
}: TreeParticleCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const branchLabelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rootLabelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Grupo de partículas (galho ou raiz) do rótulo em hover/foco; 0 = nenhum
  const hoveredGroupRef = useRef<number>(0);
  const branchCount = branches?.length || mainBranches;
  const rootCount = roots?.length || 1;
  const internalProgressRef = useRef<number>(progress);
  internalProgressRef.current = progress;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    // 1. Inicialização da Cena Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0); // Fundo transparente

    // 2. Partículas da Árvore
    const tree = generateTreeParticles({
      count: isTouchDevice ? 30000 : 66000,
      mainBranches: branchCount,
      rootAnchorCount: rootCount,
    });

    const scatter = new Float32Array(tree.count * 3);
    for (let i = 0; i < tree.count; i++) {
      const i3 = i * 3;
      // Dispersão volumétrica 3D com profundidade no eixo Z
      scatter[i3] = (Math.random() - 0.5) * 18;
      scatter[i3 + 1] = (Math.random() - 0.5) * 13;
      scatter[i3 + 2] = (Math.random() - 0.5) * 8;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(tree.positions, 3));
    geometry.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(tree.colors, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(tree.seeds, 4));
    geometry.setAttribute('aGroup', new THREE.BufferAttribute(tree.groups, 1));

    const groupGlow: number[] = Array(MAX_GROUPS).fill(0);

    const material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: prefersReducedMotion ? 1 : 0 },
        uScale: { value: 1 },
        uSize: { value: 0.085 },
        uOpacity: { value: 0.6 },
        uBaseY: { value: TREE_BASE_Y },
        uMouse: { value: new THREE.Vector3(9999, 9999, 0) },
        uRepel: { value: 0 },
        uRepelRadius: { value: REPULSION_RADIUS },
        uPaint: { value: 0 },
        uPaintRadius: { value: PAINT_RADIUS },
        uHighlight: { value: new THREE.Color(HIGHLIGHT_COLOR) },
        uGroupGlow: { value: groupGlow },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    particleSystem.frustumCulled = false; // posições são deslocadas no shader
    scene.add(particleSystem);

    // 3. Ondas concêntricas no solo, na base do tronco
    const rippleGeometry = new THREE.PlaneGeometry(18, 18);
    const rippleMaterial = new THREE.ShaderMaterial({
      vertexShader: rippleVertexShader,
      fragmentShader: rippleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: prefersReducedMotion ? 1 : 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    const ripples = new THREE.Mesh(rippleGeometry, rippleMaterial);
    ripples.rotation.x = -Math.PI / 2;
    ripples.position.y = TREE_BASE_Y;
    scene.add(ripples);

    // 4. Projeção de Mouse no Plano Z = 0
    const mouseTarget = new THREE.Vector3(9999, 9999, 0);
    const pointer = new THREE.Vector2();
    const intersectionPoint = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let isMouseInside = false;

    const handlePointerMove = (e: MouseEvent) => {
      if (isTouchDevice || prefersReducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      );

      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(planeZ, intersectionPoint)) {
        if (!isMouseInside) material.uniforms.uMouse.value.copy(intersectionPoint);
        mouseTarget.copy(intersectionPoint);
        isMouseInside = true;
      }
    };

    const handlePointerLeave = () => {
      isMouseInside = false;
    };

    window.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mouseleave', handlePointerLeave);

    // 5. Rótulos HTML das seções, ancorados nos galhos e na raiz
    const projected = new THREE.Vector3();
    let viewWidth = 0;
    let viewHeight = 0;

    const branchSlots = tree.branchAnchors.map((_, i) => mirroredSlot(WIDE_BRANCH_SLOTS, i, branchCount));
    const rootSlots = tree.rootAnchors.map((_, i) => mirroredSlot(WIDE_ROOT_SLOTS, i, rootCount));
    const hasSlots = [...branchSlots, ...rootSlots].every((slot) => slot !== null);
    let useSlots = false;

    /** `followTree`: a âncora gira junto com a árvore; sem ele, fica parada na tela */
    const placeLabel = (
      el: HTMLButtonElement | null,
      anchor: THREE.Vector3,
      side: 'left' | 'right' | 'above' | 'below',
      opacity: number,
      followTree = true
    ) => {
      if (!el) return;
      projected.copy(anchor);
      if (followTree) projected.applyMatrix4(particleSystem.matrixWorld);
      projected.project(camera);
      const x = (projected.x * 0.5 + 0.5) * viewWidth;
      const y = (-projected.y * 0.5 + 0.5) * viewHeight;
      const w = el.offsetWidth;
      const h = el.offsetHeight;

      // O rótulo cresce para fora da copa, sem cobrir o próprio galho
      let left = x - w / 2;
      let top = y - h / 2;
      if (side === 'left') left = x - w - LABEL_GAP;
      else if (side === 'right') left = x + LABEL_GAP;
      else if (side === 'above') top = y - h - LABEL_GAP;
      else top = y;

      left = THREE.MathUtils.clamp(left, LABEL_EDGE_MARGIN, viewWidth - w - LABEL_EDGE_MARGIN);
      top = THREE.MathUtils.clamp(top, LABEL_EDGE_MARGIN, viewHeight - h - LABEL_EDGE_MARGIN);

      el.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
    };

    const updateLabels = (pVal: number) => {
      // Os galhos só ganham rótulo quando a copa termina de crescer; a raiz aparece antes
      const branchOpacity = THREE.MathUtils.smoothstep(pVal, 0.8, 1);
      const rootOpacity = THREE.MathUtils.smoothstep(pVal, 0.35, 0.6);

      tree.branchAnchors.forEach((anchor, i) => {
        const el = branchLabelRefs.current[i];
        const slot = useSlots ? branchSlots[i] : null;
        if (slot) return placeLabel(el, slot, slot.x < 0 ? 'left' : 'right', branchOpacity, false);
        const side = anchor.x < -0.8 ? 'left' : anchor.x > 0.8 ? 'right' : 'above';
        placeLabel(el, anchor, side, branchOpacity);
      });
      tree.rootAnchors.forEach((anchor, i) => {
        const el = rootLabelRefs.current[i];
        const slot = useSlots ? rootSlots[i] : null;
        if (slot) return placeLabel(el, slot, slot.x < 0 ? 'left' : 'right', rootOpacity, false);
        const side = anchor.x < -0.3 ? 'left' : anchor.x > 0.3 ? 'right' : 'below';
        placeLabel(el, anchor, side, rootOpacity);
      });
    };

    // 6. Tratamento Responsivo de Resize
    const bufferSize = new THREE.Vector2();

    const handleResize = () => {
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 500;
      const aspect = w / h;
      viewWidth = w;
      viewHeight = h;

      // Em telas estreitas (canvas mais alto que largo) a câmera recua só o
      // necessário para a copa caber de borda a borda
      const distance = Math.min(13.5 * Math.max(1, 1 / aspect), 24);
      camera.aspect = aspect;
      camera.position.set(0, 1.3, distance);
      camera.lookAt(0, 0.4, 0);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      // Posições fixas só quando a pílula mais larga cabe inteira ao lado do galho
      // de fora; em telas estreitas (celular) os rótulos seguem as pontas dos galhos
      useSlots = false;
      const outerSlot = branchSlots[0];
      if (hasSlots && outerSlot) {
        const widest = Math.max(...branchLabelRefs.current.map((el) => el?.offsetWidth ?? 0));
        projected.copy(outerSlot).project(camera);
        const outerLeft = (projected.x * 0.5 + 0.5) * w - LABEL_GAP - widest;
        useSlots = outerLeft >= LABEL_EDGE_MARGIN * 4;
      }

      renderer.setSize(w, h, false);
      renderer.getDrawingBufferSize(bufferSize);
      material.uniforms.uScale.value =
        (bufferSize.y * 0.5) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));

      if (prefersReducedMotion) {
        renderer.render(scene, camera);
        updateLabels(1);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // 7. Loop de Animação (Single requestAnimationFrame)
    let animationFrameId = 0;
    let isVisible = true;
    let lastTime = performance.now();
    let clock = 0;

    const animate = () => {
      if (!isVisible) return;
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      clock += Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const pVal = externalProgressRef ? externalProgressRef.current : internalProgressRef.current;
      const uniforms = material.uniforms;

      uniforms.uTime.value = clock;
      uniforms.uProgress.value = pVal;
      rippleMaterial.uniforms.uTime.value = clock;
      rippleMaterial.uniforms.uProgress.value = THREE.MathUtils.smoothstep(pVal, 0.2, 1);

      // Interpolação suave do mouse e da intensidade da repulsão
      if (isMouseInside) uniforms.uMouse.value.lerp(mouseTarget, 0.18);
      uniforms.uRepel.value = THREE.MathUtils.lerp(
        uniforms.uRepel.value,
        isMouseInside ? 0.18 * repulsionStrength : 0,
        0.1
      );

      // O amarelo acende e apaga suavemente, tanto no pincel quanto nos grupos
      uniforms.uPaint.value = THREE.MathUtils.lerp(uniforms.uPaint.value, isMouseInside ? 1 : 0, 0.1);
      for (let g = 1; g < MAX_GROUPS; g++) {
        groupGlow[g] = THREE.MathUtils.lerp(groupGlow[g], hoveredGroupRef.current === g ? 1 : 0, 0.12);
      }

      // Giro lento de vai-e-vem para revelar o volume 3D
      particleSystem.rotation.y = Math.sin(clock * 0.15) * 0.35;

      renderer.render(scene, camera);
      updateLabels(pVal);
    };

    // Controle com IntersectionObserver para pausar GPU quando fora de tela
    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible && !prefersReducedMotion) {
          cancelAnimationFrame(animationFrameId);
          lastTime = performance.now();
          animate();
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(container);

    if (!prefersReducedMotion) animate();

    // 8. Limpeza Estrita de Recursos (Prevenção de vazamento de WebGL context)
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);

      geometry.dispose();
      material.dispose();
      rippleGeometry.dispose();
      rippleMaterial.dispose();
      renderer.dispose();
    };
  }, [repulsionStrength, branchCount, rootCount]);

  const hoverHandlers = (group: number) => ({
    onMouseEnter: () => {
      hoveredGroupRef.current = group;
    },
    onMouseLeave: () => {
      if (hoveredGroupRef.current === group) hoveredGroupRef.current = 0;
    },
    onFocus: () => {
      hoveredGroupRef.current = group;
    },
    onBlur: () => {
      if (hoveredGroupRef.current === group) hoveredGroupRef.current = 0;
    },
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center pointer-events-auto select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        role="img"
        aria-label="Árvore em partículas 3D interativas do Parque Tecnológico de São Luís"
      />

      {(branches?.length || roots?.length) && (
        <nav aria-label="Seções do Parque Tecnológico" className="absolute inset-0 pointer-events-none">
          {branches?.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => {
                branchLabelRefs.current[i] = el;
              }}
              type="button"
              onClick={() => onNodeClick?.(item.href, item.id)}
              className={labelBaseClass}
              {...hoverHandlers(i + 1)}
            >
              <span className={labelDotClass} aria-hidden="true" />
              {item.label}
            </button>
          ))}

          {roots?.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => {
                rootLabelRefs.current[i] = el;
              }}
              type="button"
              onClick={() => onNodeClick?.(item.href, item.id)}
              className={labelBaseClass}
              {...hoverHandlers(branchCount + 1 + i)}
            >
              <span className={labelDotClass} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
