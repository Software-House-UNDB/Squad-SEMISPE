import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useProfileViewModel } from '../../viewmodels/useProfileViewModel';
import { Navbar } from '../components/Navbar';
import { SiteFooter } from '../components/SiteFooter';
import { AuthModal } from '../components/AuthModal';
import { ProfileForm } from '../components/ProfileForm';
import { primaryButtonClass, secondaryButtonClass } from '../components/ui/formStyles';

export function ProfilePage() {
  const vm = useProfileViewModel();
  const [loginOpen, setLoginOpen] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-svh flex flex-col bg-semispe-surface text-semispe-blue-dark font-sans">
      <Navbar
        navItems={vm.navItems}
        activeSection=""
        isMobileMenuOpen={vm.isMobileMenuOpen}
        onToggleMobileMenu={vm.toggleMobileMenu}
        onNavItemClick={vm.onNavigateToSection}
        isSolid
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-semispe-blue-dark/55">Minha conta</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">Meus dados</h1>
        <p className="mt-3 text-sm leading-relaxed text-semispe-blue-dark/70">
          Atualize seus dados de contato para utilizar os serviços do Parque Tecnológico.
        </p>
        {vm.auth.status === 'checking' ? (
          <p role="status" className="mt-8">
            Conferindo sua sessão…
          </p>
        ) : vm.auth.status === 'anonymous' ? (
          <section className="mt-7 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-semispe-blue-dark/10">
            <h2 className="text-xl font-black">Entre para acessar seus dados</h2>
            <p className="mt-3 text-sm">
              {vm.expired
                ? 'Sua sessão expirou. Entre novamente para continuar.'
                : 'Use sua conta para consultar e atualizar suas informações.'}
            </p>
            <button type="button" onClick={() => setLoginOpen(true)} className={`${primaryButtonClass} mt-5`}>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Entrar na minha conta
            </button>
          </section>
        ) : vm.profile.isPending ? (
          <p role="status" className="mt-8">
            Carregando seus dados…
          </p>
        ) : vm.profile.isError ? (
          <section role="alert" className="mt-7 rounded-2xl bg-white p-7 shadow-sm">
            <p>Não foi possível carregar seus dados.</p>
            <button type="button" onClick={() => void vm.profile.refetch()} className={`${secondaryButtonClass} mt-4`}>
              Tentar novamente
            </button>
          </section>
        ) : (
          vm.profile.data && (
            <ProfileForm
              key={vm.profile.data.id}
              account={vm.profile.data}
              onSaved={vm.onSaved}
              onSessionExpired={vm.onSessionExpired}
            />
          )
        )}
        <Link to="/" className="mt-6 inline-block rounded-sm text-sm font-bold underline underline-offset-4">
          Voltar ao site
        </Link>
      </main>
      <SiteFooter />
      {vm.auth.status === 'anonymous' && loginOpen && (
        <AuthModal
          purpose="account"
          initialMode="entrar"
          onClose={() => setLoginOpen(false)}
          onSuccess={() => setLoginOpen(false)}
        />
      )}
    </div>
  );
}
