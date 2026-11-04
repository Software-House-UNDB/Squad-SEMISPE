import { NavLink } from 'react-router-dom';
import { CalendarDays, CircleHelp, LayoutGrid, ListChecks, MessagesSquare, type LucideIcon } from 'lucide-react';
import { type EstruturaMenuItem } from '../../models/estrutura.model';
import { BRAND_ACCENTS, BRAND_STRIPE_COLORS } from '../../models/brand.model';

export interface EstruturaSidebarProps {
  menu: readonly EstruturaMenuItem[];
  /** Conteúdo fixo no pé do menu (só no desktop) */
  footer?: React.ReactNode;
}

const MENU_ICONS: Record<EstruturaMenuItem['id'], LucideIcon> = {
  espacos: LayoutGrid,
  agenda: CalendarDays,
  reserva: MessagesSquare,
  'como-funciona': ListChecks,
  duvidas: CircleHelp,
};

/** Cada opção leva uma cor do logotipo no quadradinho do ícone (o amarelo, claro, com ícone escuro) */
const MENU_COLORS: Record<EstruturaMenuItem['id'], { tile: string; icon: string }> = {
  espacos: { tile: BRAND_ACCENTS.azul.onLight, icon: '#ffffff' },
  agenda: { tile: BRAND_ACCENTS.verde.onLight, icon: '#ffffff' },
  reserva: { tile: BRAND_ACCENTS.amareloClaro.color, icon: '#033165' },
  'como-funciona': { tile: BRAND_ACCENTS.verdePetroleo.onLight, icon: '#ffffff' },
  duvidas: { tile: BRAND_ACCENTS.verdeOliva.onLight, icon: '#ffffff' },
};

/** Traço com as cores do logotipo, terminando no amarelo claro da Estrutura */
const BRAND_BAR = `linear-gradient(90deg, ${[...BRAND_STRIPE_COLORS.slice(0, -1), BRAND_ACCENTS.amareloClaro.color].join(', ')})`;

/**
 * Menu da Estrutura em fundo branco, com as cores do logotipo nos ícones e o
 * amarelo claro de identidade da seção na opção ativa. No desktop é uma coluna
 * fixa à esquerda (como na inscrição do INEP); no celular vira uma faixa com as
 * opções roláveis na horizontal.
 */
export function EstruturaSidebar({ menu, footer }: EstruturaSidebarProps) {
  // A coluna acompanha a altura da página; o conteúdo dela fica fixo na tela
  return (
    <div className="shrink-0 bg-white text-semispe-blue-dark border-b border-semispe-blue-dark/10 lg:w-72 xl:w-80 lg:border-b-0 lg:border-r">
      <aside className="flex flex-col lg:sticky lg:top-[66px] lg:h-[calc(100svh-66px)] lg:overflow-y-auto">
        <div className="px-4 sm:px-6 pt-6 pb-4 lg:px-7 lg:pt-10 lg:pb-6">
          <span className="block w-16 h-[5px] rounded-full" style={{ background: BRAND_BAR }} aria-hidden="true" />
          <p className="mt-3 text-[11px] font-black tracking-[0.25em] uppercase text-semispe-blue-dark/70">Estrutura</p>
          <p className="mt-1 text-2xl lg:text-[1.7rem] font-black tracking-tight leading-tight">
            Espaços do Parque
          </p>
        </div>

        <nav
          aria-label="Opções da Estrutura"
          className="flex gap-2 overflow-x-auto px-4 sm:px-6 pb-4 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-4 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {menu.map((item) => {
            const Icon = MENU_ICONS[item.id];
            const colors = MENU_COLORS[item.id];
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 shrink-0 whitespace-nowrap rounded-full lg:rounded-xl pl-1.5 pr-4 py-1.5 lg:pl-3 lg:py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-semispe-yellow-soft font-black'
                      : 'bg-semispe-surface lg:bg-transparent font-bold hover:bg-semispe-blue-dark/[0.05]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="grid place-items-center w-7 h-7 lg:w-[30px] lg:h-[30px] shrink-0 rounded-full lg:rounded-[9px]"
                      style={{ background: colors.tile, color: colors.icon }}
                      aria-hidden="true"
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    {item.label}
                    {!item.isReady && (
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                          isActive ? 'bg-semispe-blue-dark/10' : 'bg-semispe-blue-dark/[0.06] text-semispe-blue-dark/60'
                        }`}
                      >
                        Em breve
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {footer && <div className="hidden lg:block mt-auto px-4 pt-8 pb-6">{footer}</div>}
      </aside>
    </div>
  );
}
