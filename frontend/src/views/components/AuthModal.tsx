import { useEffect, useRef, useState } from 'react';
import { Eye, Loader2, X } from 'lucide-react';
import { type UseFormRegisterReturn } from 'react-hook-form';
import simboloParque from '../../assets/brand/favicon.png';
import { cn } from '../../utils/cn';
import { formatCnpj, formatCpf, formatPhone } from '../../utils/formatters';
import { useAuthModalViewModel, type AuthMode, type AuthModalViewModel } from '../../viewmodels/useAuthModalViewModel';
import { fieldClass, primaryButtonClass } from './ui/formStyles';

interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  hint?: string;
  /** Botão dentro do campo, à direita (o de mostrar a senha) */
  trailing?: React.ReactNode;
}

function Field({ id, label, registration, error, hint, trailing, ...input }: FieldProps) {
  const describedBy = [hint && `${id}-dica`, error && `${id}-erro`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block mb-1.5 text-xs font-bold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          {...input}
          {...registration}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(fieldClass, trailing && 'pr-12', error && 'ring-red-700/50')}
        />
        {trailing}
      </div>
      {hint && (
        <p id={`${id}-dica`} className="mt-1 text-[11px] text-semispe-blue-dark/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-erro`} className="mt-1 text-xs font-bold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField(props: Omit<FieldProps, 'type' | 'trailing'>) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <Field
      {...props}
      type={isVisible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          aria-label="Mostrar a senha"
          aria-pressed={isVisible}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-lg transition-colors cursor-pointer hover:bg-semispe-blue-dark/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark ${
            isVisible ? 'text-semispe-blue-dark' : 'text-semispe-blue-dark/50'
          }`}
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
        </button>
      }
    />
  );
}

function SubmitButton({ isSubmitting, label }: { isSubmitting: boolean; label: string }) {
  return (
    <button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} w-full`}>
      {isSubmitting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Aguarde…
        </>
      ) : (
        label
      )}
    </button>
  );
}

const MODES: readonly { id: AuthMode; label: string }[] = [
  { id: 'entrar', label: 'Entrar' },
  { id: 'cadastro', label: 'Criar conta' },
];

function ModeSwitch({ mode, onChange }: { mode: AuthMode; onChange: (mode: AuthMode) => void }) {
  return (
    <div role="group" aria-label="Acesso" className="grid grid-cols-2 gap-1 rounded-xl bg-semispe-surface p-1 ring-1 ring-semispe-blue-dark/10">
      {MODES.map((item) => {
        const isActive = item.id === mode;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={isActive}
            className={`rounded-lg px-3 py-2 text-xs font-black tracking-wider uppercase transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark ${
              isActive ? 'bg-white shadow-sm ring-1 ring-semispe-blue-dark/10' : 'text-semispe-blue-dark/60 hover:text-semispe-blue-dark'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function LoginFields({ vm }: { vm: AuthModalViewModel }) {
  const {
    register,
    formState: { errors },
  } = vm.loginForm;

  return (
    <form noValidate onSubmit={vm.submitLogin} className="space-y-4">
      <Field
        id="acesso-email"
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="nome@exemplo.com"
        registration={register('email')}
        error={errors.email?.message}
      />
      <PasswordField
        id="acesso-senha"
        label="Senha"
        autoComplete="current-password"
        registration={register('password')}
        error={errors.password?.message}
      />
      <SubmitButton isSubmitting={vm.isSubmitting} label="Entrar" />
    </form>
  );
}

function RegisterFields({ vm }: { vm: AuthModalViewModel }) {
  const {
    register,
    formState: { errors },
  } = vm.registerForm;

  return (
    <form noValidate onSubmit={vm.submitRegister} className="space-y-4">
      <Field
        id="cadastro-nome"
        label="Nome completo"
        autoComplete="name"
        maxLength={150}
        placeholder="Ex.: Maria Silva"
        registration={register('name')}
        error={errors.name?.message}
      />
      <Field
        id="cadastro-email"
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="nome@exemplo.com"
        registration={register('email')}
        error={errors.email?.message}
      />
      <PasswordField
        id="cadastro-senha"
        label="Senha"
        autoComplete="new-password"
        hint="Pelo menos 8 caracteres."
        registration={register('password')}
        error={errors.password?.message}
      />

      <fieldset className="rounded-xl border border-semispe-blue-dark/15 px-4 pb-4">
        <legend className="px-1.5 text-xs font-black">Para agilizar as reservas</legend>
        <p className="mb-3 text-[11px] leading-snug text-semispe-blue-dark/60">
          Opcional. O que você preencher aqui o assistente de reservas não pergunta de novo.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="cadastro-telefone"
            label="Telefone com DDD"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(98) 99999-9999"
            registration={vm.registerMasked('phone', formatPhone)}
            error={errors.phone?.message}
          />
          <Field
            id="cadastro-cpf"
            label="CPF"
            inputMode="numeric"
            placeholder="000.000.000-00"
            registration={vm.registerMasked('cpf', formatCpf)}
            error={errors.cpf?.message}
          />
          <Field
            id="cadastro-instituicao"
            label="Instituição"
            autoComplete="organization"
            maxLength={150}
            placeholder="Ex.: UFMA"
            registration={register('institution')}
            error={errors.institution?.message}
          />
          <Field
            id="cadastro-cnpj"
            label="CNPJ da instituição"
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            registration={vm.registerMasked('cnpj', formatCnpj)}
            error={errors.cnpj?.message}
          />
        </div>
      </fieldset>

      <SubmitButton isSubmitting={vm.isSubmitting} label="Criar conta e continuar" />
    </form>
  );
}

export interface AuthModalProps {
  purpose?: 'reservation' | 'account' | 'idea';
  initialMode: AuthMode;
  /** Fechou sem entrar (Esc ou o X) */
  onClose: () => void;
  /** Entrou (ou criou a conta e entrou) */
  onSuccess: () => void;
}

const ENTER_TITLE: Record<NonNullable<AuthModalProps['purpose']>, string> = {
  reservation: 'Entre para reservar',
  account: 'Acesse sua conta',
  idea: 'Entre para enviar sua ideia',
};

const DESCRIPTION: Record<NonNullable<AuthModalProps['purpose']>, string> = {
  reservation: 'A reserva é feita pela sua conta: o assistente usa os dados dela para preencher a solicitação.',
  account: 'Entre ou crie uma conta para acessar seus dados e os serviços do Parque Tecnológico.',
  idea: 'A ideia é enviada pela sua conta: o nome, o e-mail, o telefone e a instituição dela identificam quem propôs.',
};

/** Acesso antes da reserva: entrar ou criar a conta, num modal sobre a página */
export function AuthModal({ initialMode, onClose, onSuccess, purpose = 'reservation' }: AuthModalProps) {
  const vm = useAuthModalViewModel(initialMode, onSuccess);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // O <dialog> nativo prende o foco, fecha no Esc e bloqueia o fundo
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    // Com mouse, o cursor já vai para o primeiro campo; no celular o teclado abriria sozinho
    if (window.matchMedia('(pointer: fine)').matches) dialog.querySelector('input')?.focus();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="acesso-titulo"
      aria-describedby="acesso-descricao"
      className="m-auto w-[calc(100%-2rem)] max-w-lg max-h-[calc(100svh-2rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white p-0 text-semispe-blue-dark shadow-2xl backdrop:bg-semispe-blue-dark/60 backdrop:backdrop-blur-[2px]"
    >
      <div className="px-5 pt-5 pb-6 sm:px-7 sm:pt-6 sm:pb-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-semispe-yellow-soft" aria-hidden="true">
              <img src={simboloParque} alt="" className="w-6 h-6 object-contain" />
            </span>
            <h2 id="acesso-titulo" className="text-xl font-black leading-tight">
              {vm.mode === 'entrar' ? ENTER_TITLE[purpose] : 'Crie a sua conta'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar"
            className="grid place-items-center w-9 h-9 shrink-0 rounded-full transition-colors cursor-pointer hover:bg-semispe-blue-dark/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p id="acesso-descricao" className="mt-3 text-sm leading-relaxed text-semispe-blue-dark/75">
          {DESCRIPTION[purpose]}
        </p>

        <div className="mt-5">
          <ModeSwitch mode={vm.mode} onChange={vm.switchMode} />
        </div>

        {vm.notice && (
          <p role="status" className="mt-4 rounded-xl bg-semispe-yellow-soft px-4 py-3 text-sm font-bold">
            {vm.notice}
          </p>
        )}
        {vm.error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800 ring-1 ring-red-200">
            {vm.error}
          </p>
        )}

        <div className="mt-5">{vm.mode === 'entrar' ? <LoginFields vm={vm} /> : <RegisterFields vm={vm} />}</div>
      </div>
    </dialog>
  );
}
