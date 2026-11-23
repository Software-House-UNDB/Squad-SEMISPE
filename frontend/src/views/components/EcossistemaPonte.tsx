import { useId } from 'react';
import { Briefcase, GraduationCap, Landmark, Leaf, Lightbulb, MapPinned, Users, type LucideIcon } from 'lucide-react';
import { BRAND_ACCENTS } from '../../models/brand.model';
import { type BridgePillar, type EcosystemBridge } from '../../models/quemSomos.model';
import { useInViewOnce } from './ui/useInViewOnce';

export interface EcossistemaPonteProps {
  bridge: EcosystemBridge;
}

const PILLAR_ICONS: Record<BridgePillar['id'], LucideIcon> = {
  'poder-publico': Landmark,
  ensino: GraduationCap,
  empresas: Briefcase,
  pessoas: Users,
  'meio-ambiente': Leaf,
};

/* ─── Geometria da ilustração (viewBox 1000 × 240) ─────────────────────────── */

const WATER_Y = 204;
const TOWER_HEIGHT = 92;
/** Torres no centro de cada coluna da grade de 5 cards, para ficarem alinhadas com eles */
const TOWER_X = [100, 300, 500, 700, 900];
/** Distância dos cabos até a torre, do mais curto ao mais longo */
const CABLE_SPREAD = [20, 38, 56, 74];

/** Altura do tabuleiro em x: curva suave, mais alta no meio (Q 0,132 → 500,100 → 1000,132) */
const deckY = (x: number) => 132 - 64 * (x / 1000) * (1 - x / 1000);
const DECK = 'M0 132 Q500 100 1000 132';

/** Atraso de animação de cada peça (em segundos) */
const delay = (seconds: number, duration?: number) =>
  ({ '--delay': `${seconds}s`, ...(duration ? { '--duration': `${duration}s` } : {}) }) as React.CSSProperties;

/**
 * Ponte estaiada sobre o azul-marinho: o tabuleiro claro se desenha de um lado ao outro,
 * as cinco torres sobem da água (uma por pilar, na cor do logo clareada para o fundo
 * escuro) e os cabos se abrem em leque. Puramente decorativa: os pilares estão nos cards.
 */
function BridgeIllustration({ pillars, isVisible }: { pillars: readonly BridgePillar[]; isVisible: boolean }) {
  const uid = useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 1000 240"
      className={`ponte block w-full h-auto text-[#e8eef5] ${isVisible ? 'is-visible' : ''}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={BRAND_ACCENTS.azul.onDark} stopOpacity="0.22" />
          <stop offset="1" stopColor={BRAND_ACCENTS.azul.onDark} stopOpacity="0" />
        </linearGradient>
        {/* Margens claras e translúcidas, que se dissolvem na água */}
        <linearGradient id={`${uid}-bank`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {pillars.map((pillar) => (
          <linearGradient key={pillar.id} id={`${uid}-tower-${pillar.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={pillar.accent.onDark} />
            <stop offset="0.82" stopColor={pillar.accent.onDark} />
            <stop offset="1" stopColor={pillar.accent.onDark} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {/* Água e reflexos */}
      <rect x="0" y={WATER_Y} width="1000" height={240 - WATER_Y} fill={`url(#${uid}-water)`} />
      <line
        x1="0"
        y1={WATER_Y}
        x2="1000"
        y2={WATER_Y}
        stroke={BRAND_ACCENTS.azul.onDark}
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <g fill="none" stroke={BRAND_ACCENTS.azul.onDark} strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round">
        {TOWER_X.map((x, i) => (
          <g key={x} data-fade style={delay(0.9 + i * 0.08)}>
            <path d={`M${x - 34} ${WATER_Y + 10} q6 -3 12 0 t12 0`} />
            <path d={`M${x + 16} ${WATER_Y + 20} q6 -3 12 0 t12 0`} />
          </g>
        ))}
      </g>

      {/* Cabos em leque, presos no alto de cada torre */}
      {pillars.map((pillar, i) => {
        const x = TOWER_X[i];
        const top = deckY(x) - TOWER_HEIGHT;
        return (
          <g key={pillar.id} stroke={pillar.accent.onDark} strokeWidth="1.6" strokeOpacity="0.85" fill="none">
            {CABLE_SPREAD.flatMap((spread, k) => {
              const anchorY = top + 27 - k * 7;
              return [-1, 1].map((side) => {
                const endX = x + side * spread;
                return (
                  <line
                    key={`${spread}-${side}`}
                    x1={x}
                    y1={anchorY}
                    x2={endX}
                    y2={deckY(endX) - 3}
                    pathLength={1}
                    data-draw
                    style={delay(0.85 + i * 0.12 + k * 0.05, 0.5)}
                  />
                );
              });
            })}
          </g>
        );
      })}

      {/* Torres: afinam para cima e se dissolvem na água */}
      {pillars.map((pillar, i) => {
        const x = TOWER_X[i];
        const top = deckY(x) - TOWER_HEIGHT;
        return (
          <polygon
            key={pillar.id}
            points={`${x - 3},${top} ${x + 3},${top} ${x + 6.5},${WATER_Y + 18} ${x - 6.5},${WATER_Y + 18}`}
            fill={`url(#${uid}-tower-${pillar.id})`}
            data-rise
            style={delay(0.3 + i * 0.12)}
          />
        );
      })}

      {/* Margens nas duas pontas */}
      <g fill={`url(#${uid}-bank)`} data-fade style={delay(0)}>
        <path d="M0 134 H30 C44 134 50 146 56 166 C62 188 70 204 84 224 L84 240 H0 Z" />
        <path d="M1000 134 H970 C956 134 950 146 944 166 C938 188 930 204 916 224 L916 240 H1000 Z" />
      </g>

      {/* Tabuleiro claro: guarda-corpo, pista e viga, desenhados de um lado ao outro */}
      <path d="M0 122 Q500 90 1000 122" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.5" pathLength={1} data-draw style={delay(0.15, 1.1)} />
      <path d={DECK} fill="none" stroke="currentColor" strokeWidth="9" pathLength={1} data-draw style={delay(0, 1.1)} />
      <path d="M0 140 Q500 108 1000 140" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" pathLength={1} data-draw style={delay(0.1, 1.1)} />
      <path d={DECK} fill="none" stroke={BRAND_ACCENTS.amarelo.color} strokeWidth="1.5" strokeDasharray="10 12" data-fade style={delay(1.1)} />

      {/* Luz no alto de cada torre */}
      {pillars.map((pillar, i) => (
        <circle
          key={pillar.id}
          cx={TOWER_X[i]}
          cy={deckY(TOWER_X[i]) - TOWER_HEIGHT - 5}
          r="4.5"
          fill={pillar.accent.onDark}
          data-fade
          style={delay(1 + i * 0.12)}
        />
      ))}
    </svg>
  );
}

/** Margem da ponte: um dos dois lados que o ecossistema liga */
function Bank({ icon: Icon, side, label, align }: { icon: LucideIcon; side: string; label: string; align: 'start' | 'end' }) {
  return (
    <p className={`flex items-center gap-2.5 ${align === 'end' ? 'flex-row-reverse text-right' : ''}`}>
      <span className="hidden sm:grid place-items-center w-9 h-9 shrink-0 rounded-full bg-semispe-yellow text-semispe-navy">
        <Icon className="w-4 h-4" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-[10px] font-bold tracking-[0.18em] uppercase text-white/60">{side}</span>
        <span className="block text-[13px] sm:text-sm font-black">{label}</span>
      </span>
    </p>
  );
}

/** Card de vidro de um pilar: número e cor ligam o card à torre correspondente na ilustração */
function PillarCard({ pillar, index }: { pillar: BridgePillar; index: number }) {
  const { ref, hasEntered } = useInViewOnce<HTMLLIElement>(0.15);
  const Icon = PILLAR_ICONS[pillar.id];

  return (
    <li
      ref={ref}
      className="relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 ease-out hover:-translate-y-1 hover:border-white/25 hover:bg-white/10"
      style={
        {
          '--accent': pillar.accent.onDark,
          animation: hasEntered ? `countReveal 0.55s ease-out ${index * 90}ms both` : undefined,
          opacity: hasEntered ? undefined : 0,
        } as React.CSSProperties
      }
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-black tracking-[0.2em] text-(--accent)">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-(--accent)" aria-hidden="true">
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <h4 className="mt-3 text-base font-black leading-snug">{pillar.label}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-semispe-gelo/90">{pillar.description}</p>
    </li>
  );
}

/**
 * O ecossistema de inovação como uma ponte estaiada que liga "ideias e conhecimento"
 * a "soluções para a cidade", sustentada pelos cinco pilares (as cinco hélices).
 * Painel de vidro, feito para a seção azul-marinho de "Como o Parque atua".
 */
export function EcossistemaPonte({ bridge }: EcossistemaPonteProps) {
  const { ref, hasEntered } = useInViewOnce<HTMLDivElement>(0.3);

  return (
    <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-8 lg:p-10">
      <div className="max-w-3xl">
        <h3 className="text-xl sm:text-2xl font-black tracking-tight">{bridge.title}</h3>
        <p className="mt-2 text-sm sm:text-base leading-relaxed text-semispe-gelo">{bridge.text}</p>
        <p className="mt-1 text-xs font-bold text-white/60">{bridge.note}</p>
      </div>

      <div ref={ref} className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <Bank icon={Lightbulb} side="De um lado" label={bridge.from} align="start" />
          <Bank icon={MapPinned} side="Do outro" label={bridge.to} align="end" />
        </div>
        <div className="-mx-2 sm:mx-0 mt-2">
          <BridgeIllustration pillars={bridge.pillars} isVisible={hasEntered} />
        </div>
      </div>

      <ol aria-label="Os cinco pilares do ecossistema" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {bridge.pillars.map((pillar, index) => (
          <PillarCard key={pillar.id} pillar={pillar} index={index} />
        ))}
      </ol>
    </div>
  );
}
