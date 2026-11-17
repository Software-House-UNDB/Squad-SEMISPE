import { LockKeyhole, Save, UserRound } from 'lucide-react';
import type { UserAccount } from '../../models/auth.model';
import { formatCnpj, formatCpf, formatPhone } from '../../utils/formatters';
import { useProfileFormViewModel } from '../../viewmodels/useProfileViewModel';
import { fieldClass, primaryButtonClass, secondaryButtonClass } from './ui/formStyles';

function LockedField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          value={value || 'Não informado'}
          disabled
          className={`${fieldClass} pr-12 opacity-65 cursor-not-allowed`}
          aria-describedby="profile-identity-help"
        />
        <LockKeyhole
          className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-semispe-blue-dark/40"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function ProfileForm({
  account,
  onSaved,
  onSessionExpired,
}: {
  account: UserAccount;
  onSaved: (account: UserAccount) => void;
  onSessionExpired: () => void;
}) {
  const vm = useProfileFormViewModel(account, onSaved, onSessionExpired);
  const { errors, isDirty, isSubmitting } = vm.form.formState;
  const phone = vm.form.register('phone', {
    onChange: (event) => vm.form.setValue('phone', formatPhone(event.target.value), { shouldDirty: true }),
  });
  const cnpj = vm.form.register('cnpj', {
    onChange: (event) => vm.form.setValue('cnpj', formatCnpj(event.target.value), { shouldDirty: true }),
  });
  return (
    <form
      onSubmit={vm.submit}
      onChange={vm.clearNotice}
      noValidate
      className="mt-7 rounded-2xl bg-white p-5 sm:p-8 shadow-sm ring-1 ring-semispe-blue-dark/10"
    >
      <div className="flex items-center gap-3 border-b border-semispe-blue-dark/10 pb-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-semispe-yellow-soft">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-black">Dados da conta</h2>
          <p className="mt-1 text-xs text-semispe-blue-dark/60">
            Confira suas informações e mantenha os contatos atualizados.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-[2fr_1fr]">
        <LockedField id="profile-name" label="Nome completo" value={account.name} />
        <LockedField id="profile-cpf" label="CPF" value={formatCpf(account.cpf ?? '')} />
      </div>
      <p
        id="profile-identity-help"
        className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-semispe-blue-dark/60"
      >
        <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Nome e CPF são dados de identificação e não podem ser alterados pela sua conta.
      </p>
      <fieldset disabled={isSubmitting} className="mt-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-email" className="mb-2 block text-sm font-bold">
            E-mail
          </label>
          <input
            id="profile-email"
            type="email"
            autoComplete="email"
            {...vm.form.register('email')}
            className={fieldClass}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={`profile-email-help${errors.email ? ' profile-email-error' : ''}`}
          />
          <p id="profile-email-help" className="mt-2 text-xs text-semispe-blue-dark/60">
            Este e-mail será usado para entrar na sua conta.
          </p>
          {errors.email && (
            <p id="profile-email-error" role="alert" className="mt-2 text-xs text-red-800">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="profile-phone" className="mb-2 block text-sm font-bold">
            Telefone com DDD
          </label>
          <input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            placeholder="(98) 99999-9999"
            {...phone}
            className={fieldClass}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'profile-phone-error' : undefined}
          />
          {errors.phone && (
            <p id="profile-phone-error" role="alert" className="mt-2 text-xs text-red-800">
              {errors.phone.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="profile-institution" className="mb-2 block text-sm font-bold">
            Instituição <span className="font-normal text-semispe-blue-dark/60">(opcional)</span>
          </label>
          <input
            id="profile-institution"
            autoComplete="organization"
            maxLength={150}
            {...vm.form.register('institution')}
            className={fieldClass}
            aria-invalid={Boolean(errors.institution)}
            aria-describedby={errors.institution ? 'profile-institution-error' : undefined}
          />
          {errors.institution && (
            <p id="profile-institution-error" role="alert" className="mt-2 text-xs text-red-800">
              {errors.institution.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="profile-cnpj" className="mb-2 block text-sm font-bold">
            CNPJ da instituição <span className="font-normal text-semispe-blue-dark/60">(opcional)</span>
          </label>
          <input
            id="profile-cnpj"
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            {...cnpj}
            className={fieldClass}
            aria-invalid={Boolean(errors.cnpj)}
            aria-describedby={errors.cnpj ? 'profile-cnpj-error' : undefined}
          />
          {errors.cnpj && (
            <p id="profile-cnpj-error" role="alert" className="mt-2 text-xs text-red-800">
              {errors.cnpj.message}
            </p>
          )}
        </div>
      </fieldset>
      {vm.error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">
          {vm.error}
        </p>
      )}
      {vm.saved && (
        <p role="status" className="mt-6 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-800">
          Seus dados foram atualizados com sucesso.
        </p>
      )}
      <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-semispe-blue-dark/10 pt-6">
        <button
          type="button"
          onClick={vm.cancel}
          disabled={!isDirty || isSubmitting}
          className={`${secondaryButtonClass} disabled:opacity-40`}
        >
          Cancelar alterações
        </button>
        <button type="submit" disabled={!isDirty || isSubmitting} className={primaryButtonClass}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
