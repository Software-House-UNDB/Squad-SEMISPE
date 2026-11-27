import { type SectionAccent } from './brand.model';

/** Foto de um evento real do Parque, com a legenda que diz de onde ela é */
export interface EventPhoto {
  src: string;
  alt: string;
  /** Evento e data (ex.: "Global Game Jam · jan/2026") */
  caption: string;
}

/** Dado rápido da abertura (gestão, sede, lançamento) */
export interface KeyFact {
  id: 'gestao' | 'sede' | 'lancamento';
  label: string;
  value: string;
  accent: SectionAccent;
}

/** Atalho da abertura para uma seção da própria página */
export interface PageAnchor {
  /** id da seção de destino */
  id: string;
  label: string;
  accent: SectionAccent;
}

export interface QuemSomosIntro {
  /** Título principal; `titleHighlight` vem logo depois, destacado em azul */
  title: string;
  titleHighlight: string;
  /** O que é o Parque */
  lead: string;
  /** História curta do Trapiche Santo Ângelo e do Parque */
  history: string;
  photo: EventPhoto;
  facts: readonly KeyFact[];
  anchors: readonly PageAnchor[];
}

export interface Statement {
  id: 'missao' | 'visao';
  title: string;
  text: string;
  accent: SectionAccent;
}

export interface ValueItem {
  id: 'colaboracao' | 'inovacao' | 'sustentabilidade' | 'inclusao' | 'patrimonio';
  title: string;
  description: string;
  accent: SectionAccent;
}

/** Pilar da ponte do ecossistema: um dos cinco atores do modelo de quíntupla hélice */
export interface BridgePillar {
  id: 'poder-publico' | 'ensino' | 'empresas' | 'pessoas' | 'meio-ambiente';
  label: string;
  description: string;
  accent: SectionAccent;
}

/**
 * O ecossistema como uma ponte: leva de um lado (`from`) ao outro (`to`)
 * e se sustenta nos cinco pilares.
 */
export interface EcosystemBridge {
  title: string;
  text: string;
  /** Nota curta que liga a metáfora ao termo oficial (quíntupla hélice) */
  note: string;
  from: string;
  to: string;
  pillars: readonly BridgePillar[];
}

/** Frente de atuação do Parque, ilustrada com a foto de um evento real */
export interface ProgramArea {
  id: 'maratonas' | 'formacao' | 'incubacao' | 'conexao';
  title: string;
  description: string;
  accent: SectionAccent;
  photo: EventPhoto;
}

/** Meta anunciada no lançamento do Parque */
export interface Goal {
  id: string;
  /** Número em destaque (ex.: "30", "R$ 50") */
  value: string;
  /** Unidade depois do número, em destaque verde (ex.: "mil", "mi") */
  unit?: string;
  label: string;
  accent: SectionAccent;
}

/** Acordo ou convênio firmado com um parceiro */
export interface Agreement {
  id: string;
  partner: string;
  /** Cidade ou estado do parceiro */
  origin: string;
  description: string;
  /** Logomarca do parceiro (imagem local) */
  logo: string;
}

export interface QuemSomosContent {
  intro: QuemSomosIntro;
  statements: readonly Statement[];
  values: readonly ValueItem[];
  bridge: EcosystemBridge;
  programs: readonly ProgramArea[];
  goals: readonly Goal[];
  agreements: readonly Agreement[];
  estrutura: {
    title: string;
    text: string;
    photo: Omit<EventPhoto, 'caption'>;
  };
}
