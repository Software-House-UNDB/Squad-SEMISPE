import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { type NavItem } from '../../models/navigation.model';
import { PARTNER_CATEGORY_INFO } from '../../models/partner.model';
import { type PartnersViewModel } from '../../viewmodels/usePartners';
import { SectionPill } from './ui/SectionPill';
import { PartnerCountCards } from './PartnerCountCards';
import { PartnerLogo } from './PartnerLogo';
import { IdeiasCallout } from './IdeiasCallout';
import { RevealCard } from './ui/RevealCard';

export interface ParceirosSectionProps {
  section: NavItem;
  data: PartnersViewModel;
}

/** Quantos parceiros aparecem na vitrine da home; o resto fica na página /parceiros */
const SHOWCASE_LIMIT = 8;

/**
 * Parceiros na home, logo depois de Indicadores (o card "Parceiros Estratégicos"
 * aponta para cá): quantos são por categoria, a vitrine e a chamada do Banco de Ideias.
 */
export function ParceirosSection({ section, data }: ParceirosSectionProps) {
  const showcase = data.partners.slice(0, SHOWCASE_LIMIT);

  return (
    <section
      id="parceiros"
      aria-labelledby="parceiros-titulo"
      className="scroll-mt-16 bg-white py-16 lg:py-24 text-semispe-blue-dark"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <header className="lg:col-span-5">
            <SectionPill label={section.label} accent={section.accent} tone="light" className="mb-4" />
            <h2 id="parceiros-titulo" className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Quem constrói o ecossistema com a gente
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-semispe-blue-dark/80">
              Instituições de ensino, empresas e entidades que somam forças com o Parque para levar a inovação até a
              cidade.
            </p>
            {data.isProvisional && (
              <p className="mt-2 text-xs font-bold text-semispe-blue-dark/75">
                Acordos firmados no lançamento do Parque, em 17 de março de 2026.
              </p>
            )}
          </header>

          <PartnerCountCards counts={data.counts} isLoading={data.isLoading} className="lg:col-span-7" />
        </div>

        {/* Parceiros em destaque: as logomarcas, com nome e categoria embaixo */}
        {!data.isLoading && (
          <ul className="mt-10 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {showcase.map((partner, index) => {
              const category = PARTNER_CATEGORY_INFO[partner.category];
              return (
                <RevealCard key={partner.id} as="li" index={index} className="flex flex-col">
                  <PartnerLogo partner={partner} className="h-24 sm:h-28 w-full text-2xl" />
                  <div className="border-t border-semispe-blue-dark/10 px-3.5 py-3">
                    <p className="line-clamp-2 text-sm font-black leading-snug">{partner.name}</p>
                    <p className="text-[11px] font-bold" style={{ color: category.accent.onLight }}>
                      {category.label}
                    </p>
                  </div>
                </RevealCard>
              );
            })}
          </ul>
        )}

        <div className="mt-8 flex justify-center sm:justify-start">
          <Link
            to="/parceiros"
            className="group/cta inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-semispe-blue-dark px-6 py-3.5 text-xs font-black tracking-wider uppercase text-white transition-colors hover:bg-semispe-yellow-light hover:text-semispe-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark focus-visible:ring-offset-2"
          >
            Conheça todos os parceiros
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <IdeiasCallout className="mt-14" />
      </div>
    </section>
  );
}
