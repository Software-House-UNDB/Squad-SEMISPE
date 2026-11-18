import { useEffect } from 'react';
import { PARTNER_CATEGORY_INFO } from '../../models/partner.model';
import { useParceirosViewModel, type PartnerFilter } from '../../viewmodels/useParceirosViewModel';
import { Navbar } from '../components/Navbar';
import { SiteFooter } from '../components/SiteFooter';
import { SectionPill } from '../components/ui/SectionPill';
import { PartnerCountCards } from '../components/PartnerCountCards';
import { PartnerCard } from '../components/PartnerCard';
import { PartnerDialog } from '../components/PartnerDialog';
import { IdeiasCallout } from '../components/IdeiasCallout';

/** Botão do filtro por categoria: o ativo fica preenchido na cor da categoria */
function FilterChip({
  label,
  count,
  isActive,
  color,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      style={{ '--chip': color } as React.CSSProperties}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark focus-visible:ring-offset-2 ${
        isActive
          ? 'bg-semispe-blue-dark text-white'
          : 'bg-white text-semispe-blue-dark ring-1 ring-semispe-blue-dark/15 hover:ring-semispe-blue-dark/40'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-(--chip)" aria-hidden="true" />
      {label}
      <span className={isActive ? 'text-white/75' : 'text-semispe-blue-dark/60'}>{count}</span>
    </button>
  );
}

/**
 * Parceiros: quantos são por categoria (o mesmo gancho de Indicadores), filtro,
 * cards com o detalhe de cada um e, no fim, a chamada do Banco de Ideias.
 */
export function ParceirosPage() {
  const vm = useParceirosViewModel();
  const { data } = vm;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filters: { id: PartnerFilter; label: string; count: number; color: string }[] = [
    { id: 'todos', label: 'Todos', count: data.total, color: '#033165' },
    ...data.counts.map(({ category, count }) => ({
      id: category.id,
      label: count === 1 ? PARTNER_CATEGORY_INFO[category.id].label : capitalize(category.plural),
      count,
      color: category.accent.color,
    })),
  ];

  return (
    <div className="min-h-svh bg-white text-semispe-blue-dark flex flex-col font-sans selection:bg-semispe-yellow selection:text-semispe-dark">
      <Navbar
        navItems={vm.navItems}
        activeSection={vm.activeSection}
        isMobileMenuOpen={vm.isMobileMenuOpen}
        onToggleMobileMenu={vm.toggleMobileMenu}
        onNavItemClick={vm.onNavigateToSection}
        isSolid
      />

      <main className="flex-1">
        {/* Abertura com os contadores por categoria */}
        <section aria-labelledby="parceiros-pagina-titulo" className="bg-white pt-10 pb-12 lg:pt-16 lg:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-12 lg:items-end">
            <header className="lg:col-span-6">
              <SectionPill label={vm.section.label} accent={vm.section.accent} tone="light" className="mb-4" />
              <h1 id="parceiros-pagina-titulo" className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
                Nossos parceiros
              </h1>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-semispe-blue-dark/80">
                Instituições de ensino, empresas, órgãos públicos e entidades que somam forças com o Parque Tecnológico
                para fortalecer o ecossistema de inovação de São Luís.
              </p>
              {data.isProvisional && (
                <p className="mt-3 text-sm font-bold text-semispe-blue-dark/75">
                  Acordos firmados no lançamento do Parque, em 17 de março de 2026.
                </p>
              )}
            </header>
            <div className="lg:col-span-6">
              {!data.isLoading && (
                <p className="mb-3 text-sm font-bold text-semispe-blue-dark/75">
                  <span className="text-2xl font-black text-semispe-blue-dark">{data.total}</span>{' '}
                  {data.total === 1 ? 'parceiro' : 'parceiros'} no ecossistema
                </p>
              )}
              <PartnerCountCards counts={data.counts} isLoading={data.isLoading} />
            </div>
          </div>
        </section>

        {/* Filtro e lista */}
        <section aria-labelledby="lista-parceiros-titulo" className="bg-semispe-surface py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="lista-parceiros-titulo" className="sr-only">
              Lista de parceiros
            </h2>

            {!data.isLoading && (
              <div role="group" aria-label="Filtrar parceiros por categoria" className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <FilterChip
                    key={filter.id}
                    label={filter.label}
                    count={filter.count}
                    color={filter.color}
                    isActive={vm.filter === filter.id}
                    onClick={() => vm.setFilter(filter.id)}
                  />
                ))}
              </div>
            )}

            <ul aria-live="polite" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.isLoading
                ? [0, 1, 2, 3].map((key) => (
                    <li key={key} className="h-56 rounded-2xl bg-white/70 animate-pulse" aria-hidden="true" />
                  ))
                : vm.visiblePartners.map((partner, index) => (
                    <li key={partner.id}>
                      <PartnerCard partner={partner} index={index} onOpen={vm.openPartner} />
                    </li>
                  ))}
            </ul>
          </div>
        </section>

        <section aria-label="Banco de Ideias" className="bg-white py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <IdeiasCallout headingLevel="h2" />
          </div>
        </section>
      </main>

      <SiteFooter />

      {vm.selectedPartner && <PartnerDialog partner={vm.selectedPartner} onClose={vm.closePartner} />}
    </div>
  );
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
