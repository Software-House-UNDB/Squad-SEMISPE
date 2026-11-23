import { z } from 'zod';

const singleLine = (label: string) => z.string().trim()
  .min(1, `${label} é obrigatório.`)
  .max(150, `${label} deve ter até 150 caracteres.`)
  .regex(/^[^\r\n]*$/, `${label} deve estar em uma única linha.`);

/** Mesmos campos e limites do CreateContactDto. O consentimento é apenas da interface. */
export const contactSchema = z.object({
  name: singleLine('O nome'),
  email: z.string().trim().toLowerCase().max(254, 'O e-mail deve ter até 254 caracteres.')
    .email('Informe um e-mail válido.'),
  subject: singleLine('O assunto'),
  message: z.string().trim().min(1, 'A mensagem é obrigatória.')
    .max(5000, 'A mensagem deve ter até 5.000 caracteres.'),
  consent: z.boolean().refine(Boolean, 'Confirme a autorização de uso dos dados para enviar.'),
});

export type ContactFormData = z.infer<typeof contactSchema>;
export type ContactRequest = Omit<ContactFormData, 'consent'>;
export interface ContactReceipt { id: number; createdAt: string; message: string }

export const EMPTY_CONTACT_FORM: ContactFormData = {
  name: '', email: '', subject: '', message: '', consent: false,
};
