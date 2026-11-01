import { useEffect, useRef } from 'react';
import { BRAND_ACCENTS } from '../../models/brand.model';

export interface StardustCanvasProps {
  /** Cores das partículas, sorteadas por igual (repetir uma cor aumenta a frequência dela) */
  colors?: readonly string[];
  /** Fração da poeira visível (0 = nenhuma, 1 = toda), lida a cada frame sem disparar re-render */
  amountRef?: React.RefObject<number>;
  className?: string;
}

// Branco e azul-claro dominam para manter o clima de céu noturno; os verdes e o
// amarelo do logotipo aparecem salpicados
const DEFAULT_COLORS: readonly string[] = [
  '#ffffff',
  '#ffffff',
  BRAND_ACCENTS.azul.onDark,
  BRAND_ACCENTS.azul.onDark,
  BRAND_ACCENTS.azul.onDark,
  BRAND_ACCENTS.verde.onDark,
  BRAND_ACCENTS.verdeClaro.onDark,
  BRAND_ACCENTS.verdeOliva.onDark,
  BRAND_ACCENTS.verdePetroleo.onDark,
  BRAND_ACCENTS.amarelo.onDark,
];

/** Área de tela (px²) por partícula */
const AREA_PER_MOTE = 1700;
const MAX_MOTES = 850;
const SPRITE_SIZE = 64;
/** Deslocamento máximo (px) do parallax do mouse nas partículas mais próximas */
const PARALLAX = 28;
/** Faixa de `amount` em que cada partícula aparece/some, para o volume variar sem estalos */
const FADE_BAND = 0.15;

interface Mote {
  x: number;
  y: number;
  /** 0 = ao fundo (pequena, lenta, apagada), 1 = à frente */
  depth: number;
  vx: number;
  vy: number;
  phase: number;
  twinkleSpeed: number;
  sprite: number;
  /** Ponto de `amount` abaixo do qual a partícula some: cada uma sai numa hora diferente */
  threshold: number;
}

/**
 * Poeira espacial em segundo plano: partículas nas cores da marca flutuando
 * devagar, com profundidade e parallax suave seguindo o mouse.
 */
export function StardustCanvas({
  colors = DEFAULT_COLORS,
  amountRef,
  className = '',
}: StardustCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Em string para o efeito só reiniciar quando as cores realmente mudarem
  const colorKey = colors.join(',');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    // Um brilho pré-renderizado por cor: copiar uma imagem é bem mais barato
    // que montar um gradiente radial por partícula a cada frame
    const sprites = colorKey.split(',').map((color) => {
      const sprite = document.createElement('canvas');
      sprite.width = SPRITE_SIZE;
      sprite.height = SPRITE_SIZE;
      const sctx = sprite.getContext('2d');
      if (sctx) {
        const r = SPRITE_SIZE / 2;
        const gradient = sctx.createRadialGradient(r, r, 0, r, r, r);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.08, color);
        gradient.addColorStop(0.3, `${color}55`);
        gradient.addColorStop(1, `${color}00`);
        sctx.fillStyle = gradient;
        sctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
      }
      return sprite;
    });

    const motes: Mote[] = [];
    let width = 0;
    let height = 0;

    const spawn = (): Mote => {
      // Mais partículas ao fundo do que à frente
      const depth = 0.12 + Math.pow(Math.random(), 2.2) * 0.88;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        depth,
        vx: (Math.random() - 0.5) * 7 * depth,
        vy: -(1.5 + Math.random() * 5) * depth,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.4 + Math.random() * 1.4,
        sprite: Math.floor(Math.random() * sprites.length),
        threshold: Math.random(),
      };
    };

    // Parallax: as partículas da frente se deslocam mais que as do fundo
    const pointer = { x: 0, y: 0 };
    const offset = { x: 0, y: 0 };

    const handlePointerMove = (e: MouseEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const draw = (time: number) => {
      // Limpa o buffer inteiro em pixels reais: com escala fracionária (125%, 150%)
      // a área em CSS px não cobre a última linha do buffer, e com 'lighter' cada
      // partícula que cruzava a borda deixava ali um risco branco permanente
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';

      // Com amount = 1 todas aparecem e com 0 nenhuma; no meio, só as de limiar mais baixo
      const amount = (amountRef?.current ?? 1) * (1 + FADE_BAND);

      for (const m of motes) {
        const visibility = Math.min(1, (amount - m.threshold) / FADE_BAND);
        if (visibility <= 0) continue;

        const twinkle = 0.55 + 0.45 * Math.sin(time * m.twinkleSpeed + m.phase);
        const size = (4 + m.depth * 15) * (0.85 + 0.15 * twinkle);
        const x = m.x - offset.x * PARALLAX * m.depth;
        const y = m.y - offset.y * PARALLAX * m.depth;

        ctx.globalAlpha = Math.min(1, (0.28 + m.depth * 0.8) * twinkle) * visibility;
        ctx.drawImage(sprites[m.sprite], x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const prevWidth = width || rect.width;
      const prevHeight = height || rect.height;
      width = rect.width;
      height = rect.height;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Mantém a distribuição ao redimensionar e ajusta a quantidade à nova área
      for (const m of motes) {
        m.x *= width / prevWidth;
        m.y *= height / prevHeight;
      }
      const max = isTouchDevice ? MAX_MOTES / 3 : MAX_MOTES;
      const target = Math.min(Math.round((width * height) / AREA_PER_MOTE), max);
      while (motes.length < target) motes.push(spawn());
      motes.length = target;

      if (prefersReducedMotion) draw(0);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    handleResize();

    if (prefersReducedMotion) {
      return () => resizeObserver.disconnect();
    }

    let animationFrameId = 0;
    let isVisible = true;
    let lastTime = performance.now();
    let clock = 0;

    const animate = () => {
      if (!isVisible) return;
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      clock += dt;

      offset.x += (pointer.x - offset.x) * 0.04;
      offset.y += (pointer.y - offset.y) * 0.04;

      // Deriva lenta, reaparecendo do lado oposto ao sair da tela
      const margin = 20;
      for (const m of motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.y < -margin) m.y = height + margin;
        else if (m.y > height + margin) m.y = -margin;
        if (m.x < -margin) m.x = width + margin;
        else if (m.x > width + margin) m.x = -margin;
      }

      draw(clock);
    };

    // Pausa quando a seção sai da tela
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      const wasVisible = isVisible;
      isVisible = entry.isIntersecting;
      if (isVisible && !wasVisible) {
        cancelAnimationFrame(animationFrameId);
        lastTime = performance.now();
        animate();
      }
    });
    visibilityObserver.observe(canvas);

    if (!isTouchDevice) window.addEventListener('mousemove', handlePointerMove);
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handlePointerMove);
    };
  }, [colorKey, amountRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    />
  );
}
