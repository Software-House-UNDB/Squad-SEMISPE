import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  FileText,
  Handshake,
  LayoutDashboard,
  Layers3,
  Lightbulb,
  Mail,
  Network,
  Newspaper,
  UsersRound,
  BriefcaseBusiness,
  Landmark,
} from 'lucide-react';
import { ADMIN_GROUPS, ADMIN_MODULES } from '../../../models/admin.model';

const icons = {
  reservas: CalendarCheck,
  espacos: Building2,
  eventos: CalendarDays,
  noticias: Newspaper,
  parceiros: Handshake,
  ecossistema: Network,
  editais: FileText,
  oportunidades: BriefcaseBusiness,
  institucional: Landmark,
  contatos: Mail,
  ideias: Lightbulb,
  usuarios: UsersRound,
};
const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${isActive ? 'bg-semispe-yellow-soft text-semispe-blue-dark' : 'text-semispe-blue-dark/70 hover:bg-semispe-surface'}`;

export function AdminSidebar({ accountName }: { accountName: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <aside className="border-b border-semispe-blue-dark/10 bg-white p-5 lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-semispe-blue-dark/50">Painel de gestão</p>
      <h2 className="mt-2 text-lg font-black">Administração do portal</h2>
      <p className="mt-2 break-words text-xs leading-relaxed text-semispe-blue-dark/60">{accountName}</p>
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-controls="admin-navigation"
        onClick={() => setMenuOpen((open) => !open)}
        className="mt-4 w-full rounded-xl bg-semispe-yellow-soft px-4 py-3 text-left text-sm font-bold lg:hidden"
      >
        {menuOpen ? 'Fechar menu de administração' : 'Abrir menu de administração'}
      </button>
      <nav
        id="admin-navigation"
        aria-label="Administração"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a')) setMenuOpen(false);
        }}
        className={`mt-6 ${menuOpen ? 'block' : 'hidden lg:block'}`}
      >
        <NavLink to="/admin" end className={navClass}>
          <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
          Visão geral
        </NavLink>
        {ADMIN_GROUPS.map((group) => (
          <div key={group} className="mt-5">
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-wider text-semispe-blue-dark/45">
              {group}
            </p>
            <ul className="space-y-1">
              {ADMIN_MODULES.filter((module) => module.group === group).map((module) => {
                const Icon = icons[module.id as keyof typeof icons] ?? Layers3;
                return (
                  <li key={module.id}>
                    <NavLink to={`/admin/${module.id}`} className={navClass}>
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1">{module.title}</span>
                      {!module.available && (
                        <span className="shrink-0 rounded bg-semispe-surface px-1.5 py-0.5 text-[9px] font-normal text-semispe-blue-dark/55">
                          Em breve
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
