import { Link, useParams } from 'react-router-dom';
import { Check, Layers3 } from 'lucide-react';
import { ADMIN_MODULES } from '../../../models/admin.model';
import { secondaryButtonClass } from '../ui/formStyles';

export function AdminPlannedModule() {
  const { moduleId } = useParams();
  const module = ADMIN_MODULES.find((item) => item.id === moduleId && !item.available);
  if (!module)
    return (
      <section className="mx-auto max-w-3xl rounded-2xl bg-white p-7">
        <h1 className="text-2xl font-black">Área não encontrada</h1>
        <Link to="/admin" className={`${secondaryButtonClass} mt-5`}>
          Voltar à visão geral
        </Link>
      </section>
    );
  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-semispe-blue-dark/55">
        Administração / {module.group}
      </p>
      <h1 className="mt-2 text-3xl font-black">{module.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-semispe-blue-dark/70">{module.description}</p>
      <section
        className="mt-7 rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-semispe-blue-dark/10"
        aria-labelledby="planned-module-title"
      >
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-semispe-yellow-soft">
          <Layers3 aria-hidden="true" />
        </span>
        <span className="mt-5 inline-block rounded-full bg-semispe-surface px-3 py-1 text-xs font-bold">
          Módulo planejado
        </span>
        <h2 id="planned-module-title" className="mt-3 text-xl font-black">
          Escopo previsto
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-semispe-blue-dark/70">
          Esta área faz parte da estrutura geral do painel. Os controles de gestão serão implementados em uma próxima
          etapa.
        </p>
        <ul className="mt-5 space-y-3">
          {module.capabilities.map((capability) => (
            <li key={capability} className="flex items-start gap-3 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-semispe-blue-dark/50" aria-hidden="true" />
              {capability}
            </li>
          ))}
        </ul>
        <Link to="/admin" className={`${secondaryButtonClass} mt-7`}>
          Voltar à visão geral
        </Link>
      </section>
    </div>
  );
}
