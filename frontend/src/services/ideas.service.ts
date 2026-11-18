import { apiClient } from './api';
import type { CreateIdeaRequest, Idea } from '../models/idea.model';

export const myIdeasQueryKey = ['my-ideas'] as const;

/** Envia uma ideia em nome da conta logada (os dados do proponente vêm da conta) */
export async function createIdea(request: CreateIdeaRequest, token: string): Promise<Idea> {
  return apiClient<Idea>('ideas', { method: 'POST', token, body: JSON.stringify(request) });
}

/** Ideias enviadas pela própria conta, com a etapa de avaliação de cada uma */
export async function fetchMyIdeas(token: string, signal?: AbortSignal): Promise<Idea[]> {
  return apiClient<Idea[]>('ideas/mine', { token, signal, cache: 'no-store' });
}
