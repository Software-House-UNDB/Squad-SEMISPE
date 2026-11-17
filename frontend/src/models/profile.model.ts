import { z } from 'zod';
import type { UserAccount } from './auth.model';
import { formatCnpj, formatPhone, onlyDigits } from '../utils/formatters';
import { isValidCnpj, isValidEmail, isValidPhone } from '../utils/validators';

export interface UpdateProfileRequest {
  email: string;
  phone: string | null;
  institution: string | null;
  cnpj: string | null;
}
export const profileSchema = z.object({
  email: z
    .string()
    .trim()
    .max(255, 'Informe um e-mail com até 255 caracteres.')
    .refine(isValidEmail, 'Informe um e-mail válido.'),
  phone: z
    .string()
    .trim()
    .refine((value) => !value || isValidPhone(value), 'Informe um telefone válido com DDD.'),
  institution: z.string().trim().max(150, 'A instituição deve ter até 150 caracteres.'),
  cnpj: z
    .string()
    .trim()
    .refine((value) => !value || isValidCnpj(value), 'Informe um CNPJ válido.'),
});
export type ProfileForm = z.infer<typeof profileSchema>;
export function toProfileForm(account: UserAccount): ProfileForm {
  return {
    email: account.email,
    phone: formatPhone(account.phone ?? ''),
    institution: account.institution ?? '',
    cnpj: formatCnpj(account.cnpj ?? ''),
  };
}
export function toProfileRequest(form: ProfileForm): UpdateProfileRequest {
  return {
    email: form.email.trim().toLowerCase(),
    phone: onlyDigits(form.phone) || null,
    institution: form.institution.trim() || null,
    cnpj: onlyDigits(form.cnpj) || null,
  };
}
