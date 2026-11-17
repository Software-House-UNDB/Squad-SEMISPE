import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
                    <h2 className="font-black">Horários ocupados</h2>
                    {schedule.data.occupied.length ? (
                      <ul className="space-y-2">
                        {schedule.data.occupied.map((slot) => (
                          <li key={slot.startTime}>
                            {slot.startTime.slice(0, 5)} às {slot.endTime.slice(0, 5)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Nenhuma reserva aprovada para este espaço nesta data.</p>
                    )}
                    <Link className={secondaryButtonClass} to={vm.reservaHref(selected.id)}>
                      Solicitar reserva
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={schedule.isFetching}
                  onClick={() => void schedule.refetch()}
                >
                  Atualizar agenda
                </button>
              </>
            )
          )}
        </section>
      )}
    </div>
  );
}
