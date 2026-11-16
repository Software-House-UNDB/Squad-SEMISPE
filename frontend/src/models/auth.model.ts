import { z } from 'zod';
import { onlyDigits } from '../utils/formatters';
import { isValidCnpj, isValidCpf, isValidEmail, isValidPhone } from '../utils/validators';

export type UserRole = 'user' | 'admin';

/**
 * Conta do usuário, como volta de GET /api/users/:id. CPF, CNPJ e telefone vêm
 * só com dígitos; os campos opcionais do cadastro vêm como null.
 */
export interface UserAccount {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  institution: string | null;
  cpf: string | null;
  cnpj: string | null;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Resposta de POST /api/auth/login: o token e um resumo da conta (sem CPF, CNPJ, instituição nem telefone) */
export interface LoginResponse {
  accessToken: string;
  user: { id: number; name: string; email: string; role: UserRole };
}

/** Corpo de POST /api/users; os campos opcionais vazios ficam de fora */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  institution?: string;
  cpf?: string;
  cnpj?: string;
}

/** O backend usa bcrypt, que só considera os primeiros 72 bytes da senha */
const MAX_PASSWORD_BYTES = 72;

/** Campo opcional: vazio passa; preenchido, precisa ser válido */
const optionalField = (isValid: (value: string) => boolean, message: string) =>
  z.string().trim().refine((value) => value === '' || isValid(value), message);

export const loginSchema = z.object({
  email: z.string().trim().refine(isValidEmail, 'Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a sua senha.'),
});

export type LoginForm = z.infer<typeof loginSchema>;

/**
 * Cadastro: CPF e CNPJ passam pelo dígito verificador aqui, porque o backend só
 * confere a quantidade de dígitos no cadastro, mas confere o dígito na reserva.
 */
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .max(150, 'Use no máximo 150 caracteres.')
    .refine((value) => value.split(/\s+/).length >= 2, 'Informe o nome completo, com sobrenome.'),
  email: z.string().trim().max(255, 'Use no máximo 255 caracteres.').refine(isValidEmail, 'Informe um e-mail válido.'),
  password: z
    .string()
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
    .refine(
      (value) => new TextEncoder().encode(value).length <= MAX_PASSWORD_BYTES,
      'A senha está longa demais. Use até 72 caracteres (letras com acento contam como dois).'
    ),
  phone: optionalField(isValidPhone, 'Informe o telefone com DDD, por exemplo (98) 99999-9999.'),
  cpf: optionalField(isValidCpf, 'Esse CPF não é válido. Confira os números.'),
  institution: z.string().trim().max(150, 'Use no máximo 150 caracteres.'),
  cnpj: optionalField(isValidCnpj, 'Esse CNPJ não é válido. Confira os números.'),
});

export type RegisterForm = z.infer<typeof registerSchema>;

export const EMPTY_REGISTER_FORM: RegisterForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  cpf: '',
  institution: '',
  cnpj: '',
};

/** Converte o formulário de cadastro no corpo da API: só dígitos nos números, opcionais vazios omitidos */
export function toRegisterRequest(form: RegisterForm): RegisterRequest {
  const digitsOrNothing = (value: string) => onlyDigits(value) || undefined;
  return {
    name: form.name,
    email: form.email.toLowerCase(),
    password: form.password,
    phone: digitsOrNothing(form.phone),
    cpf: digitsOrNothing(form.cpf),
    institution: form.institution || undefined,
    cnpj: digitsOrNothing(form.cnpj),
  };
}
