import { apiClient, apiDownload } from './api';
import type {
  AdminReservationDetail,
  ReservationFilters,
  ReservationPage,
  ReservationSummary,
  ReviewDecision,
} from '../models/admin-reservation.model';

const privateOptions = (token: string, signal?: AbortSignal) => ({ token, signal, cache: 'no-store' as const });
export function fetchAdminReservations(
  filters: ReservationFilters,
  token: string,
  signal?: AbortSignal
): Promise<ReservationPage> {
  const query = new URLSearchParams({ page: String(filters.page), limit: '10' });
  if (filters.status !== 'all') query.set('status', filters.status);
  if (filters.spaceId) query.set('spaceId', filters.spaceId);
  if (filters.date) query.set('date', filters.date);
  return apiClient(`reservations?${query}`, privateOptions(token, signal));
}
export function fetchReservationSummary(token: string, signal?: AbortSignal): Promise<ReservationSummary> {
  return apiClient('reservations/summary', privateOptions(token, signal));
}
export function fetchAdminReservation(
  id: number,
  token: string,
  signal?: AbortSignal
): Promise<AdminReservationDetail> {
  return apiClient(`reservations/${id}`, privateOptions(token, signal));
}
export function reviewReservation(
  id: number,
  status: ReviewDecision,
  reviewNote: string,
  token: string
): Promise<unknown> {
  return apiClient(`reservations/${id}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status, reviewNote: reviewNote.trim() || null }),
  });
}
export function downloadReservationAttachment(
  reservationId: number,
  attachmentId: number,
  token: string
): Promise<Blob> {
  return apiDownload(`reservations/${reservationId}/attachments/${attachmentId}`, privateOptions(token));
}
