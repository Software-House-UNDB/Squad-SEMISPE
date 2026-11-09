export interface ImpactMetric {
  id: string;
  value: string;
  label: string;
  description?: string;
  
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
