import { apiClient } from './api';
import type { ContactRequest, ContactReceipt } from '../models/contact.model';

/** Envio público; não requer sessão nem transmite campos administrativos. */
export function sendContact(request: ContactRequest): Promise<ContactReceipt> {
  return apiClient<ContactReceipt>('contacts', {
    method: 'POST',
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(30_000),
  });
}
