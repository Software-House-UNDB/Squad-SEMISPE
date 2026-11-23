import { describe, expect, it } from 'vitest';
import { intervalAvailable, localParkTime } from './reservationSchedule';

describe('horário do Parque', () => {
  it('calcula data e hora em São Luís, inclusive na virada do dia UTC', () => {
    expect(localParkTime(new Date('2026-11-17T01:30:00Z'))).toEqual({ today: '2026-11-16', nowMinutes: 22 * 60 + 30 });
  });
  it('permite adjacência e rejeita sobreposição ou sala inativa', () => {
    const schedule = {
      spaceId: 47,
      date: '2099-06-10',
      active: true,
      occupied: [{ startTime: '09:00:00', endTime: '10:00:00' }],
    };
    expect(intervalAvailable(schedule, '08:00', '09:00')).toBe(true);
    expect(intervalAvailable(schedule, '10:00', '11:00')).toBe(true);
    expect(intervalAvailable(schedule, '08:30', '10:30')).toBe(false);
    expect(intervalAvailable({ ...schedule, active: false }, '10:00', '11:00')).toBe(false);
  });
});
