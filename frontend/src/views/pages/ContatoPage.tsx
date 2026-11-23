import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useContatoViewModel } from '../../viewmodels/useContatoViewModel';
import { OPENING_HOURS, PARQUE_ADDRESS, SEMISPE_INSTAGRAM } from '../../viewmodels/useEstruturaViewModel';
import { Navbar } from '../components/Navbar';
import { SiteFooter } from '../components/SiteFooter';
import { ContactForm } from '../components/ContactForm';
import { EstruturaInfo } from '../components/EstruturaInfo';

export function ContatoPage() {
  const vm = useContatoViewModel();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-svh flex flex-col bg-semispe-surface font-sans text-semispe-blue-dark">
      <Navbar navItems={vm.navItems} activeSection={vm.activeSection} isMobileMenuOpen={vm.isMobileMenuOpen}
        onToggleMobileMenu={vm.toggleMobileMenu} onNavItemClick={vm.onNavigateToSection} isSolid />
      <main className="flex-1">
        <header className="border-b border-semispe-blue-dark/5 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-semispe-teal">Contato</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Fale <span className="text-semispe-blue">conosco</span></h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-semispe-blue-dark/75 sm:text-lg">
              Tem uma dúvida, sugestão ou quer conhecer melhor o Parque Tecnológico? Estamos aqui para ouvir você.
            </p>
          </div>
        </header>
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:items-start lg:px-8 lg:py-12">
          <div className="min-w-0 lg:col-span-8"><ContactForm vm={vm} /></div>
          <aside aria-label="Informações do Parque Tecnológico" className="space-y-5 lg:col-span-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-semispe-blue-dark/10">
              <h2 className="text-lg font-black">Encontre o Parque</h2>
              <p className="mt-2 text-sm leading-relaxed text-semispe-blue-dark/70">Inovação no coração histórico de São Luís.</p>
              <EstruturaInfo openingHours={OPENING_HOURS} address={PARQUE_ADDRESS} instagram={SEMISPE_INSTAGRAM} className="mt-5" />
            </div>
            <div className="rounded-3xl bg-semispe-blue-dark p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-semispe-yellow-light">Nossos espaços</p>
              <h2 className="mt-3 text-xl font-black">Um lugar para o seu próximo encontro.</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75">Conheça as salas e os ambientes do Parque para reuniões, eventos e atividades.</p>
              <Link to="/estrutura" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-semispe-yellow-light underline-offset-4 hover:underline">
                Conhecer os espaços <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
