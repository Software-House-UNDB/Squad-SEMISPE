import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarCheck, Clock3 } from 'lucide-react';
import { fetchSchedule } from '../../services/reservations.service';
import { localParkTime } from '../../utils/reservationSchedule';
import { useEstruturaContext } from '../../viewmodels/useEstruturaViewModel';
import { SpacesLoadState } from './SpacesLoadState';
import { secondaryButtonClass } from './ui/formStyles';

export function AgendaPanel() {
  const vm = useEstruturaContext();
  const [spaceId, setSpaceId] = useState<number | null>(null);
  const [date, setDate] = useState(() => localParkTime().today);
  const selected = vm.spaces.find((space) => space.id === spaceId) ?? vm.spaces[0];
  const schedule = useQuery({
    queryKey: ['schedule', selected?.id, date],
    queryFn: ({ signal }) => fetchSchedule(selected!.id, date, signal),
    enabled: Boolean(selected && date),
    refetchInterval: 30_000,
  });
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-black">Agenda dos espaços</h1>
      <p className="mt-3">
        Consulte os horários ocupados por reservas aprovadas. Os horários são de São Luís (MA). Solicitações pendentes
        ainda dependem de análise.
      </p>
      <SpacesLoadState />
      {selected && (
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap gap-5">
            <label className="grid gap-2 font-bold">
              Espaço
              <select
                className="rounded-lg border p-2 max-w-full"
                value={selected.id}
                onChange={(event) => setSpaceId(Number(event.target.value))}
              >
                {vm.spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 font-bold">
              Data
              <input
                className="rounded-lg border p-2"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
          </div>
          {!date ? (
            <p>Escolha uma data.</p>
          ) : schedule.isPending ? (
            <p role="status">Consultando agenda…</p>
          ) : schedule.isError ? (
            <div role="alert">
              <p>Não foi possível consultar a agenda.</p>
              <button className={secondaryButtonClass} onClick={() => void schedule.refetch()}>
                Tentar novamente
              </button>
            </div>
          ) : (
            schedule.data && (
              <>
                {!schedule.data.active ? (
                  <p>Este espaço está indisponível.</p>
                ) : (
                  <>
                    <section
                      aria-labelledby="occupied-times-title"
                      className="border-t border-semispe-blue-dark/10 pt-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 id="occupied-times-title" className="font-black">
                          Horários ocupados
                        </h2>
                        {schedule.data.occupied.length > 0 && (
                          <span className="rounded-full bg-semispe-blue-dark/5 px-3 py-1 text-xs font-bold text-semispe-blue-dark/65">
                            {schedule.data.occupied.length}{' '}
                            {schedule.data.occupied.length === 1 ? 'intervalo reservado' : 'intervalos reservados'}
                          </span>
                        )}
                      </div>
                      {schedule.data.occupied.length ? (
                        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                          {schedule.data.occupied.map((slot) => (
                            <li
                              key={slot.startTime}
                              className="relative overflow-hidden rounded-xl border border-semispe-blue-dark/10 bg-semispe-surface/70 p-4 pl-5"
                            >
                              <span className="absolute inset-y-0 left-0 w-1 bg-semispe-yellow" aria-hidden="true" />
                              <div className="flex items-center justify-between gap-3">
                                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-semispe-blue shadow-sm">
                                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-semispe-blue-dark/70 ring-1 ring-semispe-blue-dark/10">
                                  <span className="h-1.5 w-1.5 rounded-full bg-semispe-blue" aria-hidden="true" />
                                  Ocupado
                                </span>
                              </div>
                              <div className="mt-4 flex items-center gap-5">
                                <div>
                                  <span className="block text-[10px] font-bold uppercase tracking-wider text-semispe-blue-dark/55">
                                    Início
                                  </span>
                                  <time
                                    dateTime={`${date}T${slot.startTime}`}
                                    className="mt-1 block text-2xl font-black tabular-nums"
                                  >
                                    {slot.startTime.slice(0, 5)}
                                  </time>
                                </div>
                                <ArrowRight
                                  className="mt-4 h-4 w-4 shrink-0 text-semispe-blue-dark/35"
                                  aria-hidden="true"
                                />
                                <div>
                                  <span className="block text-[10px] font-bold uppercase tracking-wider text-semispe-blue-dark/55">
                                    Término
                                  </span>
                                  <time
                                    dateTime={`${date}T${slot.endTime}`}
                                    className="mt-1 block text-2xl font-black tabular-nums"
                                  >
                                    {slot.endTime.slice(0, 5)}
                                  </time>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-semispe-blue-dark/10 bg-semispe-surface/60 p-4">
                          <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-semispe-teal" aria-hidden="true" />
                          <p className="text-sm text-semispe-blue-dark/70">
                            Nenhuma reserva aprovada para este espaço nesta data.
                          </p>
                        </div>
                      )}
                    </section>
                  </>
                )}
                <div className="flex flex-wrap gap-3 border-t border-semispe-blue-dark/10 pt-5">
                  {schedule.data.active && (
                    <Link className={secondaryButtonClass} to={vm.reservaHref(selected.id)}>
                      Solicitar reserva
                    </Link>
                  )}
                  <button
                    type="button"
                    className={secondaryButtonClass}
                    disabled={schedule.isFetching}
                    onClick={() => void schedule.refetch()}
                  >
                    Atualizar agenda
                  </button>
                </div>
              </>
            )
          )}
        </section>
      )}
    </div>
  );
}
