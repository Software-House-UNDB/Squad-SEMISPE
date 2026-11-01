import { type SectionAccent } from './brand.model';

export interface EventHighlight {
  id: string;
  title: string;
  /** Data já formatada para exibição */
  date: string;
  /** Tipo do evento (Hackathon, Meetup, Workshop...) */
  category: string;
  /** Cor do slide enquanto não há foto, e do marcador da categoria */
  accent: SectionAccent;
  /** Foto do evento; sem ela o slide mostra uma arte provisória na cor do evento */
  image?: string;
  imageAlt?: string;
}
