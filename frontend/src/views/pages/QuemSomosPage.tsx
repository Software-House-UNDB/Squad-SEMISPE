import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuemSomosViewModel } from '../../viewmodels/useQuemSomosViewModel';
import { Navbar } from '../components/Navbar';
import { QuemSomosHero } from '../components/QuemSomosHero';
import { MissaoVisaoValores } from '../components/MissaoVisaoValores';
import { AtuacaoMetas } from '../components/AtuacaoMetas';
import { EstruturaCallout } from '../components/EstruturaCallout';
import { SiteFooter } from '../components/SiteFooter';

/**
 * Quem Somos: página institucional do Parque, de fundo claro, com as cores do
 * logotipo nos itens. Termina com a chamada para conhecer a Estrutura.
 */
export function QuemSomosPage() {
  const vm = useQuemSomosViewModel();
  const { pathname } = useLocation();

  // Abre do topo, ou direto na seção do link (ex.: /quem-somos#atuacao)
  useEffect(() => {
    const sectionId = window.location.hash.slice(1);
    if (sectionId) document.getElementById(sectionId)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname]);

  const { content } = vm;

  return (
    <div className="min-h-svh bg-white text-semispe-blue-dark flex flex-col font-sans selection:bg-semispe-yellow selection:text-semispe-dark">
      <Navbar
        navItems={vm.navItems}
        activeSection={vm.activeSection}
        isMobileMenuOpen={vm.isMobileMenuOpen}
        onToggleMobileMenu={vm.toggleMobileMenu}
        onNavItemClick={vm.onNavigateToSection}
        isSolid
      />

      <main className="flex-1">
        <QuemSomosHero intro={content.intro} section={vm.section} />
        <MissaoVisaoValores statements={content.statements} values={content.values} />
        <AtuacaoMetas
          bridge={content.bridge}
          programs={content.programs}
          goals={content.goals}
          agreements={content.agreements}
        />
        <EstruturaCallout
          content={content.estrutura}
          section={vm.estruturaSection}
          espacosHref={vm.espacosHref}
          reservaHref={vm.reservaHref}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
