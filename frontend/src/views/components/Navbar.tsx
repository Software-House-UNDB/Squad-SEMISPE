
import { Menu, X } from 'lucide-react';
import logoParque from '../../assets/brand/logo-parque-tecnologico.png';
import type { NavItem } from '../../models/navigation.model';
import { BrandStripe } from './ui/BrandStripe';
import { AccountMenu } from './AccountMenu';

export interface NavbarProps {
  navItems: readonly NavItem[];
  activeSection: string;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onNavItemClick: (href: string, id: string) => void;
  onReservaClick?: () => void;
  /** Recolhe a barra para fora da tela (usado enquanto a introdução ocupa a viewport) */
  isHidden?: boolean;
  /** Fundo opaco, para páginas claras (o translúcido fica acinzentado sobre o claro) */
  isSolid?: boolean;
}

/** Cada link usa a cor de identidade da sua seção (variável CSS `--accent`) */
const accentStyle = (item: NavItem) => ({ '--accent': item.accent.onDark }) as React.CSSProperties;

export function Navbar({
  navItems,
  activeSection,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onNavItemClick,
  isHidden = false,
  isSolid = false,
}: NavbarProps) {
  return (
    <header
      inert={isHidden}
      className={`sticky top-0 z-50 w-full ${isSolid ? 'bg-[#021f42]' : 'bg-[#021f42]/85 backdrop-blur-md'} text-white shadow-lg shadow-black/10 transition-transform duration-300 ease-out motion-reduce:transition-none ${
        isHidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo Oficial do Parque Tecnológico */}
          <a
            href="/"
            onClick={(e) => {
              // Volta ao topo da home, na introdução, sem nenhuma seção ativa no menu
              e.preventDefault();
              onNavItemClick('/', '');
            }}
            className="flex items-center gap-3 group focus-visible:outline-semispe-yellow"
            aria-label="Página inicial do Parque Tecnológico de São Luís"
          >
            {/* Aplicação em fundo escuro (Manual de Identidade Visual): símbolo nas cores
                originais e tipografia em branco. O mesmo PNG é desenhado duas vezes,
                recortado em símbolo (esquerda) e texto (direita, clareado por filtro). */}
            <span className="relative block h-10 sm:h-12 aspect-[869/440] transition-transform duration-200 group-hover:scale-105">
              <img
                src={logoParque}
                alt="Logo do Parque Tecnológico de São Luís"
                className="absolute inset-0 w-full h-full object-contain [clip-path:inset(0_56%_0_0)]"
              />
              <img
                src={logoParque}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-contain brightness-0 invert [clip-path:inset(0_0_0_44%)]"
              />
            </span>
          </a>

          {/* Links Desktop */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-8" aria-label="Navegação principal">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavItemClick(item.href, item.id);
                  }}
                  style={accentStyle(item)}
                  className={`text-xs font-black tracking-wider uppercase transition-colors duration-200 py-1 border-b-2 ${
                    isActive
                      ? 'text-(--accent) border-(--accent)'
                      : 'text-white/75 hover:text-(--accent) border-transparent hover:border-(--accent)/50'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Botão Mobile Hambúrguer */}
          <div className="flex items-center gap-2">
            <AccountMenu />
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu de navegação'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menu Mobile Dropdown
        dar mais atenção nisso depois
      */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 px-4 pt-2 pb-5 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                onNavItemClick(item.href, item.id);
              }}
              style={accentStyle(item)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-black uppercase hover:bg-white/10 ${
                activeSection === item.id ? 'text-(--accent)' : 'text-white/85 hover:text-(--accent)'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" aria-hidden="true" />
              {item.label}
            </a>
          ))}
        </div>
      )}

      {/* Faixa com as cores do logotipo no lugar da borda inferior */}
      <BrandStripe className="opacity-80" />
    </header>
  );
}
