import { useEffect, useRef } from 'react';
import { CalendarCheck, CheckCheck, ChevronLeft, ChevronRight, Clock3, RefreshCw, XCircle } from 'lucide-react';
import { useAdminReservationsViewModel, adminError } from '../../../viewmodels/useAdminReservationsViewModel';
import { RESERVATION_STATUS, type ReservationStatus } from '../../../models/admin-reservation.model';
import { formatLongDate, formatTime } from '../../../utils/formatters';
import { fieldClass, secondaryButtonClass } from '../ui/formStyles';
import { ReservationStatusBadge } from './ReservationStatusBadge';
import { ReservationDetail, ReviewReservationDialog } from './ReservationDetail';

export function AdminReservations({
  token,
  accountId,
  onSessionExpired,
}: {
  token: string;
  accountId: number;
  onSessionExpired: () => void;
}) {
  const vm = useAdminReservationsViewModel(token, accountId, onSessionExpired);
  const detailRegion = useRef<HTMLDivElement>(null);
  const detailId = vm.detail.data?.id;
  useEffect(() => {
    if (!detailId || detailId !== vm.selectedId) return;
    detailRegion.current?.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 1279px)').matches)
      detailRegion.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      });
  }, [detailId, vm.selectedId]);
  const cards = [
    { key: 'pending' as const, title: 'Aguardando análise', icon: Clock3, color: 'bg-semispe-yellow-soft' },
    { key: 'approved' as const, title: 'Reservas aprovadas', icon: CheckCheck, color: 'bg-green-50' },
    { key: 'rejected' as const, title: 'Solicitações rejeitadas', icon: XCircle, color: 'bg-red-50' },
    { key: 'total' as const, title: 'Total de solicitações', icon: CalendarCheck, color: 'bg-blue-50' },
  ];
  const pageCount = Math.max(1, Math.ceil((vm.list.data?.total ?? 0) / 10));
  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-semispe-blue-dark/55">
            Administração / Reservas
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">Solicitações de reserva</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-semispe-blue-dark/70">
            Acompanhe os pedidos, confira os documentos e gerencie a ocupação dos espaços do Parque.
          </p>
        </div>
        <button
          type="button"
          className={`${secondaryButtonClass} bg-white`}
          onClick={() => void vm.refresh()}
          disabled={vm.list.isFetching || vm.isSaving}
        >
          <RefreshCw className={`h-4 w-4 ${vm.list.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
          Atualizar
        </button>
      </div>
      <section aria-label="Visão geral de todas as solicitações" className="mt-7">
        {vm.summary.isError ? (
          <p role="alert" className="text-sm">
            Não foi possível carregar o resumo.{' '}
            <button type="button" className="font-bold underline" onClick={() => void vm.summary.refetch()}>
              Tentar novamente
            </button>
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() =>
                  vm.changeFilters({ status: card.key === 'total' ? 'all' : card.key, spaceId: '', date: '' })
                }
                disabled={vm.isSaving}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-semispe-blue-dark/10 hover:ring-semispe-blue-dark/30"
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-2xl font-black">
                    {vm.summary.isPending ? '—' : (vm.summary.data?.[card.key] ?? '—')}
                  </span>
                  <span className="text-xs text-semispe-blue-dark/65">{card.title}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] text-semispe-blue-dark/55">
          Visão geral de todo o histórico, incluindo reservas canceladas no total. Horários de São Luís (MA).
        </p>
      </section>
      {vm.notice && (
        <div
          role={vm.notice.kind === 'error' ? 'alert' : 'status'}
          className={`fixed bottom-4 left-4 right-4 z-40 flex items-start gap-3 rounded-xl p-4 text-sm font-bold shadow-xl sm:left-auto sm:max-w-md ${vm.notice.kind === 'error' ? 'bg-red-50 text-red-800 ring-1 ring-red-100' : 'bg-green-50 text-green-800 ring-1 ring-green-100'}`}
        >
          <p>{vm.notice.message}</p>
          <button type="button" aria-label="Fechar aviso" onClick={vm.clearNotice} className="shrink-0 rounded-md p-1">
            <XCircle className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
      <section
        aria-labelledby="reservation-filters"
        className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-semispe-blue-dark/10"
      >
        <h2 id="reservation-filters" className="text-sm font-black">
          Filtrar solicitações
        </h2>
        <fieldset disabled={vm.isSaving} className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1.4fr_1fr_auto]">
          <label className="min-w-0 text-xs font-bold">
            Status
            <select
              className={`${fieldClass} mt-2`}
              value={vm.filters.status}
              onChange={(event) => vm.changeFilters({ status: event.target.value as ReservationStatus | 'all' })}
            >
              <option value="all">Todos os status</option>
              {Object.entries(RESERVATION_STATUS).map(([value, item]) => (
                <option key={value} value={value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0 text-xs font-bold">
            Espaço
            <select
              className={`${fieldClass} mt-2`}
              value={vm.filters.spaceId}
              onChange={(event) => vm.changeFilters({ spaceId: event.target.value })}
              disabled={vm.spaces.isPending || vm.spaces.isError}
            >
              <option value="">Todos os espaços</option>
              {vm.spaces.data?.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                  {space.state === 'inactive' ? ' (inativo)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold">
            Data de uso
            <input
              type="date"
              value={vm.filters.date}
              onChange={(event) => vm.changeFilters({ date: event.target.value })}
              className={`${fieldClass} mt-2`}
            />
          </label>
          <button
            type="button"
            onClick={() => vm.changeFilters({ status: 'all', spaceId: '', date: '' })}
            className={`${secondaryButtonClass} self-end`}
          >
            Limpar filtros
          </button>
        </fieldset>
        {vm.spaces.isError && (
          <p role="alert" className="mt-3 text-xs text-red-800">
            Não foi possível carregar os espaços para o filtro.{' '}
            <button className="underline font-bold" onClick={() => void vm.spaces.refetch()}>
              Tentar novamente
            </button>
          </p>
        )}
      </section>
      <div
        className={`mt-6 grid items-start gap-6 ${vm.selectedId ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : ''}`}
      >
        <section
          aria-labelledby="requests-list-title"
          className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-semispe-blue-dark/10"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-semispe-blue-dark/10 p-5">
            <h2 id="requests-list-title" className="font-black">
              Pedidos recebidos
            </h2>
            <span className="text-xs text-semispe-blue-dark/60">
              {vm.list.isFetching ? 'Atualizando…' : `${vm.list.data?.total ?? 0} encontrados`}
            </span>
          </div>
          {vm.list.isPending ? (
            <p role="status" className="p-8 text-center text-sm">
              Carregando solicitações…
            </p>
          ) : vm.list.isError ? (
            <div role="alert" className="p-6 text-sm">
              <p>{adminError(vm.list.error)}</p>
              <button className={`${secondaryButtonClass} mt-4`} onClick={() => void vm.list.refetch()}>
                Tentar novamente
              </button>
            </div>
          ) : !vm.list.data?.items.length ? (
            <div className="p-10 text-center">
              <CalendarCheck className="mx-auto h-9 w-9 text-semispe-blue-dark/30" aria-hidden="true" />
              <h3 className="mt-4 font-black">Nenhuma solicitação encontrada</h3>
              <p className="mt-2 text-sm text-semispe-blue-dark/65">Altere os filtros para consultar outros pedidos.</p>
              {vm.filters.page > 1 && (
                <button className={`${secondaryButtonClass} mt-4`} onClick={() => vm.changeFilters({ page: 1 })}>
                  Ir para a primeira página
                </button>
              )}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-semispe-blue-dark/10">
                {vm.list.data.items.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      aria-label={`Ver solicitação #${r.id}`}
                      aria-pressed={vm.selectedId === r.id}
                      disabled={vm.isSaving}
                      onClick={() => vm.select(r.id)}
                      className={`group w-full border-l-4 p-5 text-left transition-colors hover:bg-semispe-surface/70 disabled:opacity-60 ${vm.selectedId === r.id ? 'border-semispe-yellow bg-semispe-yellow-soft/25' : 'border-transparent'}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black text-semispe-blue/80">SOLICITAÇÃO #{r.id}</span>
                        <ReservationStatusBadge status={r.status} />
                      </div>
                      <h3 className="mt-3 break-words font-black">{r.requester.name}</h3>
                      <p className="mt-1 break-words text-sm text-semispe-blue-dark/70">
                        {r.space?.name ?? `Espaço #${r.spaceId}`}
                      </p>
                      <p className="mt-3 text-xs font-bold capitalize">
                        {formatLongDate(r.date)} · {formatTime(r.startTime)}–{formatTime(r.endTime)}
                      </p>
                      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-semispe-blue-dark/60">
                        <span>
                          {r.eventType} · {r.participants} participantes
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-semispe-blue-dark">
                          Ver detalhes <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <nav
                aria-label="Paginação das solicitações"
                className="flex flex-wrap items-center justify-between gap-3 border-t border-semispe-blue-dark/10 p-4"
              >
                <p className="text-xs">
                  Página {vm.filters.page} de {pageCount}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Página anterior"
                    onClick={() => vm.changeFilters({ page: vm.filters.page - 1 })}
                    disabled={vm.filters.page <= 1 || vm.isSaving}
                    className={`${secondaryButtonClass} px-3 disabled:opacity-40`}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Próxima página"
                    onClick={() => vm.changeFilters({ page: vm.filters.page + 1 })}
                    disabled={vm.filters.page >= pageCount || vm.isSaving}
                    className={`${secondaryButtonClass} px-3 disabled:opacity-40`}
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </nav>
            </>
          )}
        </section>
        {vm.selectedId && (
          <div
            ref={detailRegion}
            tabIndex={-1}
            className="min-w-0 scroll-mt-5 rounded-2xl focus:outline-none"
            aria-label="Detalhes da reserva selecionada"
          >
            {vm.detail.isPending ? (
              <p role="status" className="rounded-2xl bg-white p-8 text-sm shadow-sm">
                Carregando detalhes…
              </p>
            ) : vm.detail.isError ? (
              <div role="alert" className="rounded-2xl bg-white p-6 text-sm shadow-sm">
                <p>{adminError(vm.detail.error)}</p>
                <div className="mt-4 flex gap-3">
                  <button className={secondaryButtonClass} onClick={() => void vm.detail.refetch()}>
                    Tentar novamente
                  </button>
                  <button className={secondaryButtonClass} onClick={() => vm.select(null)}>
                    Fechar detalhes
                  </button>
                </div>
              </div>
            ) : (
              vm.detail.data && (
                <ReservationDetail
                  reservation={vm.detail.data}
                  onClose={() => vm.select(null)}
                  onDecision={vm.setDecision}
                  onDownload={(attachment) => void vm.download(attachment)}
                  downloadingId={vm.downloadingId}
                  busy={vm.isSaving}
                  refreshing={vm.detail.isFetching}
                />
              )
            )}
          </div>
        )}
      </div>
      {vm.decision && vm.detail.data && (
        <ReviewReservationDialog
          key={`${vm.selectedId}-${vm.decision}`}
          reservation={vm.detail.data}
          decision={vm.decision}
          note={vm.note}
          onNote={vm.setNote}
          onCancel={() => vm.setDecision(null)}
          onConfirm={() => void vm.confirmDecision()}
          busy={vm.isSaving}
          canConfirm={vm.detail.data.status === 'pending' && !vm.detail.isError}
        />
      )}
    </div>
  );
}
