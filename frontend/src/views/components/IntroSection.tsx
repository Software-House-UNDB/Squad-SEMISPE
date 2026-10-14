import { useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import { TreeParticleCanvas } from './TreeParticleCanvas';
import { type NavItem } from '../../models/navigation.model';

// Registro oficial do plugin ScrollTrigger no ecossistema GSAP
gsap.registerPlugin(ScrollTrigger);

export interface IntroSectionProps {
  /** Callback opcional acionado ao clicar para avançar até a Hero */
  onExploreClick?: () => void;
  /** Identificador do elemento de destino para o scroll suave (padrão: 'quem-somos') */
  targetSectionId?: string;
  /** Seções exibidas como galhos da árvore */
  branches?: readonly NavItem[];
  /** Seções exibidas como raízes da árvore */
  roots?: readonly NavItem[];
  /** Acionado ao clicar em um galho ou na raiz */
  onNodeClick?: (href: string, sectionId: string) => void;
}

export function IntroSection({
  onExploreClick,
  targetSectionId = 'quem-somos',
  branches,
  roots,
  onNodeClick,
}: IntroSectionProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const particleProgressRef = useRef<number>(1.0); // Árvore totalmente crescida
  const textIndicatorRef = useRef<HTMLDivElement | null>(null);
  const brandTitleRef = useRef<HTMLDivElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // 1. Lenis Smooth Scroll Engine: Rolagem macia e aveludada contínua no desktop e mobile
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.3,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Manipulador de clique para rolagem suave sedosa até a Hero
  const handleScrollToHero = () => {
    if (onExploreClick) {
      onExploreClick();
      return;
    }

    if (lenisRef.current) {
      lenisRef.current.scrollTo(`#${targetSectionId}`, {
        duration: 1.4,
        offset: -64, // altura da navbar fixa
      });
    } else {
      const target = document.getElementById(targetSectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      if (!containerRef.current) return;

      if (prefersReducedMotion) {
        particleProgressRef.current = 1.0;
        if (brandTitleRef.current) gsap.set(brandTitleRef.current, { opacity: 1, y: 0 });
        return;
      }

      const mm = gsap.matchMedia();

      // ── DESKTOP (>= 1024px com ponteiro fino): Entrada Autônoma do Enxame + Pinning Suave no Scroll ──
      mm.add('(min-width: 1024px) and (pointer: fine)', () => {
        const stateObj = { p: 0.0 };

        // 1. Crescimento inicial da árvore no carregamento (dispersão 3D -> raiz, tronco, copa)
        gsap.to(stateObj, {
          p: 1.0,
          duration: 2.6,
          ease: 'power2.out',
          onUpdate: () => {
            particleProgressRef.current = stateObj.p;
          },
        });

        if (brandTitleRef.current) {
          gsap.fromTo(
            brandTitleRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1.0, delay: 0.8, ease: 'power2.out' }
          );
        }

        // 2. ScrollTrigger com Pinning suave para acompanhar a jornada
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: '+=120%',
            pin: true,
            scrub: 1.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            fastScrollEnd: true,
          },
        });

        // Conforme rola, o indicador de scroll desvanece suavemente
        if (textIndicatorRef.current) {
          scrollTl.to(textIndicatorRef.current, {
            opacity: 0,
            y: 20,
            ease: 'power1.in',
            duration: 0.6,
          }, 0);
        }
      });

      // ── MOBILE & TOUCH: Sem Pinning, Aglutinação Fluida Direta ──
      mm.add('(max-width: 1023px), (pointer: coarse)', () => {
        const stateObj = { p: 0.0 };
        gsap.to(stateObj, {
          p: 1.0,
          duration: 2.2,
          ease: 'power2.out',
          onUpdate: () => {
            particleProgressRef.current = stateObj.p;
          },
        });

        if (brandTitleRef.current) {
          gsap.fromTo(
            brandTitleRef.current,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.6, ease: 'power2.out' }
          );
        }
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="intro"
      className="h-screen w-full relative overflow-hidden bg-gradient-to-b from-[#021f42] via-[#022854] to-[#033165] text-white flex flex-col items-center justify-between z-20 select-none"
      aria-label="Introdução Interativa do Parque Tecnológico de São Luís em Partículas 3D"
    >
      {/* Halo radial luminescente de profundidade sob o enxame de partículas */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-35"
        aria-hidden="true"
      >
        <div className="w-[620px] h-[620px] rounded-full bg-radial from-white/20 via-[#1f71b7]/15 to-transparent blur-3xl transform scale-110" />
      </div>

      <div className="w-full h-8 sm:h-12 pointer-events-none" aria-hidden="true" />

      {/* Container Central com o Canvas de Partículas 3D em WebGL */}
      <div className="relative flex flex-col items-center justify-center z-10 px-4 w-full max-w-4xl mx-auto my-auto">
        <div className="relative w-full h-[clamp(400px,62vh,640px)] flex items-center justify-center">
          <TreeParticleCanvas
            progressRef={particleProgressRef}
            repulsionStrength={1.2}
            branches={branches}
            roots={roots}
            onNodeClick={onNodeClick}
            className="w-full h-full"
          />
        </div>

        {/* Tipografia da Marca revelada de forma sincronizada */}
        <div
          ref={brandTitleRef}
          className="mt-3 text-center space-y-1.5 transition-opacity"
        >
          <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-white/75">
            Parque Tecnológico de
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-md">
            São Luís
          </h2>
          <p className="text-[10px] sm:text-xs text-semispe-yellow font-bold tracking-widest uppercase pt-1">
            SEMISPE • Inovação & Tecnologia
          </p>
        </div>
      </div>

      {/* Indicador Acessível "Role para baixo para explorar" */}
      <div
        ref={textIndicatorRef}
        className="w-full pb-8 sm:pb-12 flex flex-col items-center justify-center z-10"
      >
        <button
          type="button"
          onClick={handleScrollToHero}
          className="group flex flex-col items-center gap-2 text-white/80 hover:text-white transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-[#021f42] rounded-xl px-4 py-2 cursor-pointer"
          aria-label="Role para baixo para explorar o Parque Tecnológico de São Luís"
        >
          <span className="text-xs sm:text-sm font-medium tracking-wider uppercase opacity-90 group-hover:opacity-100 transition-opacity">
            Role para baixo para explorar
          </span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-semispe-yellow/50 transition-all shadow-sm">
            <ChevronDown
              className="w-4 h-4 text-semispe-yellow transition-transform duration-300 group-hover:translate-y-0.5 animate-bounce"
              aria-hidden="true"
            />
          </div>
        </button>
      </div>
    </section>
  );
}
