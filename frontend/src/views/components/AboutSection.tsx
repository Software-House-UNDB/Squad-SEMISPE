import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import videoLogo from '../../assets/brand/logo-com-movimento.mp4';
import { type AboutSectionData } from '../../models/about.model';
import { SectionPill } from './ui/SectionPill';

export interface AboutSectionProps {
  data: AboutSectionData;
  /** Rótulo da seção, exibido na pílula de abertura */
  sectionLabel?: string;
}

/**
 * Hook que detecta quando o elemento entra no viewport e dispara uma animação de countReveal.
 * Usado pelos cards de métricas para "ganhar vida" ao aparecer na tela.
 */
function useInViewAnimation(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasEntered) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasEntered, threshold]);

  return { ref, hasEntered };
}

/**
 * Card individual de métrica com animação de entrada ao entrar no viewport.
 * O delay é calculado pelo índice para criar efeito de stagger.
 */
function MetricCard({
  value,
  label,
  description,
  index,
  gridPlacement,
}: {
  value: string;
  label: string;
  description?: string;
  index: number;
  gridPlacement: string;
}) {
  const { ref, hasEntered } = useInViewAnimation(0.15);

  // Delay escalonado para cada card: 0ms, 80ms, 160ms...
  const delay = `${index * 80}ms`;

  return (
    <div
      ref={ref}
      className={`bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-white/20 shadow-lg shadow-black/10 hover:bg-white/15 hover:shadow-xl hover:shadow-black/25 hover:border-semispe-yellow/60 hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between group cursor-default relative overflow-hidden ${gridPlacement} ${
        index === 4 ? 'sm:col-span-2 lg:col-span-2' : ''
      }`}
      style={{
        // Anima ao entrar no viewport; antes fica invisível e deslocado
        animation: hasEntered ? `countReveal 0.55s ease-out ${delay} both` : undefined,
        opacity: hasEntered ? undefined : 0,
      }}
    >
      {/* Linha decorativa de acento no topo no estado de elevação */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-semispe-yellow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div>
        <div className="flex justify-center text-xl sm:text-2xl font-black text-semispe-yellow tracking-tight">
          {value}
        </div>

        <h3 className="text-xs sm:text-sm font-bold text-white mt-0.5">
          {label}
        </h3>

        {description && (
          <p className="text-[11px] text-white/70 mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function AboutSection({ data, sectionLabel }: AboutSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hasUserToggled, setHasUserToggled] = useState<boolean>(false);

  // Ref para animar a coluna do vídeo ao entrar no viewport
  const videoColumnRef = useRef<HTMLDivElement>(null);
  const [videoColumnVisible, setVideoColumnVisible] = useState(false);

  // Ref para animar a coluna de resultados ao entrar no viewport
  const resultsColumnRef = useRef<HTMLDivElement>(null);
  const [resultsColumnVisible, setResultsColumnVisible] = useState(false);

  // Ciclo de vida com IntersectionObserver para economia de GPU/bateria
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Respeito à preferência do sistema por redução de movimento (Acessibilidade WCAG)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          if (!hasUserToggled) {
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [hasUserToggled]);

  // Observer para animação de entrada da coluna do vídeo
  useEffect(() => {
    const el = videoColumnRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVideoColumnVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Observer para animação de entrada da coluna de resultados
  useEffect(() => {
    const el = resultsColumnRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setResultsColumnVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleTogglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    setHasUserToggled(true);
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section
      id="indicadores"
      className="relative scroll-mt-16 py-16 lg:py-24 bg-gradient-to-b from-[#008ecb] via-[#1f71b7] to-[#033165] text-semispe-light overflow-hidden"
      aria-label="Sobre o Parque Tecnológico de São Luís - Resultados"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Grid Principal: Vídeo Ampliado à Esquerda vs Grade de Resultados Mais Compacta à Direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Coluna 1: Vídeo da Identidade (5 colunas) */}
          <div
            ref={videoColumnRef}
            className="lg:col-span-5 xl:col-span-5 flex flex-col items-center justify-center"
            style={{
              animation: videoColumnVisible ? 'fadeInLeft 0.8s ease-out both' : undefined,
              opacity: videoColumnVisible ? undefined : 0,
            }}
          >
            <div className="relative w-full max-w-3x1 rounded-2xl overflow-hidden shadow-xl shadow-black/25 border border-white/25 bg-white group hover:-translate-y-2.5 hover:shadow-2xl hover:shadow-black/40 hover:border-semispe-yellow/70 transition-all duration-300 ease-out cursor-default">
              
              <div className="relative w-full aspect-video">
                <video
                  ref={videoRef}
                  src={videoLogo}
                  muted
                  loop
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain select-none"
                  aria-label="Animação do logotipo oficial do Parque Tecnológico de São Luís"
                />

                {/* Botão de acessibilidade WCAG 2.2.2 flutuante e minimalista (revela no hover/focus) */}
                <button
                  type="button"
                  onClick={handleTogglePlayback}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-semispe-blue active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label={isPlaying ? 'Pausar animação da logo' : 'Reproduzir animação da logo'}
                  title={isPlaying ? 'Pausar animação' : 'Reproduzir animação'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Play className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Coluna 2: Resultados em Grade Intercalada 3 em Cima e 2 Embaixo (7 colunas) */}
          <div
            ref={resultsColumnRef}
            className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center"
            style={{
              animation: resultsColumnVisible ? 'fadeInRight 0.8s ease-out 0.15s both' : undefined,
              opacity: resultsColumnVisible ? undefined : 0,
            }}
          >
            
            {/* Título da Seção */}
            <div className="mb-4">
              {sectionLabel && <SectionPill label={sectionLabel} className="mb-3" />}
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {data.resultsTitle ?? 'Resultados'}
              </h2>
              {data.resultsSubtitle && (
                <p className="text-xs sm:text-sm text-white/80 mt-1 font-medium">
                  {data.resultsSubtitle}
                </p>
              )}
            </div>

            {/* Grade de 6 submódulos: 3 cards em cima (2 cols cada) e 2 cards embaixo intercalados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-3.5">
              {data.metrics.map((metric, index) => {
                // Matemática do alinhamento intercalado:
                // Índices 0, 1, 2: Linha 1 (cada um ocupa 2 colunas -> 2+2+2 = 6)
                // Índice 3: Linha 2, inicia na coluna 2 e ocupa 2 colunas (centralizado entre 0 e 1)
                // Índice 4: Linha 2, ocupa 2 colunas (centralizado entre 1 e 2)
                const gridPlacement =
                  index < 3
                    ? 'lg:col-span-2'
                    : index === 3
                    ? 'lg:col-start-2 lg:col-span-2'
                    : 'lg:col-span-2';

                return (
                  <MetricCard
                    key={metric.id}
                    value={metric.value}
                    label={metric.label}
                    description={metric.description}
                    index={index}
                    gridPlacement={gridPlacement}
                  />
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
