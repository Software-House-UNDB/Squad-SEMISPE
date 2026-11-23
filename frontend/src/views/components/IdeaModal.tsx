import { useEffect, useRef } from 'react';
import { Check, Mail, X } from 'lucide-react';
import { IDEA_CATEGORY_LABEL, IDEA_FLOW, ideaStageIndex, type Idea } from '../../models/idea.model';
import { IdeaStatusBadge } from './IdeaStatusBadge';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export interface IdeaModalProps {
  idea: Idea;
  onClose: () => void;
}

/** As seis etapas do fluxo, marcando as concluídas, a atual e as próximas */
function IdeaTimeline({ status }: { status: Idea['status'] }) {
  const current = ideaStageIndex(status);

  return (
    <ol className="mt-3 grid gap-2">
      {IDEA_FLOW.map((stage, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        return (
          <li
            key={stage.status}
            aria-current={isCurrent ? 'step' : undefined}
            className="flex items-center gap-3 rounded-xl px-3 py-2"
            style={
              isCurrent
                ? { background: stage.accent.tint, boxShadow: `inset 0 0 0 1.5px ${stage.accent.color}` }
                : undefined
            }
          >
            {/* Etapas alcançadas: fundo clarinho e número escuro da etapa (contraste legível em todas as cores) */}
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black"
              style={
                isDone || isCurrent
                  ? {
                      background: isCurrent ? '#fff' : stage.accent.tint,
                      color: stage.accent.onLight,
                      boxShadow: `inset 0 0 0 1.5px ${stage.accent.color}`,
                    }
                  : { background: 'rgb(3 49 101 / 0.06)', color: 'rgb(3 49 101 / 0.6)' }
              }
              aria-hidden="true"
            >
              {isDone ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className={`text-sm ${isCurrent ? 'font-black' : isDone ? 'font-bold' : 'text-semispe-blue-dark/60'}`}>
              {stage.label}
            </span>
            <span className="sr-only">
              {isDone ? '(concluída)' : isCurrent ? '(etapa atual)' : '(a seguir)'}
            </span>
            {isCurrent && (
              <span className="ml-auto hidden text-xs text-semispe-blue-dark/75 sm:block">{stage.description}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Um bloco de texto enviado na ideia (problema, solução…) */
function IdeaField({ label, text }: { label: string; text: string }) {
  return (
    // min-w-0 deixa a coluna da grade encolher, e o texto quebra até no meio de palavras longas
    <div className="min-w-0">
      <dt className="text-[11px] font-bold tracking-wider uppercase text-semispe-blue-dark/70">{label}</dt>
      <dd className="mt-1 whitespace-pre-line [overflow-wrap:anywhere] text-sm leading-relaxed">{text}</dd>
    </div>
  );
}

/**
 * Detalhe de uma ideia enviada, aberto pelo card em Minhas ideias: tudo o que foi enviado
 * e em que etapa do fluxo ela está. Modal nativo (prende o foco, fecha no Esc e no fundo).
 */
export function IdeaModal({ idea, onClose }: IdeaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Clicar no fundo escurecido (fora da caixa) também fecha
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      aria-labelledby="ideia-detalhe-titulo"
      className="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[calc(100svh-2rem)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl bg-white p-0 text-semispe-blue-dark shadow-2xl backdrop:bg-semispe-blue-dark/60 backdrop:backdrop-blur-[2px]"
    >
      <span className="block h-1.5 bg-semispe-teal" aria-hidden="true" />
      <div className="px-5 pt-5 pb-7 sm:px-8 sm:pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <IdeaStatusBadge status={idea.status} />
            <span className="text-xs text-semispe-blue-dark/70">
              {IDEA_CATEGORY_LABEL[idea.category]} · enviada em {dateFormat.format(new Date(idea.createdAt))}
            </span>
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

        <h2
          id="ideia-detalhe-titulo"
          className="mt-3 text-2xl font-black tracking-tight leading-tight [overflow-wrap:anywhere]"
        >
          {idea.title}
        </h2>

        <section aria-labelledby="ideia-detalhe-etapas" className="mt-6">
          <h3 id="ideia-detalhe-etapas" className="text-base font-black">
            Caminho da ideia
          </h3>
          <IdeaTimeline status={idea.status} />
        </section>

        <section aria-labelledby="ideia-detalhe-informacoes" className="mt-7">
          <h3 id="ideia-detalhe-informacoes" className="text-base font-black">
            Informações da ideia
          </h3>
          <dl className="mt-3 grid gap-4 rounded-xl bg-semispe-surface p-4 sm:p-5">
            <IdeaField label="Problema identificado" text={idea.problem} />
            <IdeaField label="Solução proposta" text={idea.solution} />
            <IdeaField label="Benefícios esperados" text={idea.expectedBenefits} />
            <div className="grid gap-4 sm:grid-cols-2">
              <IdeaField label="Público-alvo" text={idea.targetAudience} />
              <IdeaField label="Área de aplicação" text={idea.applicationArea} />
            </div>
          </dl>
        </section>

        <p className="mt-6 flex items-start gap-2 text-xs text-semispe-blue-dark/75">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          A equipe do Parque atualiza a etapa da ideia, e o contato chega pelo e-mail da sua conta.
        </p>
      </div>
    </dialog>
  );
}
