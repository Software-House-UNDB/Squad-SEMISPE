import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useEstruturaViewModel } from '../../viewmodels/useEstruturaViewModel';
import { Navbar } from '../components/Navbar';
import { EstruturaSidebar } from '../components/EstruturaSidebar';
import { EstruturaInfo } from '../components/EstruturaInfo';
import { SiteFooter } from '../components/SiteFooter';

/**
 * Estrutura: menu lateral com as opções (espaços, reserva...) e a tela da opção
 * escolhida ao lado, no layout da inscrição do INEP.
 */
export function EstruturaPage() {
  const vm = useEstruturaViewModel();
  const { pathname } = useLocation();

  // Cada tela abre do topo, vindo da home ou trocando de opção no menu
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const info = <EstruturaInfo openingHours={vm.openingHours} address={vm.address} instagram={vm.instagram} />;

  return (
    <div className="min-h-svh bg-semispe-surface text-semispe-blue-dark flex flex-col font-sans selection:bg-semispe-yellow selection:text-semispe-dark">
      <Navbar
        navItems={vm.navItems}
        activeSection={vm.activeSection}
        isMobileMenuOpen={vm.isMobileMenuOpen}
        onToggleMobileMenu={vm.toggleMobileMenu}
        onNavItemClick={vm.onNavigateToSection}
        isSolid
      />

      <div className="flex-1 lg:flex">
        <EstruturaSidebar menu={vm.menu} footer={info} />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 xl:px-14 py-8 lg:py-12">
          <Outlet context={vm} />
          {/* No celular o menu vira uma faixa no topo: funcionamento e endereço vão para o fim */}
          <div className="lg:hidden mt-12">{info}</div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
