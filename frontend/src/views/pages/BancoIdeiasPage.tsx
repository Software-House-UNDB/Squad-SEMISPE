import { useEffect } from 'react';
import { Lightbulb, Loader2, LogIn, UserPlus } from 'lucide-react';
import { useBancoIdeiasViewModel } from '../../viewmodels/useBancoIdeiasViewModel';
import { Navbar } from '../components/Navbar';
import { SiteFooter } from '../components/SiteFooter';
import { AuthModal } from '../components/AuthModal';
import { IdeaFormCard } from '../components/IdeaFormCard';
import { IdeaFlow } from '../components/IdeaFlow';
import { IdeaModal } from '../components/IdeaModal';
import { MyIdeasList } from '../components/MyIdeasList';
import { primaryButtonClass, secondaryButtonClass } from '../components/ui/formStyles';

/**
 * Banco de Ideias Digital (seção 3.8 do documento de requisitos): recebe propostas,
 * sugestões e desafios para a inovação municipal. Quem tem conta envia e acompanha
 * a ideia pelas etapas do fluxo. O login acontece aqui, como na reserva.
 */
export function BancoIdeiasPage() {
  const vm = useBancoIdeiasViewModel();
  const { auth } = vm;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-svh flex flex-col bg-semispe-surface text-semispe-blue-dark font-sans selection:bg-semispe-yellow selection:text-semispe-dark">
      <Navbar
        navItems={vm.navItems}
        activeSection={vm.activeSection}
        isMobileMenuOpen={vm.isMobileMenuOpen}
        onToggleMobileMenu={vm.toggleMobileMenu}
        onNavItemClick={vm.onNavigateToSection}
        isSolid
      />

      <main className="flex-1">
        {/* Abertura e como funciona */}
        <section aria-labelledby="banco-ideias-titulo" className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-16 lg:pb-14">
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-semispe-blue-dark/75">Banco de Ideias</p>
            <h1 id="banco-ideias-titulo" className="mt-2 max-w-3xl text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              Tem uma ideia para <span className="text-semispe-blue">São Luís</span>?
            </h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-semispe-blue-dark/80">
              Toda ponte começa de um lado. Envie propostas, sugestões e desafios para a inovação de São Luís: a equipe
              do Parque avalia cada ideia, e as aprovadas podem ser encaminhadas e implementadas.
            </p>

            <div className="mt-12">
              <IdeaFlow />
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          {auth.status === 'checking' ? (
            <p role="status" className="inline-flex items-center gap-2 text-sm font-bold text-semispe-blue-dark/70">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Carregando a sua conta…
            </p>
          ) : auth.status === 'anonymous' ? (
            <section
              aria-labelledby="acesso-ideias-titulo"
              className="mx-auto max-w-3xl rounded-2xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-semispe-blue-dark/10 sm:px-10"
            >
              <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-semispe-yellow-soft" aria-hidden="true">
                <Lightbulb className="w-7 h-7" />
              </span>
              <h2 id="acesso-ideias-titulo" className="mt-5 text-2xl font-black tracking-tight">
                {vm.sessionExpired ? 'Sua sessão expirou' : 'Entre na sua conta para enviar a sua ideia'}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-semispe-blue-dark/75">
                {vm.sessionExpired
                  ? 'Entre novamente para continuar. O que você já escreveu continua no formulário.'
                  : 'A ideia vai em nome da sua conta, e é por ela que você acompanha a avaliação em Minhas ideias.'}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => vm.openAuthModal('entrar')} className={primaryButtonClass}>
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  Entrar
                </button>
                <button type="button" onClick={() => vm.openAuthModal('cadastro')} className={secondaryButtonClass}>
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  Criar conta
                </button>
              </div>
            </section>
          ) : (
            <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-8">
                <IdeaFormCard vm={vm} account={auth.account} />
              </div>
              <div className="lg:col-span-4 lg:sticky lg:top-24">
                <MyIdeasList myIdeas={vm.myIdeas} onOpen={vm.openIdea} />
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />

      {vm.selectedIdea && <IdeaModal idea={vm.selectedIdea} onClose={vm.closeIdea} />}

      {auth.status === 'anonymous' && vm.authModal && (
        <AuthModal
          purpose="idea"
          initialMode={vm.authModal}
          onClose={vm.closeAuthModal}
          onSuccess={vm.closeAuthModal}
        />
      )}
    </div>
  );
}
