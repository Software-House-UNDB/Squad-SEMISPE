/** Quem solicita a reserva: decide se o documento pedido é CPF ou CNPJ */
export type RequesterType = 'pessoa-fisica' | 'instituicao';

/**
 * Solicitação de reserva enviada ao backend (formato proposto para o endpoint
 * de reservas, que ainda não existe). Os arquivos vão juntos, em multipart.
 */
export interface ReservationRequest {
  requester: {
    name: string;
    email: string;
    /** Só dígitos, com DDD */
    phone: string;
    type: RequesterType;
    /** Nome da instituição; null para pessoa física */
    institution: string | null;
    /** CPF (pessoa física) ou CNPJ (instituição), só dígitos */
    document: string;
  };
  spaceId: number;
  /** AAAA-MM-DD */
  date: string;
  /** HH:MM */
  startTime: string;
  endTime: string;
  participants: number;
  eventType: string;
  equipment: string[];
  needsItSupport: boolean;
  subject: string;
  /** Consentimento para o uso dos dados pessoais (LGPD) */
  consent: boolean;
}

export interface ReservationFiles {
  /** Ofício da solicitação (obrigatório) */
  oficio: File;
  projeto: File | null;
  apresentacao: File | null;
  pauta: File | null;
}

export const EVENT_TYPES: readonly string[] = [
  'Reunião',
  'Palestra',
  'Workshop/Curso',
  'Hackathon',
  'Evento institucional',
  'Outro',
];

/** Equipamentos do formulário atual de reservas, usados enquanto o espaço não tem a lista própria */
export const DEFAULT_EQUIPMENT: readonly string[] = [
  'Tela interativa 65"',
  'Caixa de som',
  'Microfones',
  'Câmera de videoconferência',
];

/** Formatos aceitos nos anexos: PDF, Word, PowerPoint e imagem */
export const ACCEPTED_FILE_EXTENSIONS: readonly string[] = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png'];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
