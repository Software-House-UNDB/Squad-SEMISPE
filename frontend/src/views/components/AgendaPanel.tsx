import { ExternalLink } from 'lucide-react';
import { useEstruturaContext } from '../../viewmodels/useEstruturaViewModel';

/** Agenda: o Google Agenda da SEMISPE incorporado no layout da Estrutura */
//substituir pelo reserva de backend
export function AgendaPanel() {
  const vm = useEstruturaContext();

  return (
    <div className="max-w-6xl">
      <header className="max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Agenda</h1>
        <p className="mt-3 text-sm sm:text-base text-semispe-blue-dark/75 leading-relaxed">
          Acompanhe a agenda de uso dos espaços do Parque e confira os horários já ocupados antes de
          solicitar a sua reserva.
        </p>
      </header>

      <div className="mt-8 rounded-2xl bg-white p-2 sm:p-4 shadow-sm ring-1 ring-semispe-blue-dark/10">
        <iframe
          src={vm.agendaEmbedUrl}
          title="Agenda de uso dos espaços do Parque Tecnológico (Google Agenda)"
          className="block w-full h-[560px] lg:h-[640px] rounded-xl border-0"
        />
      </div>

      <a
        href={vm.agendaPublicUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold underline underline-offset-2 decoration-semispe-blue-dark/40 hover:decoration-semispe-blue-dark rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark"
      >
        Abrir no Google Agenda
        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
      </a>
    </div>
  );
}
