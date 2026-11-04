/** Mantém só os dígitos de um texto */
export const onlyDigits = (value: string) => value.replace(/\D/g, '');

/** Aplica um padrão em que cada '9' recebe um dígito (ex.: '(99) 99999-9999') */
function applyPattern(digits: string, pattern: string): string {
  let result = '';
  let index = 0;
  for (const char of pattern) {
    if (index >= digits.length) break;
    if (char === '9') result += digits[index++];
    else result += char;
  }
  return result;
}

/** (98) 99999-9999 para celular e (98) 9999-9999 para fixo, conforme for digitado */
export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return applyPattern(digits, digits.length > 10 ? '(99) 99999-9999' : '(99) 9999-9999');
}

export const formatCpf = (value: string) => applyPattern(onlyDigits(value).slice(0, 11), '999.999.999-99');

export const formatCnpj = (value: string) => applyPattern(onlyDigits(value).slice(0, 14), '99.999.999/9999-99');

/** Data local no formato AAAA-MM-DD (sem passar por UTC, que muda o dia à noite) */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Lê AAAA-MM-DD como data local */
export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** 'terça-feira, 10 de novembro de 2026' */
export const formatLongDate = (iso: string) =>
  fromIsoDate(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** Minutos desde a meia-noite para 'HH:MM' */
export function minutesToTime(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`;
}

/** 'HH:MM' para minutos desde a meia-noite */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** '14:00' vira '14h' e '14:30' vira '14h30' */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return minutes === '00' ? `${Number(hours)}h` : `${Number(hours)}h${minutes}`;
}

/** Tamanho de arquivo legível: '850 KB', '2,4 MB' */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}
