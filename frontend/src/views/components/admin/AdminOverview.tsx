import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, LayoutDashboard, Layers3 } from 'lucide-react';
import { ADMIN_MODULES } from '../../../models/admin.model';
import { primaryButtonClass } from '../ui/formStyles';

export function AdminOverview() {
  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-semispe-blue-dark/55">
        Administração / Visão geral
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">Administração do portal</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-semispe-blue-dark/70">
        Gerencie o conteúdo, os espaços, os atendimentos e os acessos da plataforma do Parque Tecnológico de São Luís.
      </p>
      <section
        aria-labelledby="admin-available-title"
        className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-semispe-blue-dark/10"
      >
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-semispe-yellow-soft">
            <CalendarCheck aria-hidden="true" />
          </span>
          <div>
            <h2 id="admin-available-title" className="font-black">
              Gestão de reservas disponível
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-semispe-blue-dark/70">
              Consulte pedidos, confira anexos e registre a aprovação ou rejeição das solicitações.
            </p>
          </div>
        </div>
        <Link to="/admin/reservas" className={primaryButtonClass}>
          Acessar reservas <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
      <section aria-labelledby="admin-modules-title" className="mt-9">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          <h2 id="admin-modules-title" className="text-xl font-black">
            Áreas de administração
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-semispe-blue-dark/65">
          Cada área reúne uma parte da gestão do portal. Os módulos planejados serão disponibilizados nas próximas
          etapas.
        </p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ADMIN_MODULES.map((module) => (
            <li key={module.id}>
              <Link
                to={`/admin/${module.id}`}
                className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-semispe-blue-dark/10 transition-shadow hover:ring-semispe-blue-dark/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-semispe-blue-dark/55">
                    {module.group}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${module.available ? 'bg-green-50 text-green-800' : 'bg-semispe-surface text-semispe-blue-dark/65'}`}
                  >
                    {module.available ? 'Disponível' : 'Planejado'}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black">{module.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-semispe-blue-dark/70">{module.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold">
                  {module.available ? 'Gerenciar' : 'Ver escopo previsto'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-6 flex items-center gap-2 text-xs text-semispe-blue-dark/60">
        <Layers3 className="h-4 w-4 shrink-0" aria-hidden="true" />A gestão de reservas é o primeiro módulo deste
        painel.
      </p>
    </div>
  );
}
