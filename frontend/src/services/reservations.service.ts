
import { type ReservationFiles, type ReservationRequest } from '../models/reservation.model';

/**
 * Envia a solicitação de reserva.
 *
 * SIMULADO: o backend ainda não tem o endpoint de reservas, então nada é salvo
 * nem enviado. Quando ele existir, trocar pelo envio em multipart, por exemplo:
 *   const body = new FormData();
 *   body.append('dados', JSON.stringify(request));
 *   body.append('oficio', files.oficio); // e os anexos opcionais que existirem
 *   return apiClient('reservations', { method: 'POST', body });
 */
export async function submitReservation(request: ReservationRequest, files: ReservationFiles): Promise<void> {
  void request;
  void files;
  await new Promise((resolve) => setTimeout(resolve, 1200));
}
