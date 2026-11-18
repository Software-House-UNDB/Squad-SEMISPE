import { ArrowUpRight, Inbox, Loader2 } from 'lucide-react';
import { IDEA_CATEGORY_LABEL, IDEA_FLOW, IDEA_STATUS_INFO, ideaStageIndex, type Idea } from '../../models/idea.model';
import type { BancoIdeiasViewModel } from '../../viewmodels/useBancoIdeiasViewModel';
import { IdeaStatusBadge } from './IdeaStatusBadge';
import { secondaryButtonClass } from './ui/formStyles';
import { RevealCard } from './ui/RevealCard';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Em que ponto do fluxo (Submetida → … → Implementada) a ideia está: uma barra por etapa */
function StageProgress({ status }: { status: Idea['status'] }) {
  const current = ideaStageIndex(status);
  const stage = IDEA_STATUS_INFO[status];

  return (
    <div className="mt-2.5">
      <div className="flex gap-1" aria-hidden="true">
        {IDEA_FLOW.map((item, index) => (
          <span
            key={item.status}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: index <= current ? stage.accent.color : 'rgb(3 49 101 / 0.1)' }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] font-bold text-semispe-blue-dark/70">
        Etapa {current + 1} de {IDEA_FLOW.length}
        {current < IDEA_FLOW.length - 1 && <span className="font-normal"> · próxima: {IDEA_FLOW[current + 1]!.label}</span>}
      </p>
    </div>
  );
}

export interface MyIdeasListProps {
  myIdeas: BancoIdeiasViewModel['myIdeas'];
  /** Abre o modal com o detalhe da ideia */
  onOpen: (idea: Idea) => void;
}

/**
 * Ideias enviadas pela conta, da mais recente para a mais antiga. Cada ideia é um card
 * no padrão dos Indicadores; clicar no card abre o detalhe.
 */
export function MyIdeasList({ myIdeas, onOpen }: MyIdeasListProps) {
  return (
    <section aria-labelledby="minhas-ideias-titulo">
      <h2 id="minhas-ideias-titulo" className="text-lg font-black">
        Minhas ideias
      </h2>
      <p className="mt-0.5 text-xs text-semispe-blue-dark/65">
        A equipe do Parque atualiza a etapa de cada ideia, e o contato chega pelo e-mail da sua conta.
      </p>

      {myIdeas.isLoading ? (
        <p role="status" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-semispe-blue-dark/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Carregando suas ideias…
        </p>
      ) : myIdeas.isError ? (
        <div role="alert" className="mt-5 text-sm">
          <p>Não foi possível carregar suas ideias.</p>
          <button type="button" onClick={myIdeas.retry} className={`${secondaryButtonClass} mt-3`}>
            Tentar novamente
          </button>
        </div>
      ) : myIdeas.ideas.length === 0 ? (
        <p className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-dashed border-semispe-blue-dark/15 p-4 text-sm text-semispe-blue-dark/75">
          <Inbox className="h-5 w-5 shrink-0" aria-hidden="true" />
          Você ainda não enviou ideias. A primeira aparece aqui assim que for enviada.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {myIdeas.ideas.map((idea, index) => (
            <RevealCard
              key={idea.id}
              as="li"
              index={index}
              // O botão do título não mostra contorno próprio: o foco do teclado aparece no card todo
              className="p-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-semispe-blue-dark"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 text-sm font-black leading-snug [overflow-wrap:anywhere]">
                  {/* O botão cobre o card todo (o card inteiro é clicável) */}
                  <button
                    type="button"
                    onClick={() => onOpen(idea)}
                    aria-haspopup="dialog"
                    className="text-left cursor-pointer focus:outline-none after:absolute after:inset-0 after:content-['']"
                  >
                    {idea.title}
                  </button>
                </h3>
                <IdeaStatusBadge status={idea.status} />
              </div>
              <p className="mt-1 text-xs text-semispe-blue-dark/65">
                {IDEA_CATEGORY_LABEL[idea.category]} · enviada em {dateFormat.format(new Date(idea.createdAt))}
              </p>
              <StageProgress status={idea.status} />
              <span
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-black tracking-wider uppercase text-semispe-blue-dark/80 transition-colors group-hover/card:text-semispe-blue-dark"
                aria-hidden="true"
              >
                Ver detalhes
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5" />
              </span>
            </RevealCard>
          ))}
        </ul>
      )}
    </section>
  );
}
