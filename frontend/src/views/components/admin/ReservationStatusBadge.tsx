import { RESERVATION_STATUS, type ReservationStatus } from '../../../models/admin-reservation.model';

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const item = RESERVATION_STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${item.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {item.label}
    </span>
  );
}
