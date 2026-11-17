import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, LogIn } from 'lucide-react';
import { useAdminLoginViewModel } from '../../../viewmodels/useAdminLoginViewModel';
import { fieldClass, primaryButtonClass } from '../ui/formStyles';

export function AdminLogin({ expired }: { expired: boolean }) {
  const vm = useAdminLoginViewModel();
  const [visible, setVisible] = useState(false);
  const { errors, isSubmitting } = vm.form.formState;
  return (
    <section className="mx-auto my-10 max-w-md rounded-3xl bg-white p-7 sm:p-9 shadow-sm ring-1 ring-semispe-blue-dark/10">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-semispe-yellow-soft">
        <LockKeyhole aria-hidden="true" />
      </span>
      <p className="mt-6 text-[11px] font-black uppercase tracking-[0.2em] text-semispe-blue/80">Área administrativa</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Entre para gerenciar</h1>
      <p className="mt-3 text-sm leading-relaxed text-semispe-blue-dark/70">
        Acesso exclusivo à equipe responsável pela gestão do portal do Parque Tecnológico.
      </p>
      {expired && (
        <p role="status" className="mt-5 rounded-xl bg-semispe-yellow-soft p-3 text-sm">
          Sua sessão expirou. Entre novamente para continuar.
        </p>
      )}
      {vm.error && (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {vm.error}
        </p>
      )}
      <form onSubmit={vm.submit} noValidate className="mt-7 space-y-5">
        <div>
          <label htmlFor="admin-email" className="mb-2 block text-sm font-bold">
            E-mail
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            className={fieldClass}
            {...vm.form.register('email')}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'admin-email-error' : undefined}
          />
          {errors.email && (
            <p id="admin-email-error" role="alert" className="mt-1 text-xs text-red-700">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="admin-password" className="mb-2 block text-sm font-bold">
            Senha
          </label>
          <div className="relative">
            <input
              id="admin-password"
              type={visible ? 'text' : 'password'}
              autoComplete="current-password"
              className={`${fieldClass} pr-14`}
              {...vm.form.register('password')}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'admin-password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setVisible((previous) => !previous)}
              aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="admin-password-error" role="alert" className="mt-1 text-xs text-red-700">
              {errors.password.message}
            </p>
          )}
        </div>
        <button className={`${primaryButtonClass} w-full`} disabled={isSubmitting}>
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Entrando…' : 'Entrar no painel'}
        </button>
      </form>
    </section>
  );
}
