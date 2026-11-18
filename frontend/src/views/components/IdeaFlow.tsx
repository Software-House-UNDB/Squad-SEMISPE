import { Mail } from 'lucide-react';
import { IDEA_FLOW } from '../../models/idea.model';

/**
 * As seis etapas do Banco de Ideias, como no documento de requisitos. No computador
 * ficam lado a lado, ligadas por uma linha; no celular, em coluna.
 */
export function IdeaFlow() {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-black tracking-tight">O caminho da sua ideia</h2>
      <p className="mt-1.5 text-sm text-semispe-blue-dark/75">
        Cada ideia passa por estas etapas, e você acompanha em qual ela está em Minhas ideias.
      </p>

      <ol className="relative mt-7 grid gap-5 lg:grid-cols-6 lg:gap-4">
        {/* Linha que liga as etapas (computador) */}
        <span
          className="absolute left-0 right-0 top-5 hidden h-0.5 bg-semispe-blue-dark/10 lg:block"
          aria-hidden="true"
        />
        {IDEA_FLOW.map((stage, index) => (
          <li key={stage.status} className="relative flex gap-4 lg:flex-col lg:gap-3">
            {/* Linha que liga as etapas (celular) */}
            {index < IDEA_FLOW.length - 1 && (
              <span className="absolute left-5 top-11 -bottom-5 w-0.5 bg-semispe-blue-dark/10 lg:hidden" aria-hidden="true" />
            )}
            <span
              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black ring-4 ring-white"
              style={{ background: stage.accent.tint, color: stage.accent.onLight }}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div>
              <h3 className="text-sm font-black">{stage.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-semispe-blue-dark/75">{stage.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-7 inline-flex items-start gap-2 rounded-xl bg-semispe-surface px-4 py-3 text-sm text-semispe-blue-dark/80">
        <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        O contato sobre a sua ideia é feito pelo e-mail da sua conta.
      </p>
    </div>
  );
}
