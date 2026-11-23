import { useCallback, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ArrowUpRight, LogOut, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import logoParque from '../../assets/brand/logo-parque-tecnologico.png';
import { useAuth } from '../../viewmodels/useAuth';
import { adminQueryKey } from '../../viewmodels/useAdminReservationsViewModel';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { BrandStripe } from '../components/ui/BrandStripe';
import { SiteFooter } from '../components/SiteFooter';
import { primaryButtonClass } from '../components/ui/formStyles';

export function AdminPage() {
  const auth = useAuth();
  const client = useQueryClient();
  const authLogout = auth.logout;
  const [expired, setExpired] = useState(false);
  const logout = useCallback(() => {
    authLogout();
    void client.cancelQueries({ queryKey: adminQueryKey });
    client.removeQueries({ queryKey: adminQueryKey });
  }, [authLogout, client]);
  const onExpired = useCallback(() => {
    setExpired(true);
    logout();
  }, [logout]);
  return (
    <div className="min-h-svh flex flex-col bg-semispe-surface text-semispe-blue-dark font-sans">
      <Link
        className="sr-only focus:not-sr-only focus:p-3 focus:bg-semispe-yellow"
        to="#admin-content"
        onClick={() => document.getElementById('admin-content')?.scrollIntoView()}
      >
        Pular para o conteúdo
      </Link>
      <header className="relative bg-[#021f42] text-white">
        <div className="flex min-h-20 items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" aria-label="Página inicial do Parque Tecnológico">
            <span className="relative block h-12 aspect-[869/440]" aria-hidden="true">
              <img
                src={logoParque}
                alt=""
                className="absolute inset-0 h-full w-full object-contain [clip-path:inset(0_56%_0_0)]"
              />
              <img
                src={logoParque}
                alt=""
                className="absolute inset-0 h-full w-full object-contain brightness-0 invert [clip-path:inset(0_0_0_44%)]"
              />
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs font-bold text-white/75">
              <ShieldCheck className="h-4 w-4 text-semispe-yellow-light" aria-hidden="true" />
              Administração
            </span>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-white/80 hover:text-semispe-yellow-light"
            >
              Ver site <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {auth.status === 'authenticated' && (
              <button
                type="button"
                onClick={() => {
                  setExpired(false);
                  logout();
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair
              </button>
            )}
          </div>
        </div>
        <BrandStripe className="absolute bottom-0 left-0" />
      </header>
      <div className="flex flex-1 flex-col lg:flex-row">
        {auth.status === 'authenticated' && auth.account.role === 'admin' && (
          <AdminSidebar accountName={auth.account.name} />
        )}
        <main id="admin-content" className="min-w-0 flex-1 p-4 sm:p-8 lg:p-10">
          {auth.status === 'checking' ? (
            <p role="status">Conferindo acesso…</p>
          ) : auth.status === 'anonymous' ? (
            <AdminLogin expired={expired} />
          ) : auth.account.role !== 'admin' ? (
            <section className="mx-auto my-12 max-w-lg rounded-2xl bg-white p-8 shadow-sm">
              <ShieldCheck aria-hidden="true" className="h-10 w-10 text-semispe-blue" />
              <h1 className="mt-5 text-2xl font-black">Acesso restrito</h1>
              <p role="alert" className="mt-3 text-sm leading-relaxed">
                Sua conta não possui permissão administrativa. Entre com uma conta autorizada pela SEMISPE.
              </p>
              <button className={`${primaryButtonClass} mt-6`} onClick={logout}>
                Entrar com outra conta
              </button>
            </section>
          ) : (
            <Outlet context={{ token: auth.accessToken, accountId: auth.account.id, onSessionExpired: onExpired }} />
          )}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
