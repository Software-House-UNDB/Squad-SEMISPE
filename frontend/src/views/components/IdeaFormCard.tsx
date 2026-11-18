import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Info, Lightbulb, Send, X } from 'lucide-react';
import type { UserAccount } from '../../models/auth.model';
import { formatPhone } from '../../utils/formatters';
import { IDEA_CATEGORIES, IDEA_LONG_TEXT_MAX, IDEA_STATUS_INFO, type IdeaForm } from '../../models/idea.model';
import type { BancoIdeiasViewModel } from '../../viewmodels/useBancoIdeiasViewModel';
import { fieldClass, primaryButtonClass } from './ui/formStyles';

type FieldName = keyof IdeaForm;

/** Rótulo, ajuda e erro de um campo, ligados ao controle por id */
function Field({
  name,
  label,
  hint,
  error,
  className = '',
  children,
}: {
  name: FieldName;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: (describedBy: string | undefined) => React.ReactNode;
}) {
  const hintId = hint ? `ideia-${name}-ajuda` : undefined;
  const errorId = error ? `ideia-${name}-erro` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={`ideia-${name}`} className="block text-sm font-bold">
        {label}
      </label>
      {/* A dica vem antes do campo, para ser lida antes de escrever */}
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-semispe-blue-dark/65">
          {hint}
        </p>
      )}
      <div className="mt-2">{children(describedBy)}</div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs font-bold text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * "Cadastro" do documento de requisitos (nome, instituição, e-mail e telefone): vem da
 * conta, então aparece só para conferir, com o caminho para atualizar em Meus dados.
 */
function AccountSummary({ account }: { account: UserAccount }) {
  const items = [
    { label: 'Nome', value: account.name },
    { label: 'Instituição', value: account.institution },
    { label: 'E-mail', value: account.email },
    { label: 'Telefone', value: account.phone ? formatPhone(account.phone) : null },
  ];
  const missing = items.filter((item) => !item.value).map((item) => item.label.toLowerCase());

  return (
    <section aria-labelledby="ideia-cadastro-titulo" className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="ideia-cadastro-titulo" className="text-base font-black">
          Cadastro
        </h3>
        <Link to="/meus-dados" className="text-xs font-bold underline underline-offset-2">
          Atualizar em Meus dados
        </Link>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-3 rounded-xl bg-semispe-surface p-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-[11px] font-bold tracking-wider uppercase text-semispe-blue-dark/70">{item.label}</dt>
            <dd className={`mt-0.5 break-words text-sm ${item.value ? 'font-bold' : 'italic text-semispe-blue-dark/60'}`}>
              {item.value || 'Não informado'}
            </dd>
          </div>
        ))}
      </dl>
      {missing.length > 0 && (
        <p className="mt-2.5 flex items-start gap-2 rounded-xl bg-semispe-yellow-soft px-4 py-3 text-xs leading-relaxed">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Sua conta está sem {missing.join(' e ')}. Você pode enviar a ideia assim mesmo, mas vale completar em Meus dados
          para a equipe do Parque ter todos os seus contatos.
        </p>
      )}
    </section>
  );
}

export interface IdeaFormCardProps {
  vm: Pick<BancoIdeiasViewModel, 'form' | 'submit' | 'submitError' | 'sentIdea' | 'dismissSentIdea'>;
  account: UserAccount;
}

/** Formulário de envio da ideia, com os mesmos campos e limites da API */
export function IdeaFormCard({ vm, account }: IdeaFormCardProps) {
  const { register, formState } = vm.form;
  const { errors, isSubmitting } = formState;
  const sentRef = useRef<HTMLDivElement>(null);

  // Depois de enviar, o foco vai para a confirmação (e a tela rola até ela)
  useEffect(() => {
    if (vm.sentIdea) sentRef.current?.focus();
  }, [vm.sentIdea]);

  const field = (name: FieldName, describedBy: string | undefined) => ({
    id: `ideia-${name}`,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': describedBy,
    className: fieldClass,
    ...register(name),
  });

  return (
    <form
      onSubmit={vm.submit}
      noValidate
      aria-labelledby="nova-ideia-titulo"
      className="rounded-2xl bg-white p-5 sm:p-8 shadow-sm ring-1 ring-semispe-blue-dark/10"
    >
      <div className="flex items-center gap-3 border-b border-semispe-blue-dark/10 pb-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-semispe-yellow-soft">
          <Lightbulb className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="nova-ideia-titulo" className="font-black">
            Nova ideia
          </h2>
          <p className="mt-0.5 text-xs text-semispe-blue-dark/65">
            Confira o seu cadastro e conte a sua ideia. Todos os campos da ideia são obrigatórios.
          </p>
        </div>
      </div>

      <AccountSummary account={account} />

      {vm.sentIdea && (
        <div
          ref={sentRef}
          tabIndex={-1}
          role="status"
          className="mt-6 flex items-start gap-3 rounded-xl bg-green-50 p-4 text-sm text-green-900 ring-1 ring-green-200 focus:outline-none"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            <strong>Ideia enviada!</strong> “{vm.sentIdea.title}” foi recebida e está na etapa{' '}
            <strong>{IDEA_STATUS_INFO[vm.sentIdea.status].label}</strong>. Acompanhe o andamento em Minhas ideias; o
            contato do Parque chega pelo e-mail <strong>{account.email}</strong>.
          </p>
          <button
            type="button"
            onClick={vm.dismissSentIdea}
            aria-label="Fechar aviso"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-green-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-green-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <fieldset disabled={isSubmitting} className="mt-8">
        <legend className="text-base font-black">Informações da ideia</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field name="title" label="Título da ideia" error={errors.title?.message} className="sm:col-span-2">
            {(describedBy) => (
              <input {...field('title', describedBy)} maxLength={150} placeholder="Ex.: Wi-fi gratuito nos ônibus" />
            )}
          </Field>

          <Field name="category" label="Categoria" error={errors.category?.message} className="sm:col-span-2">
            {(describedBy) => (
              <select {...field('category', describedBy)}>
                <option value="">Escolha uma categoria</option>
                {IDEA_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field
            name="problem"
            label="Problema identificado"
            hint="Qual desafio de São Luís a ideia resolve?"
            error={errors.problem?.message}
            className="sm:col-span-2"
          >
            {(describedBy) => <textarea {...field('problem', describedBy)} rows={4} maxLength={IDEA_LONG_TEXT_MAX} />}
          </Field>

          <Field
            name="solution"
            label="Solução proposta"
            hint="Como a sua ideia resolve esse problema?"
            error={errors.solution?.message}
            className="sm:col-span-2"
          >
            {(describedBy) => <textarea {...field('solution', describedBy)} rows={4} maxLength={IDEA_LONG_TEXT_MAX} />}
          </Field>

          <Field
            name="expectedBenefits"
            label="Benefícios esperados"
            hint="O que muda para a cidade e para as pessoas?"
            error={errors.expectedBenefits?.message}
            className="sm:col-span-2"
          >
            {(describedBy) => (
              <textarea {...field('expectedBenefits', describedBy)} rows={3} maxLength={IDEA_LONG_TEXT_MAX} />
            )}
          </Field>

          <Field name="targetAudience" label="Público-alvo" error={errors.targetAudience?.message}>
            {(describedBy) => (
              <input
                {...field('targetAudience', describedBy)}
                maxLength={255}
                placeholder="Ex.: usuários do transporte público"
              />
            )}
          </Field>

          <Field name="applicationArea" label="Área de aplicação" error={errors.applicationArea?.message}>
            {(describedBy) => (
              <input {...field('applicationArea', describedBy)} maxLength={255} placeholder="Ex.: transporte municipal" />
            )}
          </Field>
        </div>
      </fieldset>

      {vm.submitError && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800 ring-1 ring-red-200">
          {vm.submitError}
        </p>
      )}

      <div className="mt-7 flex justify-end border-t border-semispe-blue-dark/10 pt-6">
        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Enviando…' : 'Enviar ideia'}
        </button>
      </div>
    </form>
  );
}
