import { BRAND_ACCENTS, type SectionAccent } from './brand.model';
import logoPortoDigital from '../assets/partners/porto-digital.png';
import logoCasaAzul from '../assets/partners/casa-azul-ventures.png';
import logoUndb from '../assets/partners/undb.png';
import logoIfma from '../assets/partners/ifma.png';

/** Categorias aceitas pela API de parceiros (`GET /partners?category=`) */
export type PartnerCategory =
  | 'company'
  | 'startup'
  | 'educational_institution'
  | 'government'
  | 'support_entity'
  | 'other';

/** Parceiro como o site exibe (o e-mail de cadastro não aparece no site) */
export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  shortDescription: string;
  description: string;
  logoUrl: string | null;
  /** Cidade/UF de origem, quando conhecida (só nos acordos do lançamento) */
  origin?: string;
}

export interface PartnerCategoryInfo {
  id: PartnerCategory;
  /** Rótulo da etiqueta do card */
  label: string;
  /** Rótulo dos contadores e filtros, no singular e no plural */
  singular: string;
  plural: string;
  /**
   * Mesmas cores dos pilares da ponte do Quem Somos: órgão público = poder público (azul),
   * ensino = instituições de ensino (amarelo), empresas = empresas (verde-petróleo)...
   */
  accent: SectionAccent;
}

/** Ordem de exibição dos contadores e filtros */
export const PARTNER_CATEGORIES: readonly PartnerCategoryInfo[] = [
  { id: 'government', label: 'Órgão público', singular: 'órgão público', plural: 'órgãos públicos', accent: BRAND_ACCENTS.azul },
  {
    id: 'educational_institution',
    label: 'Instituição de ensino',
    singular: 'instituição de ensino',
    plural: 'instituições de ensino',
    accent: BRAND_ACCENTS.amarelo,
  },
  { id: 'company', label: 'Empresa', singular: 'empresa', plural: 'empresas', accent: BRAND_ACCENTS.verdePetroleo },
  { id: 'startup', label: 'Startup', singular: 'startup', plural: 'startups', accent: BRAND_ACCENTS.verde },
  {
    id: 'support_entity',
    label: 'Entidade de apoio',
    singular: 'entidade de apoio',
    plural: 'entidades de apoio',
    accent: BRAND_ACCENTS.verdeOliva,
  },
  { id: 'other', label: 'Outro', singular: 'outro parceiro', plural: 'outros parceiros', accent: BRAND_ACCENTS.verdeClaro },
];

export const PARTNER_CATEGORY_INFO = Object.fromEntries(
  PARTNER_CATEGORIES.map((category) => [category.id, category])
) as Record<PartnerCategory, PartnerCategoryInfo>;

export interface PartnerCategoryCount {
  category: PartnerCategoryInfo;
  count: number;
}

/** Quantos parceiros há em cada categoria, só as que têm algum, na ordem de PARTNER_CATEGORIES */
export function countPartnersByCategory(partners: readonly Partner[]): PartnerCategoryCount[] {
  return PARTNER_CATEGORIES.map((category) => ({
    category,
    count: partners.filter((partner) => partner.category === category.id).length,
  })).filter((item) => item.count > 0);
}

/** Sigla do parceiro para o selo sem logo: uma sigla do nome (UNDB, IFMA) ou as iniciais */
export function partnerInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const acronym = words.find((word) => /^[A-ZÀ-Ý]{2,5}$/.test(word));
  if (acronym) return acronym;
  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('');
}

/**
 * PROVISÓRIO: enquanto nenhum parceiro for cadastrado no painel, o site mostra os quatro
 * acordos firmados no lançamento do Parque (17/03/2026, notícia oficial da Prefeitura).
 * As categorias seguem a API: o Porto Digital é uma associação gestora de parque
 * tecnológico (entidade de apoio) e a Casa Azul Ventures é uma venture builder (empresa).
 */
export const LAUNCH_PARTNERS: readonly Partner[] = [
  {
    id: 'acordo-porto-digital',
    name: 'Porto Digital',
    category: 'support_entity',
    origin: 'Recife (PE)',
    shortDescription: 'Troca de experiências e metodologias de parques tecnológicos.',
    description:
      'Protocolo de intenções firmado no lançamento do Parque para a troca de experiências e metodologias. O Porto Digital é um dos principais parques tecnológicos do país.',
    logoUrl: logoPortoDigital,
  },
  {
    id: 'acordo-casa-azul',
    name: 'Casa Azul Ventures',
    category: 'company',
    origin: 'Fortaleza (CE)',
    shortDescription: 'Aceleração de startups e conexão com investidores.',
    description:
      'Acordo de cooperação técnica firmado no lançamento do Parque para estruturar a aceleração de startups e a conexão com investidores.',
    logoUrl: logoCasaAzul,
  },
  {
    id: 'acordo-undb',
    name: 'Centro Universitário UNDB',
    category: 'educational_institution',
    origin: 'São Luís (MA)',
    shortDescription: 'Cooperação técnica em soluções digitais inovadoras.',
    description:
      'Acordo de cooperação técnica firmado no lançamento do Parque para o desenvolvimento de soluções digitais inovadoras.',
    logoUrl: logoUndb,
  },
  {
    id: 'acordo-ifma',
    name: 'IFMA',
    category: 'educational_institution',
    origin: 'Maranhão',
    shortDescription: 'Apoio a startups e iniciativas de inovação.',
    description:
      'Convênio firmado no lançamento do Parque com o Instituto Federal do Maranhão para apoiar startups e iniciativas de inovação.',
    logoUrl: logoIfma,
  },
];
