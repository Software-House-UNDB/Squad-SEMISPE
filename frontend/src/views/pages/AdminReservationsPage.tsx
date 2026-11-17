import { useAdminContext } from '../../viewmodels/useAdminContext';
import { AdminReservations } from '../components/admin/AdminReservations';

export function AdminReservationsPage() {
  const context = useAdminContext();
  return <AdminReservations {...context} />;
}
