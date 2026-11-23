import { IDEA_STATUS_INFO, type Idea } from '../../models/idea.model';

/** Etiqueta da etapa da ideia (Submetida, Avaliação…), na cor da etapa */
export function IdeaStatusBadge({ status }: { status: Idea['status'] }) {
  const { label, accent } = IDEA_STATUS_INFO[status];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ background: accent.tint, color: accent.onLight }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent.color }} aria-hidden="true" />
      {label}
    </span>
  );
}
