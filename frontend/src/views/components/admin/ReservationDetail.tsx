import { useEffect, useRef } from 'react';
import { Check, Download, FileText, Users, X } from 'lucide-react';
import type {
  AdminReservationDetail,
  ReservationAttachment,
  ReviewDecision,
} from '../../../models/admin-reservation.model';
import { ATTACHMENT_LABELS } from '../../../models/admin-reservation.model';
import {
  formatCnpj,
  formatCpf,
  formatFileSize,
  formatLongDate,
  formatPhone,
  formatTime,
} from '../../../utils/formatters';
import { fieldClass, primaryButtonClass, secondaryButtonClass } from '../ui/formStyles';
import { ReservationStatusBadge } from './ReservationStatusBadge';

function adminDateTime(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Fortaleza',
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';
}
function DataItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-semispe-blue-dark/60">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold whitespace-pre-wrap">{children}</dd>
    </div>
  );
}
export function ReservationDetail({
  reservation: r,
  onClose,
  onDecision,
  onDownload,
  downloadingId,
  busy,
  refreshing,
}: {
  reservation: AdminReservationDetail;
  onClose: () => void;
  onDecision: (status: ReviewDecision) => void;
  onDownload: (attachment: ReservationAttachment) => void;
  downloadingId: number | null;
  busy: boolean;
  refreshing: boolean;
}) {
  return (
    <section
      aria-labelledby="reservation-detail-title"
      className="rounded-2xl bg-white shadow-sm ring-1 ring-semispe-blue-dark/10 overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4 border-b border-semispe-blue-dark/10 p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase text-semispe-blue-dark/50">
            Detalhes da solicitação
          </p>
          <h2 id="reservation-detail-title" className="mt-1 text-2xl font-black">
            Reserva #{r.id}
          </h2>
          <p className="mt-2 text-xs text-semispe-blue-dark/60">Recebida em {adminDateTime(r.createdAt)}</p>
        </div>
        <button
          type="button"
          aria-label="Fechar detalhes"
          onClick={onClose}
          disabled={busy}
          className="rounded-lg p-2 hover:bg-semispe-surface disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ReservationStatusBadge status={r.status} />
          {refreshing && (
            <span role="status" className="text-xs">
              Atualizando…
            </span>
          )}
        </div>
        <div className="rounded-xl bg-semispe-surface p-4">
          <h3 className="font-black">{r.space?.name ?? `Espaço #${r.spaceId}`}</h3>
          <p className="mt-2 text-sm capitalize">{formatLongDate(r.date)}</p>
          <p className="mt-1 text-lg font-black">
            {formatTime(r.startTime)} às {formatTime(r.endTime)}
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs">
            <Users className="h-4 w-4" aria-hidden="true" />
            {r.participants} participantes{r.space ? ` · capacidade ${r.space.capacity}` : ''}
          </p>
          {r.space?.state === 'inactive' && (
            <p className="mt-2 text-xs font-bold text-red-800">Espaço atualmente inativo.</p>
          )}
        </div>
        <section aria-labelledby="requester-title">
          <h3 id="requester-title" className="font-black">
            Solicitante
          </h3>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DataItem label="Nome">{r.requester.name}</DataItem>
            <DataItem label="E-mail">{r.requester.email}</DataItem>
            <DataItem label="Telefone">{formatPhone(r.requester.phone)}</DataItem>
            <DataItem label={r.requester.type === 'instituicao' ? 'CNPJ' : 'CPF'}>
              {r.requester.type === 'instituicao' ? formatCnpj(r.requester.document) : formatCpf(r.requester.document)}
            </DataItem>
            {r.requester.institution && <DataItem label="Instituição">{r.requester.institution}</DataItem>}
          </dl>
        </section>
        <section aria-labelledby="event-title" className="border-t border-semispe-blue-dark/10 pt-5">
          <h3 id="event-title" className="font-black">
            Evento e necessidades
          </h3>
          <dl className="mt-4 space-y-4">
            <DataItem label="Tipo de evento">{r.eventType}</DataItem>
            <DataItem label="Assunto / objetivo">{r.subject}</DataItem>
            <DataItem label="Equipamentos solicitados">
              {r.equipment.length ? r.equipment.join(', ') : 'Nenhum'}
            </DataItem>
            <DataItem label="Apoio de TI">{r.needsItSupport ? 'Solicitado' : 'Não solicitado'}</DataItem>
            <DataItem label="Autorização de uso dos dados">
              {r.consent ? 'Informada pelo solicitante' : 'Não informada'}
            </DataItem>
          </dl>
        </section>
        <section aria-labelledby="attachments-title" className="border-t border-semispe-blue-dark/10 pt-5">
          <h3 id="attachments-title" className="font-black">
            Documentos anexados
          </h3>
          {r.attachments.length ? (
            <ul className="mt-3 space-y-2">
              {r.attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex items-center gap-3 rounded-xl border border-semispe-blue-dark/10 p-3"
                >
                  <FileText className="h-5 w-5 shrink-0 text-semispe-blue" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold">
                      {ATTACHMENT_LABELS[attachment.kind] ?? 'Documento'} · {formatFileSize(attachment.size)}
                    </p>
                    <p className="mt-1 break-all text-xs text-semispe-blue-dark/60">{attachment.originalName}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Baixar ${attachment.originalName}`}
                    disabled={downloadingId !== null}
                    onClick={() => onDownload(attachment)}
                    className="rounded-lg p-2 hover:bg-semispe-surface disabled:opacity-40"
                  >
                    {downloadingId === attachment.id ? (
                      <span className="text-xs">Baixando…</span>
                    ) : (
                      <Download className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-semispe-blue-dark/60">Nenhum documento disponível.</p>
          )}
        </section>
        {r.status !== 'pending' && (
          <section className="rounded-xl bg-semispe-surface p-4" aria-labelledby="review-title">
            <h3 id="review-title" className="font-black">
              Análise registrada
            </h3>
            <p className="mt-2 text-xs">
              {adminDateTime(r.reviewedAt)}
              {r.reviewedBy ? ` · administrador #${r.reviewedBy}` : ''}
            </p>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm">
              {r.reviewNote || 'Sem observação registrada.'}
            </p>
          </section>
        )}
        {r.status === 'pending' && (
          <div className="border-t border-semispe-blue-dark/10 pt-5">
            <p className="mb-4 text-xs leading-relaxed text-semispe-blue-dark/65">
              Confira o pedido e os documentos antes de decidir. A aprovação verifica novamente a disponibilidade do
              espaço.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => onDecision('approved')}
                disabled={busy || refreshing}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Aprovar reserva
              </button>
              <button
                type="button"
                className={`${secondaryButtonClass} text-red-800`}
                onClick={() => onDecision('rejected')}
                disabled={busy || refreshing}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Rejeitar solicitação
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function ReviewReservationDialog({
  reservation,
  decision,
  note,
  onNote,
  onCancel,
  onConfirm,
  busy,
  canConfirm,
}: {
  reservation: AdminReservationDetail;
  decision: ReviewDecision;
  note: string;
  onNote: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
  canConfirm: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      aria-labelledby="review-dialog-title"
      aria-describedby="review-dialog-description"
      className="m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-semispe-blue-dark shadow-2xl backdrop:bg-semispe-blue-dark/60"
    >
      <h2 id="review-dialog-title" className="text-2xl font-black">
        {decision === 'approved' ? 'Aprovar esta reserva?' : 'Rejeitar esta solicitação?'}
      </h2>
      <p id="review-dialog-description" className="mt-3 text-sm leading-relaxed">
        Solicitação <strong>#{reservation.id}</strong> · {reservation.space?.name ?? `Espaço #${reservation.spaceId}`} ·{' '}
        {formatLongDate(reservation.date)}, {formatTime(reservation.startTime)} às {formatTime(reservation.endTime)}.{' '}
        {decision === 'approved'
          ? 'O horário ficará ocupado na agenda.'
          : 'A solicitação será encerrada como rejeitada.'}
      </p>
      <label className="mt-5 block text-sm font-bold" htmlFor="review-note">
        Observação da análise <span className="font-normal">(opcional)</span>
      </label>
      <textarea
        id="review-note"
        rows={4}
        maxLength={2000}
        value={note}
        disabled={busy}
        onChange={(event) => onNote(event.target.value)}
        className={`${fieldClass} mt-2 resize-y`}
        placeholder={
          decision === 'rejected'
            ? 'Registre o motivo da decisão para consulta da equipe.'
            : 'Registre orientações ou observações para a equipe.'
        }
      />
      <p className="mt-1 text-right text-xs text-semispe-blue-dark/60">{note.length}/2.000</p>
      {!canConfirm && (
        <p role="alert" className="mt-3 text-sm text-red-800">
          Esta solicitação já foi analisada. Feche esta janela para consultar a decisão atual.
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button className={secondaryButtonClass} type="button" onClick={onCancel} disabled={busy}>
          Voltar
        </button>
        <button className={primaryButtonClass} type="button" onClick={onConfirm} disabled={busy || !canConfirm}>
          {busy ? 'Salvando…' : decision === 'approved' ? 'Confirmar aprovação' : 'Confirmar rejeição'}
        </button>
      </div>
    </dialog>
  );
}
