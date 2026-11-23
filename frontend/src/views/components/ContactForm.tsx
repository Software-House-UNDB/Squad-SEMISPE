import { useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle2, Loader2, MessageSquare, Send } from 'lucide-react';
import type { ContatoViewModel } from '../../viewmodels/useContatoViewModel';
import { fieldClass, primaryButtonClass, secondaryButtonClass } from './ui/formStyles';

export function ContactForm({ vm }: { vm: ContatoViewModel }) {
  const { errors } = vm.form.formState;
  const isSubmitting = vm.isSending || vm.form.formState.isSubmitting;
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (vm.receipt || vm.submitError) notice.current?.focus();
  }, [vm.receipt, vm.submitError]);

  if (vm.receipt) return (
    <div ref={notice} tabIndex={-1} role="status" className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-semispe-blue-dark/10 sm:p-10 focus:outline-none">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-semispe-teal/10 text-semispe-teal">
        <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="mt-6 text-2xl font-black">Mensagem recebida!</h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-semispe-blue-dark/75">
        Seu contato foi registrado. A equipe do Parque poderá usar o e-mail informado para responder à sua mensagem.
      </p>
      <button type="button" onClick={vm.newMessage} className={`${secondaryButtonClass} mt-7`}>
        Enviar outra mensagem <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <form onSubmit={vm.submit} noValidate aria-labelledby="contact-form-title" aria-busy={isSubmitting}
      className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-semispe-blue-dark/10 sm:p-8">
      <div className="flex items-start gap-3 border-b border-semispe-blue-dark/10 pb-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-semispe-teal/10 text-semispe-teal">
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="contact-form-title" className="text-lg font-black">Envie sua mensagem</h2>
          <p className="mt-1 text-sm text-semispe-blue-dark/65">Não é necessário ter uma conta para entrar em contato.</p>
        </div>
      </div>

      {vm.submitError && <div ref={notice} tabIndex={-1} role="alert" className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800 focus:outline-none">{vm.submitError}</div>}

      <fieldset disabled={isSubmitting} className="mt-6 min-w-0 space-y-5">
        <legend className="sr-only">Dados para contato e mensagem</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="mb-2 block text-sm font-bold">Nome <span aria-hidden="true">*</span></label>
            <input id="contact-name" autoComplete="name" maxLength={150} required className={fieldClass}
              placeholder="Como podemos chamar você?" {...vm.form.register('name')}
              aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'contact-name-error' : undefined} />
            {errors.name && <p id="contact-name-error" role="alert" className="mt-2 text-xs text-red-700">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="contact-email" className="mb-2 block text-sm font-bold">E-mail <span aria-hidden="true">*</span></label>
            <input id="contact-email" type="email" autoComplete="email" maxLength={254} required className={fieldClass}
              placeholder="seuemail@exemplo.com" {...vm.form.register('email')}
              aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'contact-email-error' : undefined} />
            {errors.email && <p id="contact-email-error" role="alert" className="mt-2 text-xs text-red-700">{errors.email.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="contact-subject" className="mb-2 block text-sm font-bold">Assunto <span aria-hidden="true">*</span></label>
          <input id="contact-subject" maxLength={150} required className={fieldClass} placeholder="Sobre o que você quer conversar?"
            {...vm.form.register('subject')} aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? 'contact-subject-error' : undefined} />
          {errors.subject && <p id="contact-subject-error" role="alert" className="mt-2 text-xs text-red-700">{errors.subject.message}</p>}
        </div>
        <div>
          <label htmlFor="contact-message" className="mb-2 block text-sm font-bold">Mensagem <span aria-hidden="true">*</span></label>
          <textarea id="contact-message" rows={7} maxLength={5000} required className={`${fieldClass} resize-y min-h-40`}
            placeholder="Conte como podemos ajudar." {...vm.form.register('message')} aria-invalid={Boolean(errors.message)}
            aria-describedby={`contact-message-help${errors.message ? ' contact-message-error' : ''}`} />
          <p id="contact-message-help" className="mt-2 text-xs text-semispe-blue-dark/60">Até 5.000 caracteres.</p>
          {errors.message && <p id="contact-message-error" role="alert" className="mt-2 text-xs text-red-700">{errors.message.message}</p>}
        </div>
        <div className="rounded-xl bg-semispe-surface p-4">
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-semispe-blue-dark/75">
            <input type="checkbox" required {...vm.form.register('consent')} className="mt-0.5 h-4 w-4 shrink-0 accent-semispe-blue-dark"
              aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? 'contact-consent-error' : undefined} />
            Concordo que meu nome, e-mail e mensagem sejam utilizados para atender este contato.
          </label>
          {errors.consent && <p id="contact-consent-error" role="alert" className="mt-2 text-xs text-red-700">{errors.consent.message}</p>}
        </div>
      </fieldset>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-semispe-blue-dark/10 pt-6">
        <p className="text-xs text-semispe-blue-dark/60">* Todos os campos são obrigatórios.</p>
        <button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} w-full sm:w-auto`}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          {isSubmitting ? 'Enviando…' : 'Enviar mensagem'}
        </button>
      </div>
    </form>
  );
}
