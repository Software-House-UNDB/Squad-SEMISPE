import { type Agreement } from '../../models/quemSomos.model';

export interface AcordosLancamentoProps {
  agreements: readonly Agreement[];
}

/**
 * Vitrine dos parceiros institucionais com acordos firmados no lançamento: logomarca
 * em cinza (ganha cor no hover), nome, origem e uma descrição curta, separados por
 * divisórias finas, sem caixas.
 */
export function AcordosLancamento({ agreements }: AcordosLancamentoProps) {
  return (
    <section aria-labelledby="acordos-titulo" className="bg-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[11px] font-black tracking-[0.2em] uppercase text-semispe-blue-dark/75">
          Parceiros institucionais
        </p>
        <h2 id="acordos-titulo" className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
          Acordos firmados no lançamento
        </h2>

        <ul className="mt-10 grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
          {agreements.map((agreement, index) => (
            <li
              key={agreement.id}
              className={[
                'group lg:pr-8',
                index % 2 === 1 ? 'sm:pl-8' : '',
                index > 0 ? 'lg:border-l lg:border-slate-200/80 lg:pl-8' : '',
              ].join(' ')}
            >
              <div className="flex h-24 items-center">
                <img
                  src={agreement.logo}
                  alt={`Logo de ${agreement.partner}`}
                  loading="lazy"
                  // Cinza só onde existe hover (mouse); no celular o logo já aparece colorido
                  className="max-h-20 max-w-[12rem] object-contain transition duration-300 [@media(hover:hover)]:grayscale [@media(hover:hover)]:opacity-75 group-hover:grayscale-0 group-hover:opacity-100"
                />
              </div>
              <p className="mt-5 text-base font-black leading-snug">{agreement.partner}</p>
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
