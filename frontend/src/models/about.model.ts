export interface ImpactMetric {
  id: string;
  value: string;
  label: string;
  description?: string;
  /** Link do card para a seção relacionada (ex.: "Parceiros Estratégicos" → #parceiros) */
  link?: { href: string; label: string };
}

export interface AboutSectionData {
  badge?: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  resultsTitle?: string;
  resultsSubtitle?: string;
  metrics: ImpactMetric[];
}
