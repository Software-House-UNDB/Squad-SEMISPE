import { useState } from 'react';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import simboloParque from '../../assets/brand/favicon.png';
import { useAuth } from '../../viewmodels/useAuth';
import { type AuthMode } from '../../viewmodels/useAuthModalViewModel';
import { AuthModal } from './AuthModal';
import { ReservaChat } from './ReservaChat';
import { primaryButtonClass, secondaryButtonClass } from './ui/formStyles';

/**
 * "Fazer reserva": a reserva exige conta. Sem login, a tela pede o acesso (o
 * modal já abre ao chegar) e o chat só aparece depois de entrar.
 */
export function ReservaPanel() {
  const auth = useAuth();
  const [modal, setModal] = useState<AuthMode | null>('entrar');

  if (auth.status === 'authenticated') {
    return (
      <ReservaChat
        // Outra conta começa uma conversa nova
        key={auth.account.id}
        account={auth.account}
        onLogout={() => {
          // Quem saiu de propósito não recebe o modal de novo na mesma hora
          setModal(null);
          auth.logout();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="sr-only">Fazer reserva</h1>
      <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-semispe-blue-dark/10 sm:px-10 sm:py-16">
        {auth.status === 'checking' ? (
          <p role="status" className="inline-flex items-center gap-2 text-sm font-bold text-semispe-blue-dark/70">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Carregando a sua conta…
          </p>
        ) : (
          <>
            <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-semispe-yellow-soft" aria-hidden="true">
              <img src={simboloParque} alt="" className="w-8 h-8 object-contain" />
            </span>
            <h2 className="mt-5 text-2xl font-black tracking-tight">Entre na sua conta para reservar</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-semispe-blue-dark/75">
              O assistente usa os dados da sua conta (nome, e-mail, telefone, CPF ou CNPJ e instituição) para
              preencher a solicitação. Assim você não precisa digitar tudo de novo.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => setModal('entrar')} className={primaryButtonClass}>
                <LogIn className="w-4 h-4" aria-hidden="true" />
                Entrar
              </button>
              <button type="button" onClick={() => setModal('cadastro')} className={secondaryButtonClass}>
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                Criar conta
              </button>
            </div>
          </>
        )}
      </div>

      {auth.status === 'anonymous' && modal && (
        <AuthModal initialMode={modal} onClose={() => setModal(null)} onSuccess={() => setModal(null)} />
      )}
    </div>
  );
}
