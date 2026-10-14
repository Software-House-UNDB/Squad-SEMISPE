import { useHomeViewModel } from '../../viewmodels/useHomeViewModel';
import { Navbar } from '../components/Navbar';
import { IntroSection } from '../components/IntroSection';
import { Hero } from '../components/Hero';
import { AboutSection } from '../components/AboutSection';

export function HomePage() {
  // Consome a camada de ViewModel (MVVM)
  const vm = useHomeViewModel();

  return (
    <div className="min-h-screen bg-semispe-blue text-semispe-light flex flex-col font-sans selection:bg-semispe-yellow selection:text-semispe-dark">
      
      {/* 1. Header (Navbar) - Recebe estado e handlers exclusivamente via ViewModel */}
      <Navbar
        navItems={vm.navItems}
        activeSection={vm.activeSection}
        isMobileMenuOpen={vm.isMobileMenuOpen}
        isHidden={vm.isNavbarHidden}
        onToggleMobileMenu={vm.toggleMobileMenu}
        onNavItemClick={vm.onNavigateToSection}
        onReservaClick={vm.onReservaClick}
      />

      <main className="flex-1">
        {/* Seção de Introdução / Splash Screen Interativa com GSAP e ScrollTrigger */}
        <IntroSection
          targetSectionId="quem-somos"
          branches={vm.treeBranches}
          roots={vm.treeRoots}
          onNodeClick={vm.onNavigateToSection}
        />

        {/* 2. Hero Section — animações de entrada com stagger */}
        <Hero onReservaClick={vm.onReservaClick} sectionLabel={vm.sectionLabels['quem-somos']} />

        {/* 3. Seção Sobre o Parque / Ecossistema — scroll reveal + stagger nos cards */}
        <AboutSection data={vm.aboutData} sectionLabel={vm.sectionLabels['indicadores']} />
      </main>

      {/* 4. Rodapé Institucional */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-semispe-light/60 bg-[#021f42]">
        <p>© 2026 Parque Tecnológico de São Luís — SEMISPE / Prefeitura de São Luís</p>
      </footer>
    </div>
  );
}
