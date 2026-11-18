import { type PartnerCategoryCount } from '../../models/partner.model';
import { RevealCard } from './ui/RevealCard';

export interface PartnerCountCardsProps {
  counts: readonly PartnerCategoryCount[];
  isLoading?: boolean;
  className?: string;
}

/** Quantos parceiros há em cada categoria, em cards no padrão dos Indicadores */
export function PartnerCountCards({ counts, isLoading = false, className = '' }: PartnerCountCardsProps) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 ${className}`} aria-busy="true">
        <span role="status" className="sr-only">
          Carregando os parceiros…
        </span>
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-24 rounded-2xl bg-semispe-blue-dark/5 animate-pulse" aria-hidden="true" />
        ))}
      </div>
    );
  }

  return (
    <dl className={`grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 ${className}`}>
      {counts.map(({ category, count }, index) => (
        <RevealCard key={category.id} index={index} className="p-4 sm:p-5">
          <dt className="sr-only">{category.plural}</dt>
          <dd className="flex flex-col">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-semispe-teal">
              {count}
            </span>
            {/* O nome da categoria já está no <dt> para leitores de tela */}
            <span className="mt-1 text-sm font-bold leading-snug text-semispe-blue-dark/80" aria-hidden="true">
              {count === 1 ? category.singular : category.plural}
            </span>
          </dd>
        </RevealCard>
      ))}
    </dl>
  );
}
