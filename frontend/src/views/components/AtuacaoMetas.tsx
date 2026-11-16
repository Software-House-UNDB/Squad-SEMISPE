import { GraduationCap, Network, Rocket, Trophy, type LucideIcon } from 'lucide-react';
import { type Agreement, type EcosystemBridge, type Goal, type ProgramArea } from '../../models/quemSomos.model';
import { AccentIcon } from './ui/AccentIcon';
import { EcossistemaPonte } from './EcossistemaPonte';

export interface AtuacaoMetasProps {
  bridge: EcosystemBridge;
  programs: readonly ProgramArea[];
  goals: readonly Goal[];
  agreements: readonly Agreement[];
}

const PROGRAM_ICONS: Record<ProgramArea['id'], LucideIcon> = {
  maratonas: Trophy,
  formacao: GraduationCap,
  incubacao: Rocket,
  conexao: Network,
};

function ProgramCard({ program }: { program: ProgramArea }) {
  return (
    <article
      style={{ '--accent': program.accent.color } as React.CSSProperties}
      className="group h-full flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-semispe-blue-dark/10 transition-shadow duration-300 hover:shadow-lg hover:shadow-semispe-blue-dark/10"
    >
      <figure className="relative aspect-[16/10] overflow-hidden bg-semispe-blue-dark">
        <img
          src={program.photo.src}
          alt={program.photo.alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <figcaption className="absolute left-3 bottom-3 right-3 flex">
          <span className="truncate rounded-full bg-white/95 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold shadow-sm">
            {program.photo.caption}
          </span>
        </figcaption>
      </figure>

      <div className="flex-1 border-t-4 border-(--accent) p-5">
        <div className="flex items-center gap-3">
          <AccentIcon icon={PROGRAM_ICONS[program.id]} accent={program.accent} size="sm" />
          <h4 className="text-base font-black leading-snug">{program.title}</h4>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-semispe-blue-dark/75">{program.description}</p>
      </div>
    </article>
  );
}

/** Como o Parque atua (a ponte do ecossistema e as frentes de atuação), as metas e os acordos firmados */
export function AtuacaoMetas({ bridge, programs, goals, agreements }: AtuacaoMetasProps) {
  return (
    <section id="atuacao" aria-labelledby="atuacao-titulo" className="scroll-mt-20 bg-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-semispe-blue-dark/75">
            Atuação e metas
          </p>
          <h2 id="atuacao-titulo" className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            Como o Parque atua
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-semispe-blue-dark/80">
            Buscamos promover o fortalecimento do ecossistema de inovação, estimular o empreendedorismo tecnológico e
            desenvolver soluções para os desafios da cidade.
          </p>
        </header>

        {/* O ecossistema como uma ponte sustentada por cinco pilares */}
        <EcossistemaPonte bridge={bridge} />

        {/* Frentes de atuação, cada uma com a foto de um evento real */}
        <h3 className="mt-14 text-xl sm:text-2xl font-black tracking-tight">Frentes de atuação</h3>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {programs.map((program) => (
            <li key={program.id}>
              <ProgramCard program={program} />
            </li>
          ))}
        </ul>

        {/* Metas anunciadas no lançamento */}
        <div className="mt-14 rounded-3xl bg-semispe-surface p-6 sm:p-10">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">Aonde queremos chegar</h3>
          <p className="mt-1.5 text-sm text-semispe-blue-dark/75">Metas anunciadas no lançamento do Parque.</p>

          <dl className="mt-6 grid gap-4 grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                style={{ '--accent': goal.accent.onLight, '--bar': goal.accent.color } as React.CSSProperties}
                className="flex flex-col-reverse justify-end rounded-2xl bg-white p-5 border-t-4 border-(--bar) shadow-sm"
              >
                <dt className="mt-1 text-sm font-bold leading-snug text-semispe-blue-dark/80">{goal.label}</dt>
                <dd className="text-3xl sm:text-4xl font-black tracking-tight text-(--accent)">{goal.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Acordos firmados com parceiros */}
        <h3 className="mt-14 text-xl sm:text-2xl font-black tracking-tight">Acordos firmados no lançamento</h3>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agreements.map((agreement) => (
            <li key={agreement.id} className="rounded-2xl p-5 ring-1 ring-semispe-blue-dark/10">
              <p className="text-base font-black leading-snug">{agreement.partner}</p>
              <p className="text-[11px] font-bold tracking-wider uppercase text-semispe-blue-dark/75">
                {agreement.origin}
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-semispe-blue-dark/75">{agreement.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
