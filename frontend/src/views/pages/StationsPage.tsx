import { useEffect } from 'react'
import { useStationsViewModel } from '../../viewmodels/useStationsViewModel'
import { AIR_QUALITY_COLOR, AIR_QUALITY_LABEL, POLLUTED_AQI_THRESHOLD, type AirQuality } from '../../utils/airQuality'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
import StationMap from '../components/StationMap'

const LEGEND: AirQuality[] = ['good', 'polluted', 'unknown']

export default function StationsPage() {
  const vm = useStationsViewModel()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="flex min-h-svh flex-col bg-semispe-surface font-sans text-semispe-blue-dark">
      <Navbar
        navItems={vm.navItems}
        activeSection={vm.activeSection}
        isMobileMenuOpen={vm.isMobileMenuOpen}
        onToggleMobileMenu={vm.toggleMobileMenu}
        onNavItemClick={vm.onNavigateToSection}
        isSolid
      />

      <main className="flex-1">
        <header className="border-b border-semispe-blue-dark/5 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-semispe-teal">Ar</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Qualidade do <span className="text-semispe-blue">ar</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-semispe-blue-dark/75 sm:text-lg">
                Medições das estações de monitoramento instaladas em São Luís.
              </p>
            </div>

            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
              {LEGEND.map((quality) => (
                <li key={quality} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: AIR_QUALITY_COLOR[quality] }} />
                  {AIR_QUALITY_LABEL[quality]}
                  {quality === 'polluted' && (
                    <span className="font-normal text-semispe-blue-dark/60">(AQI &gt; {POLLUTED_AQI_THRESHOLD})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {vm.isLoading && (
            <p role="status" className="mb-4 text-sm font-bold text-semispe-blue-dark/70">
              Carregando estações...
            </p>
          )}
          {vm.error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">
              {vm.error}
            </p>
          )}

          <div className="h-[65vh] min-h-[26rem] overflow-hidden rounded-2xl ring-1 ring-semispe-blue-dark/10">
            <StationMap stations={vm.stations} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
