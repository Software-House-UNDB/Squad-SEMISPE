import { expect, it } from 'vitest';
import { contactSchema } from './contact.model';
const valid = { name: 'Maria', email: 'maria@example.com', subject: 'Visita', message: 'Olá', consent: true };

it('valida os limites e quebras de linha aceitos pela API de contatos', () => {
  expect(contactSchema.safeParse({ ...valid, message: 'Uma linha\nOutra linha' }).success).toBe(true);
  expect(contactSchema.safeParse({ ...valid, name: 'A'.repeat(151) }).success).toBe(false);
  expect(contactSchema.safeParse({ ...valid, subject: 'A'.repeat(151) }).success).toBe(false);
  expect(contactSchema.safeParse({ ...valid, name: 'Maria\nSilva' }).success).toBe(false);
  expect(contactSchema.safeParse({ ...valid, subject: 'Visita\nOutro' }).success).toBe(false);
  expect(contactSchema.safeParse({ ...valid, message: 'A'.repeat(5000) }).success).toBe(true);
  expect(contactSchema.safeParse({ ...valid, message: 'A'.repeat(5001) }).success).toBe(false);
  expect(contactSchema.safeParse({ ...valid, message: '   ' }).success).toBe(false);
  expect(contactSchema.safeParse({ ...valid, email: 'email inválido' }).success).toBe(false);
  expect(contactSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
});
