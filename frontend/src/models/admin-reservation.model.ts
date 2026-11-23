import type { ReservationRequest } from './reservation.model';
import type { Space } from './space.model';

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ReviewDecision = 'approved' | 'rejected';
export const RESERVATION_STATUS: Record<ReservationStatus, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-semispe-yellow-soft text-semispe-blue-dark' },
  approved: { label: 'Aprovada', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejeitada', className: 'bg-red-50 text-red-800' },
  cancelled: { label: 'Cancelada', className: 'bg-slate-100 text-slate-700' },
};
export const ATTACHMENT_LABELS: Record<string, string> = {
  oficio: 'Ofício',
  projeto: 'Projeto',
  apresentacao: 'Apresentação',
  pauta: 'Pauta',
};
export interface AdminReservation extends ReservationRequest {
  id: number;
  userId: number | null;
  status: ReservationStatus;
  space: Space;
  reviewNote: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ReservationAttachment {
  id: number;
  kind: string;
  originalName: string;
  size: number;
  mimeType: string;
}
export interface AdminReservationDetail extends AdminReservation {
  attachments: ReservationAttachment[];
}
export interface ReservationPage {
  items: AdminReservation[];
  total: number;
  page: number;
  limit: number;
}
export type ReservationSummary = Record<ReservationStatus | 'total', number>;
export interface ReservationFilters {
  status: ReservationStatus | 'all';
  spaceId: string;
  date: string;
  page: number;
}
