import { onlyDigits } from './formatters';

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

/** DDD + número: 10 dígitos (fixo) ou 11 (celular) */
export const isValidPhone = (value: string) => /^\d{10,11}$/.test(onlyDigits(value));

/** Dígitos repetidos (111.111.111-11) passam no cálculo, mas não são documentos válidos */
const isRepeated = (digits: string) => /^(\d)\1+$/.test(digits);

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || isRepeated(digits)) return false;

  const checkDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10]);
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || isRepeated(digits)) return false;

  const checkDigit = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, weight, i) => acc + Number(digits[i]) * weight, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return checkDigit(12) === Number(digits[12]) && checkDigit(13) === Number(digits[13]);
}
