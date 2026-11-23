import { apiClient } from './api';
import type { Space } from '../models/space.model';

export const spacesQueryKey = ['spaces'] as const;
export function fetchSpaces(signal?: AbortSignal): Promise<Space[]> {
  return apiClient<Space[]>('spaces', { signal });
}

/** Fotos oficiais locais; associação pelo nome, nunca por IDs provisórios. */
export function officialSpacePhoto(name: string): string | undefined {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const file = normalized.startsWith('sala de reuniao master')
    ? 'sala-reuniao-master'
    : normalized === 'sala de reuniao 1'
      ? 'sala-reuniao-1'
      : normalized === 'sala de reuniao 2'
        ? 'sala-reuniao-2'
        : normalized === 'espaco multiuso'
          ? 'espaco-multiuso'
          : ['mini auditorio', 'miniauditorio'].includes(normalized)
            ? 'mini-auditorio'
            : undefined;
  return file ? `${import.meta.env.BASE_URL}images/spaces/${file}.jpg` : undefined;
}
