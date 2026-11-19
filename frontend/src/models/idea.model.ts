import { z } from 'zod';
import { BRAND_ACCENTS, type SectionAccent } from './brand.model';

/** Categorias aceitas pela API do Banco de Ideias */
export const IDEA_CATEGORIES = [
  { id: 'health', label: 'Saúde' },
  { id: 'education', label: 'Educação' },
  { id: 'mobility', label: 'Mobilidade' },
  { id: 'environment', label: 'Meio Ambiente' },
  { id: 'tourism', label: 'Turismo' },
  { id: 'culture', label: 'Cultura' },
  { id: 'security', label: 'Segurança' },
  { id: 'technology', label: 'Tecnologia' },
  { id: 'smart_city', label: 'Cidade Inteligente' },
  { id: 'digital_government', label: 'Governo Digital' },
  { id: 'other', label: 'Outros' },
] as const;

export type IdeaCategory = (typeof IDEA_CATEGORIES)[number]['id'];

export const IDEA_CATEGORY_LABEL = Object.fromEntries(
  IDEA_CATEGORIES.map((category) => [category.id, category.label])
) as Record<IdeaCategory, string>;

export type IdeaStatus = 'submitted' | 'evaluation' | 'under_analysis' | 'approved' | 'forwarded' | 'implemented';

export interface IdeaStage {
  status: IdeaStatus;
  label: string;
  description: string;
  accent: SectionAccent;
}

/**
 * Fluxo do Banco de Ideias, na ordem e com os nomes do documento de requisitos (seção 3.8):
 * Submetida → Avaliação → Em análise → Aprovada → Encaminhada → Implementada.
 * O admin muda a etapa pelo painel; cada etapa leva uma cor do logo.
 */
export const IDEA_FLOW: readonly IdeaStage[] = [
  {
    status: 'submitted',
    label: 'Submetida',
    description: 'A ideia chega ao Banco de Ideias do Parque.',
    accent: BRAND_ACCENTS.azul,
  },
  {
    status: 'evaluation',
    label: 'Avaliação',
    description: 'A equipe do Parque faz a triagem da proposta.',
    accent: BRAND_ACCENTS.amarelo,
  },
  {
    status: 'under_analysis',
    label: 'Em análise',
    description: 'A proposta é estudada em detalhe.',
    accent: BRAND_ACCENTS.verdeOliva,
  },
  {
    status: 'approved',
    label: 'Aprovada',
    description: 'A ideia é aprovada para seguir adiante.',
    accent: BRAND_ACCENTS.verde,
  },
  {
    status: 'forwarded',
    label: 'Encaminhada',
    description: 'Ela segue para quem pode tirá-la do papel.',
    accent: BRAND_ACCENTS.verdePetroleo,
  },
  {
    status: 'implemented',
    label: 'Implementada',
    description: 'A ideia vira solução para a cidade.',
    accent: BRAND_ACCENTS.verdeClaro,
  },
];

export const IDEA_STATUS_INFO = Object.fromEntries(IDEA_FLOW.map((stage) => [stage.status, stage])) as Record<
  IdeaStatus,
  IdeaStage
>;

/** Posição da etapa no fluxo (0 = Submetida, 5 = Implementada) */
export const ideaStageIndex = (status: IdeaStatus) => IDEA_FLOW.findIndex((stage) => stage.status === status);

/** Ideia como `GET /ideas/mine` devolve (sem o autor) */
export interface Idea {
  id: number;
  title: string;
  category: IdeaCategory;
  problem: string;
  solution: string;
  expectedBenefits: string;
  targetAudience: string;
  applicationArea: string;
  status: IdeaStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateIdeaRequest = Pick<
  Idea,
  'title' | 'category' | 'problem' | 'solution' | 'expectedBenefits' | 'targetAudience' | 'applicationArea'
>;

/** Limite dos textos longos na API (`LONG_TEXT_MAX` do backend) */
export const IDEA_LONG_TEXT_MAX = 5000;

const longText = (required: string, max: string) =>
  z.string().trim().min(1, required).max(IDEA_LONG_TEXT_MAX, max);

const isIdeaCategory = (value: string): value is IdeaCategory =>
  IDEA_CATEGORIES.some((category) => category.id === value);

/** Mesmas regras do `CreateIdeaDto` do backend. A categoria começa vazia no formulário */
export const ideaSchema = z.object({
  title: z.string().trim().min(1, 'Dê um título para a sua ideia.').max(150, 'O título deve ter até 150 caracteres.'),
  category: z
    .string()
    .refine(isIdeaCategory, 'Escolha a categoria da ideia.')
    .transform((value) => value as IdeaCategory),
  problem: longText('Descreva o problema que a ideia resolve.', 'O problema deve ter até 5.000 caracteres.'),
  solution: longText('Descreva a solução proposta.', 'A solução deve ter até 5.000 caracteres.'),
  expectedBenefits: longText('Conte quais benefícios você espera.', 'Os benefícios devem ter até 5.000 caracteres.'),
  targetAudience: z
    .string()
    .trim()
    .min(1, 'Diga quem será beneficiado.')
    .max(255, 'O público-alvo deve ter até 255 caracteres.'),
  applicationArea: z
    .string()
    .trim()
    .min(1, 'Diga onde a ideia seria aplicada.')
    .max(255, 'A área de aplicação deve ter até 255 caracteres.'),
});

export type IdeaForm = z.input<typeof ideaSchema>;
export type ValidIdeaForm = z.output<typeof ideaSchema>;

export const EMPTY_IDEA_FORM: IdeaForm = {
  title: '',
  category: '',
  problem: '',
  solution: '',
  expectedBenefits: '',
  targetAudience: '',
  applicationArea: '',
};

export function toCreateIdeaRequest(form: ValidIdeaForm): CreateIdeaRequest {
  return {
    title: form.title.trim(),
    category: form.category,
    problem: form.problem.trim(),
    solution: form.solution.trim(),
    expectedBenefits: form.expectedBenefits.trim(),
    targetAudience: form.targetAudience.trim(),
    applicationArea: form.applicationArea.trim(),
  };
}
