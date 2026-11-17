import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type {
  ReservationAttachment,
  ReservationFilters,
  ReservationStatus,
  ReviewDecision,
} from '../models/admin-reservation.model';
import { RESERVATION_STATUS } from '../models/admin-reservation.model';
import { ApiError } from '../services/api';
import { fetchSpaces } from '../services/spaces.service';
import {
  downloadReservationAttachment,
  fetchAdminReservation,
  fetchAdminReservations,
  fetchReservationSummary,
  reviewReservation,
} from '../services/admin-reservations.service';

export const adminQueryKey = ['admin-reservations'] as const;
const retry = (count: number, error: Error) => !(error instanceof ApiError && error.status < 500) && count < 1;
export function adminError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403)
      return 'Sua conta não tem permissão para esta operação. Entre novamente com uma conta administrativa.';
    if (error.status === 404) return 'A solicitação ou o arquivo não foi encontrado. Atualize a lista.';
    if (error.status === 409) return `${error.message} Os dados foram atualizados para conferência.`;
    if (error.status < 500) return error.message;
  }
  return 'Não foi possível concluir a operação. Confira a conexão e tente novamente.';
}

export function useAdminReservationsViewModel(token: string, accountId: number, onSessionExpired: () => void) {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const rawStatus = params.get('status') ?? 'pending';
  const filters: ReservationFilters = {
    status:
      rawStatus === 'all' || Object.hasOwn(RESERVATION_STATUS, rawStatus)
        ? (rawStatus as ReservationStatus | 'all')
        : 'pending',
    spaceId: /^\d+$/.test(params.get('espaco') ?? '') ? params.get('espaco')! : '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(params.get('data') ?? '') ? params.get('data')! : '',
    page: Math.min(1_000_000, Math.max(1, Math.floor(Number(params.get('pagina'))) || 1)),
  };
  const rawId = Number(params.get('solicitacao'));
  const selectedId = Number.isInteger(rawId) && rawId > 0 && rawId <= 2147483647 ? rawId : null;
  const [review, setReview] = useState<{ id: number; status: ReviewDecision } | null>(null);
  const decision = review?.id === selectedId ? review.status : null;
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const downloading = useRef(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  // Uma conta nunca reutiliza respostas administrativas da sessão anterior.
  const key = [...adminQueryKey, accountId];
  const list = useQuery({
    queryKey: [...key, 'list', filters],
    queryFn: ({ signal }) => fetchAdminReservations(filters, token, signal),
    retry,
    refetchInterval: 30_000,
  });
  const summary = useQuery({
    queryKey: [...key, 'summary'],
    queryFn: ({ signal }) => fetchReservationSummary(token, signal),
    retry,
    refetchInterval: 30_000,
  });
  const spaces = useQuery({ queryKey: [...key, 'spaces'], queryFn: ({ signal }) => fetchSpaces(signal), retry });
  const detail = useQuery({
    queryKey: [...key, 'detail', selectedId],
    queryFn: ({ signal }) => fetchAdminReservation(selectedId!, token, signal),
    enabled: Boolean(selectedId),
    retry,
    staleTime: 0,
    refetchInterval: 30_000,
  });
  const setDecision = (status: ReviewDecision | null) => {
    if (status && detail.data?.id === selectedId) setReview({ id: selectedId!, status });
    else setReview(null);
  };
  const unauthorized = [list.error, summary.error, detail.error].some(
    (error) => error instanceof ApiError && error.status === 401
  );
  useEffect(() => {
    if (unauthorized) onSessionExpired();
  }, [unauthorized, onSessionExpired]);
  const changeFilters = (next: Partial<ReservationFilters>) => {
    const merged = { ...filters, ...next, page: next.page ?? 1 };
    const query = new URLSearchParams();
    query.set('status', merged.status);
    if (merged.spaceId) query.set('espaco', merged.spaceId);
    if (merged.date) query.set('data', merged.date);
    if (merged.page > 1) query.set('pagina', String(merged.page));
    setParams(query);
    setNotice(null);
  };
  const select = (id: number | null) => {
    if (saving.current) return;
    const query = new URLSearchParams(params);
    if (id) query.set('solicitacao', String(id));
    else query.delete('solicitacao');
    setParams(query);
    setDecision(null);
    setNote('');
    setNotice(null);
  };
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: adminQueryKey });
  };
  const confirmDecision = async () => {
    if (
      saving.current ||
      !decision ||
      !detail.data ||
      detail.data.id !== selectedId ||
      detail.data.status !== 'pending'
    )
      return;
    if (note.length > 2000) {
      setNotice({ kind: 'error', message: 'A observação deve ter até 2.000 caracteres.' });
      return;
    }
    saving.current = true;
    setIsSaving(true);
    setNotice(null);
    try {
      await reviewReservation(detail.data.id, decision, note, token);
      setDecision(null);
      setNote('');
      setNotice({
        kind: 'success',
        message:
          decision === 'approved'
            ? `Solicitação #${selectedId} aprovada. O horário foi reservado na agenda.`
            : `Solicitação #${selectedId} rejeitada.`,
      });
      await Promise.all([refresh(), client.invalidateQueries({ queryKey: ['schedule'] })]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
      setNotice({ kind: 'error', message: adminError(error) });
      // Não repete PATCH automaticamente: uma falha de conexão pode ter ocorrido após a gravação.
      setDecision(null);
      await refresh();
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };
  const download = async (attachment: ReservationAttachment) => {
    if (!selectedId || downloading.current) return;
    downloading.current = true;
    setDownloadingId(attachment.id);
    setNotice(null);
    try {
      const blob = await downloadReservationAttachment(selectedId, attachment.id, token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName.replaceAll('/', '_').replaceAll('\\', '_');
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onSessionExpired();
      else setNotice({ kind: 'error', message: adminError(error) });
    } finally {
      downloading.current = false;
      setDownloadingId(null);
    }
  };
  return {
    filters,
    changeFilters,
    list,
    summary,
    spaces,
    detail,
    selectedId,
    select,
    decision,
    setDecision,
    note,
    setNote,
    isSaving,
    notice,
    clearNotice: () => setNotice(null),
    downloadingId,
    download,
    confirmDecision,
    refresh,
  };
}
