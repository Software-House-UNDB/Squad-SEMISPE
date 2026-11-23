import type { SpaceSchedule } from '../services/reservations.service';

export function localParkTime(now = new Date()): { today: string; nowMinutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (key: string) => parts.find((part) => part.type === key)!.value;
  return {
    today: [get('year'), get('month'), get('day')].join('-'),
    nowMinutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

export function intervalAvailable(schedule: SpaceSchedule, start: string, end: string): boolean {
  // A API usa HH:mm:ss; normaliza também horários de meia hora do formulário.
  const seconds = (value: string) => {
    const [h, m, s = 0] = value.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };
  const from = seconds(start),
    to = seconds(end);
  return (
    schedule.active &&
    from < to &&
    !schedule.occupied.some((slot) => from < seconds(slot.endTime) && to > seconds(slot.startTime))
  );
}
