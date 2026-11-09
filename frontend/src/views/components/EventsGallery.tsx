import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Camera, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { type EventHighlight } from '../../models/event.model';
import { BRAND_ACCENTS, type SectionAccent } from '../../models/brand.model';
import { SectionPill } from './ui/SectionPill';

export interface EventsGalleryProps {
  events: readonly EventHighlight[];
  /** Cor de identidade da galeria (pílula e controles) */
  accent?: SectionAccent;
  title?: string;
  subtitle?: string;
}

/** Tempo (ms) de cada slide na passagem automática */
const AUTOPLAY_INTERVAL = 6000;

// Seção de fundo claro: o anel de foco amarelo some sobre ele, então usa o azul-escuro
const controlButtonClass =
  'w-10 h-10 rounded-full flex items-center justify-center border border-semispe-blue-dark/20 bg-white text-semispe-blue-dark shadow-sm transition-all duration-200 cursor-pointer hover:border-(--accent) hover:text-(--accent) active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark';

/** Arte provisória do slide enquanto o evento não tem foto */
function PlaceholderArt({ accent }: { accent: SectionAccent }) {
  return (
    <div
      className="absolute inset-0"
      style={{ background: `radial-gradient(circle at 18% 12%, ${accent.color} 0%, #033165 72%)` }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pb-20 text-white/75">
        <Camera className="w-8 h-8" aria-hidden="true" />
        <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
          Foto do evento em breve
        </span>
      </div>
    </div>
  );
}

/**
 * Carrossel de fotos dos eventos do Parque. Usa scroll-snap nativo (arrastar
 * no touch e no trackpad funciona sem biblioteca) com setas, indicadores e
 * passagem automática que pausa no hover, no foco e fora da tela.
 */
export function EventsGallery({
  events,
  accent = BRAND_ACCENTS.verdeOliva,
  title = 'O Parque em movimento',
  subtitle = 'Hackathons, meetups, workshops e palestras que conectam o ecossistema de inovação no Trapiche Santo Ângelo.',
}: EventsGalleryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // Passagem automática ligada por padrão, exceto para quem prefere reduzir movimento
  const [isPlaying, setIsPlaying] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isOnScreen, setIsOnScreen] = useState(false);

  const isRunning = isPlaying && !isHovered && !isFocused && isOnScreen && events.length > 1;

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track || track.children.length === 0) return;

    const count = track.children.length;
    const target = track.children[((index % count) + count) % count] as HTMLElement;
    const first = track.children[0] as HTMLElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    track.scrollTo({
      left: target.offsetLeft - first.offsetLeft,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, []);

  // Slide ativo acompanha a rolagem da trilha (setas, indicadores, arraste ou trackpad)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const update = () => {
      const count = track.children.length;
      if (count === 0) return;
      const first = track.children[0] as HTMLElement;
      const second = track.children[1] as HTMLElement | undefined;
      const step = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;

      // No fim da trilha os últimos slides não alcançam o início: o último fica ativo
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      const index = atEnd ? count - 1 : Math.round(track.scrollLeft / step);
      setActiveIndex(Math.min(Math.max(index, 0), count - 1));
    };

    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // A passagem automática só corre com a galeria visível
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setIsOnScreen(entry.isIntersecting), {
      threshold: 0.35,
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Cada troca de slide (automática ou manual) reinicia a contagem
  useEffect(() => {
    if (!isRunning) return;
    const timeout = window.setTimeout(() => scrollToIndex(activeIndex + 1), AUTOPLAY_INTERVAL);
    return () => window.clearTimeout(timeout);
  }, [isRunning, activeIndex, scrollToIndex]);

  return (
    <section
      ref={sectionRef}
      id="galeria"
      aria-roledescription="carrossel"
      aria-label="Galeria de eventos do Parque Tecnológico"
      style={{ '--accent': accent.onLight } as React.CSSProperties}
      className="relative scroll-mt-16 py-16 lg:py-20 bg-semispe-surface text-semispe-blue-dark overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho com os controles à direita */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 lg:mb-10">
          <div className="max-w-2xl">
            <SectionPill label="O QUE ESTÁ ACONTECENDO NO PARQUE?" accent={accent} tone="light" className="mb-4" />
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              {title}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-semispe-blue-dark/80 leading-relaxed">{subtitle}</p>
          </div>

          {events.length > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPlaying((prev) => !prev)}
                className={controlButtonClass}
                aria-label={isPlaying ? 'Pausar a passagem automática' : 'Retomar a passagem automática'}
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => scrollToIndex(activeIndex - 1)}
                className={controlButtonClass}
                aria-label="Evento anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollToIndex(activeIndex + 1)}
                className={controlButtonClass}
                aria-label="Próximo evento"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Trilha: gestos horizontais ficam com o scroll nativo (o Lenis só cuida do vertical).
            O respiro embaixo deixa a sombra dos slides terminar antes do corte da rolagem */}
        <div
          ref={trackRef}
          data-lenis-prevent-horizontal
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setIsFocused(false);
          }}
          className="flex gap-4 lg:gap-6 overflow-x-auto snap-x snap-mandatory overscroll-x-contain px-1 pt-1 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {events.map((event, index) => (
            <article
              key={event.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${events.length}: ${event.title}`}
              style={{ '--accent': event.accent.onDark } as React.CSSProperties}
              className="group relative shrink-0 snap-start w-[85%] sm:w-[64%] lg:w-[42%] aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-[#033165] shadow-lg shadow-semispe-blue-dark/25"
            >
              {event.image ? (
                <img
                  src={event.image}
                  alt={event.imageAlt ?? event.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <PlaceholderArt accent={event.accent} />
              )}

              {/* Véu para a legenda ficar legível sobre qualquer foto */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#021f42]/95 via-[#021f42]/25 to-transparent" />

              {/* Linha de acento no topo, como nos cards de indicadores */}
              <div className="absolute top-0 inset-x-0 h-1 bg-(--accent) opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-(--accent)/50 bg-black/25 backdrop-blur-sm px-2.5 py-1 text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" aria-hidden="true" />
                    {event.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-white/80">
                    <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                    {event.date}
                  </span>
                </div>
                <h3 className="mt-2.5 text-lg sm:text-xl lg:text-2xl font-black leading-tight text-white">
                  {event.title}
                </h3>
              </div>
            </article>
          ))}
        </div>

        {/* Indicadores: o ativo mostra o tempo até a próxima troca */}
        {events.length > 1 && (
          <div className="mt-1 flex justify-center gap-2">
            {events.map((event, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => scrollToIndex(index)}
                  aria-label={`Ir para o evento ${index + 1}: ${event.title}`}
                  aria-current={isActive}
                  className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark ${
                    isActive ? 'w-10 bg-semispe-blue-dark/15' : 'w-2.5 bg-semispe-blue-dark/25 hover:bg-semispe-blue-dark/50'
                  }`}
                >
                  {isActive && (
                    <span
                      key={`${activeIndex}-${isRunning}`}
                      className="absolute inset-0 origin-left bg-(--accent)"
                      style={{
                        animation: isRunning ? `galleryProgress ${AUTOPLAY_INTERVAL}ms linear both` : undefined,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
