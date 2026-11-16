
import { type ReservationFiles, type ReservationRequest } from '../models/reservation.model';

/**
 * Envia a solicitação de reserva.
 *
 * SIMULADO: nada é salvo nem enviado. O POST /api/reservations já existe no
 * `developer`, com este mesmo formato, mas os ids dos espaços do front ainda são
 * provisórios (DEFAULT_SPACES) e precisam vir de GET /api/spaces antes. A troca é
 * pelo envio em multipart, com o token do login (useAuth) para quando a rota
 * passar a exigir conta:
 *   const body = new FormData();
 *   body.append('dados', JSON.stringify(request));
 *   body.append('oficio', files.oficio); // e os anexos opcionais que existirem
 *   return apiClient('reservations', { method: 'POST', body, token });
 */
export async function submitReservation(request: ReservationRequest, files: ReservationFiles): Promise<void> {
  void request;
  void files;
  await new Promise((resolve) => setTimeout(resolve, 1200));
}
