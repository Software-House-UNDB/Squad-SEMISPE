import { useHomeViewModel } from '../../viewmodels/useHomeViewModel';
import { Navbar } from '../components/Navbar';
import { IntroSection } from '../components/IntroSection';
import { Hero } from '../components/Hero';
import { EventsGallery } from '../components/EventsGallery';
import { AboutSection } from '../components/AboutSection';
import { SiteFooter } from '../components/SiteFooter';

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
        <Hero onSaibaMaisClick={vm.onQuemSomosClick} section={vm.sections['quem-somos']} />

        {/* 3. Carrossel com as fotos dos eventos, na cor de identidade de Eventos */}
        <EventsGallery events={vm.eventHighlights} accent={vm.sections['eventos'].accent} />

        {/* 4. Seção Sobre o Parque / Ecossistema — scroll reveal + stagger nos cards */}
        <AboutSection data={vm.aboutData} section={vm.sections['indicadores']} />
      </main>

      {/* 5. Rodapé Institucional */}
      <SiteFooter />
    </div>
  );
}
