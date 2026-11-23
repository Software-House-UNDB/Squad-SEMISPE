import { apiClient } from './api';
import type { ReservationFiles, ReservationRequest } from '../models/reservation.model';

export interface ReservationReceipt {
  id: number;
  status: 'pending';
  createdAt: string;
}
export interface SpaceSchedule {
  spaceId: number;
  date: string;
  active: boolean;
  occupied: { startTime: string; endTime: string }[];
}

export function fetchSchedule(spaceId: number, date: string, signal?: AbortSignal): Promise<SpaceSchedule> {
  return apiClient<SpaceSchedule>(`reservations/spaces/${spaceId}/schedule?${new URLSearchParams({ date })}`, {
    signal,
  });
}

export function submitReservation(
  request: ReservationRequest,
  files: ReservationFiles,
  token: string
): Promise<ReservationReceipt> {
  const body = new FormData();
  body.append('dados', JSON.stringify(request));
  for (const [name, file] of Object.entries(files)) if (file) body.append(name, file);
  return apiClient<ReservationReceipt>('reservations', { method: 'POST', body, token });
}
