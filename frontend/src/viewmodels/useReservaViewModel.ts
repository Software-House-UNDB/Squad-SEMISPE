import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type Space } from '../models/space.model';
import {
  ACCEPTED_FILE_EXTENSIONS,
  DEFAULT_EQUIPMENT,
  EVENT_TYPES,
  MAX_FILE_SIZE,
  type RequesterType,
  type ReservationFiles,
  type ReservationRequest,
} from '../models/reservation.model';
import { submitReservation } from '../services/reservations.service';
import {
  formatCnpj,
  formatCpf,
  formatFileSize,
  formatLongDate,
  formatPhone,
  formatTime,
  fromIsoDate,
  minutesToTime,
  onlyDigits,
  timeToMinutes,
  toIsoDate,
} from '../utils/formatters';
import { isValidCnpj, isValidCpf, isValidEmail, isValidPhone } from '../utils/validators';
import { cleanInstitution, cleanName, cleanShortAnswer, extractEmail, looksLikeName } from '../utils/answerCleanup';
import { BUSINESS_HOURS, OPENING_HOURS } from './useEstruturaViewModel';

export type ReservaStage = 'dados' | 'reserva' | 'documentos' | 'revisao';

export type ReservaStepId =
  | 'nome'
  | 'email'
  | 'telefone'
  | 'tipoSolicitante'
  | 'instituicao'
  | 'cnpj'
  | 'cpf'
  | 'espaco'
  | 'data'
  | 'inicio'
  | 'termino'
  | 'participantes'
  | 'capacidade'
  | 'tipoEvento'
  | 'tipoEventoOutro'
  | 'equipamentos'
  | 'apoioTi'
  | 'assunto'
  | 'oficio'
  | 'projeto'
  | 'apresentacao'
  | 'pauta';

/** Valor de uma resposta: texto, número, sim/não, lista ou arquivo (null = anexo pulado) */
export type AnswerValue = string | number | boolean | string[] | File | null;

type Answers = Partial<Record<ReservaStepId, AnswerValue>>;

export interface ChoiceOption {
  value: string;
  label: string;
}

/** Campo que responde a pergunta atual, na base do chat */
export type ReservaInput =
  | {
      kind: 'text';
      type: 'text' | 'email' | 'tel';
      placeholder: string;
      maxLength?: number;
      autoComplete?: string;
      inputMode?: 'text' | 'email' | 'tel' | 'numeric';
      /** Máscara aplicada enquanto a pessoa digita */
      format?: (value: string) => string;
    }
  | { kind: 'textarea'; placeholder: string; maxLength: number }
  | { kind: 'number'; placeholder: string }
  | { kind: 'choice'; options: readonly ChoiceOption[] }
  | { kind: 'space'; spaces: readonly Space[]; suggested: Space | null }
  | { kind: 'date'; min: string; hint: string }
  | { kind: 'time'; slots: readonly string[]; hint: string }
  | { kind: 'multi'; options: readonly string[]; noneLabel: string }
  | { kind: 'file'; required: boolean; skipLabel: string | null; accept: string; hint: string };

interface StepContext {
  answers: Answers;
  spaces: readonly Space[];
  suggestedSpace: Space | null;
  /** Hoje, em AAAA-MM-DD */
  today: string;
  /** Agora, em minutos desde a meia-noite */
  nowMinutes: number;
}

type Validation = { ok: true; value: AnswerValue } | { ok: false; error: string };

interface StepDef {
  id: ReservaStepId;
  stage: Exclude<ReservaStage, 'revisao'>;
  /** Rótulo curto da resposta no resumo */
  label: string;
  isActive?: (ctx: StepContext) => boolean;
  /** Mensagens do assistente que fazem a pergunta */
  prompts: (ctx: StepContext) => string[];
  input: (ctx: StepContext) => ReservaInput;
  validate: (raw: AnswerValue, ctx: StepContext) => Validation;
  /** Texto da resposta no balão e no resumo */
  display: (value: AnswerValue, ctx: StepContext) => string;
  /** Converte a resposta salva de volta para o valor do campo, ao editar */
  toRaw?: (value: AnswerValue) => AnswerValue;
  /** Passos cuja mudança obriga a conferir esta resposta de novo */
  dependsOn?: readonly ReservaStepId[];
  /** Pergunta de novo sempre que um passo de dependsOn muda, mesmo com a resposta ainda válida */
  resetWithDependencies?: boolean;
  /** Fica fora do resumo final */
  hiddenInSummary?: boolean;
}

const SLOT_MINUTES = 30;
const FILE_HINT = 'PDF, Word, PowerPoint ou imagem, com até 10 MB.';
const SCHEDULE_HINT = `Funcionamento: ${OPENING_HOURS.map((item) => `${item.days.toLowerCase()}, das ${item.hours}`).join('; ')}.`;
const REASK_MESSAGE = 'Com essa alteração, preciso confirmar de novo:';
const REVIEW_INTRO = 'Pronto! Confira o resumo da sua solicitação. Se precisar, use “Editar” para corrigir qualquer resposta.';

const STAGES: readonly { id: ReservaStage; label: string }[] = [
  { id: 'dados', label: 'Seus dados' },
  { id: 'reserva', label: 'Reserva' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'revisao', label: 'Revisão' },
];

const text = (value: AnswerValue | undefined) => (typeof value === 'string' ? value : '');
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const ok = (value: AnswerValue): Validation => ({ ok: true, value });
const fail = (error: string): Validation => ({ ok: false, error });

const selectedSpace = (ctx: StepContext) => ctx.spaces.find((space) => space.id === ctx.answers.espaco) ?? null;

/** O chat oferece os equipamentos do espaço; sem lista própria, os do formulário atual */
const equipmentFor = (space: Space | null) =>
  space && space.equipment.length > 0 ? space.equipment : DEFAULT_EQUIPMENT;

const hoursOn = (isoDate: string) => BUSINESS_HOURS[fromIsoDate(isoDate).getDay()] ?? null;

/** Horários de início dentro do funcionamento do dia; hoje, só os que ainda não passaram */
function startSlots(ctx: StepContext): string[] {
  const date = text(ctx.answers.data);
  const hours = date ? hoursOn(date) : null;
  if (!hours) return [];
  const earliest = date === ctx.today ? ctx.nowMinutes : 0;
  const slots: string[] = [];
  for (let minutes = hours.open; minutes <= hours.close - SLOT_MINUTES; minutes += SLOT_MINUTES) {
    if (minutes > earliest) slots.push(minutesToTime(minutes));
  }
  return slots;
}

/** Horários de término depois do início, até o fechamento do dia */
function endSlots(ctx: StepContext): string[] {
  const date = text(ctx.answers.data);
  const start = text(ctx.answers.inicio);
  const hours = date ? hoursOn(date) : null;
  if (!hours || !start) return [];
  const slots: string[] = [];
  for (let minutes = timeToMinutes(start) + SLOT_MINUTES; minutes <= hours.close; minutes += SLOT_MINUTES) {
    slots.push(minutesToTime(minutes));
  }
  return slots;
}

function validateChoice(raw: AnswerValue, options: readonly ChoiceOption[]): Validation {
  return options.some((option) => option.value === raw) ? ok(raw) : fail('Escolha uma das opções.');
}

const labelOf = (options: readonly ChoiceOption[], value: AnswerValue) =>
  options.find((option) => option.value === value)?.label ?? text(value);

function validateFile(raw: AnswerValue, required: boolean): Validation {
  if (raw === null) return required ? fail('O ofício é obrigatório. Escolha o arquivo para continuar.') : ok(null);
  if (!(raw instanceof File)) return fail('Escolha um arquivo.');
  const extension = raw.name.slice(raw.name.lastIndexOf('.')).toLowerCase();
  if (!ACCEPTED_FILE_EXTENSIONS.includes(extension)) {
    return fail('Formato não aceito. Envie PDF, Word, PowerPoint ou imagem (JPG ou PNG).');
  }
  if (raw.size > MAX_FILE_SIZE) return fail('O arquivo passa de 10 MB. Envie uma versão menor.');
  return ok(raw);
}

const fileLabel = (value: AnswerValue, emptyLabel: string) =>
  value instanceof File ? `${value.name} (${formatFileSize(value.size)})` : emptyLabel;

const fileInput = (required: boolean, skipLabel: string | null): ReservaInput => ({
  kind: 'file',
  required,
  skipLabel,
  accept: ACCEPTED_FILE_EXTENSIONS.join(','),
  hint: FILE_HINT,
});

const REQUESTER_OPTIONS: readonly ChoiceOption[] = [
  { value: 'instituicao', label: 'Instituição' },
  { value: 'pessoa-fisica', label: 'Pessoa física' },
];

const EVENT_OPTIONS: readonly ChoiceOption[] = EVENT_TYPES.map((type) => ({ value: type, label: type }));

const CAPACITY_OPTIONS: readonly ChoiceOption[] = [
  { value: 'seguir', label: 'Seguir assim mesmo' },
  { value: 'trocar', label: 'Trocar de espaço' },
];

const YES_NO_OPTIONS: readonly ChoiceOption[] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
];

/** Roteiro do chat, na ordem em que as perguntas são feitas */
const STEPS: readonly StepDef[] = [
  {
    id: 'nome',
    stage: 'dados',
    label: 'Nome',
    prompts: () => [
      'Olá! Sou o assistente de reservas do Parque Tecnológico de São Luís. Vou fazer algumas perguntas para montar a sua solicitação. Leva poucos minutos.',
      'Para começar, qual é o seu nome completo? Escreva só o nome.',
    ],
    input: () => ({ kind: 'text', type: 'text', placeholder: 'Ex.: Maria Silva', maxLength: 120, autoComplete: 'name' }),
    validate: (raw) => {
      // "meu nome é vitor cruz" vira "Vitor Cruz"; o que ainda parecer frase é recusado
      const name = cleanName(text(raw));
      if (!looksLikeName(name)) return fail('Digite só o seu nome completo, por exemplo: Maria Silva.');
      return name.split(' ').length >= 2 && name.length >= 5 ? ok(name) : fail('Digite o nome completo, com sobrenome.');
    },
    display: (value) => text(value),
  },
  {
    id: 'email',
    stage: 'dados',
    label: 'E-mail',
    prompts: (ctx) => [
      `Prazer, ${text(ctx.answers.nome).split(' ')[0]}! Qual é o seu e-mail? É por ele que a SEMISPE vai responder.`,
    ],
    input: () => ({
      kind: 'text',
      type: 'email',
      placeholder: 'Ex.: nome@exemplo.com',
      maxLength: 254,
      autoComplete: 'email',
      inputMode: 'email',
    }),
    validate: (raw) => {
      // "meu e-mail é Vitor@Gmail.com." vira "vitor@gmail.com"
      const email = extractEmail(text(raw));
      return isValidEmail(email) ? ok(email) : fail('Esse e-mail não parece válido. Confira e tente de novo.');
    },
    display: (value) => text(value),
  },
  {
    id: 'telefone',
    stage: 'dados',
    label: 'Telefone',
    prompts: () => ['E um telefone com DDD para contato?'],
    input: () => ({
      kind: 'text',
      type: 'tel',
      placeholder: '(98) 99999-9999',
      autoComplete: 'tel',
      inputMode: 'tel',
      format: formatPhone,
    }),
    validate: (raw) =>
      isValidPhone(text(raw)) ? ok(onlyDigits(text(raw))) : fail('Informe o telefone com DDD, por exemplo (98) 99999-9999.'),
    display: (value) => formatPhone(text(value)),
  },
  {
    id: 'tipoSolicitante',
    stage: 'dados',
    label: 'Solicitante',
    prompts: () => ['A reserva é em nome de uma instituição ou sua, como pessoa física?'],
    input: () => ({ kind: 'choice', options: REQUESTER_OPTIONS }),
    validate: (raw) => validateChoice(raw, REQUESTER_OPTIONS),
    display: (value) => labelOf(REQUESTER_OPTIONS, value),
  },
  {
    id: 'instituicao',
    stage: 'dados',
    label: 'Instituição',
    isActive: (ctx) => ctx.answers.tipoSolicitante === 'instituicao',
    prompts: () => ['Qual é o nome da instituição?'],
    input: () => ({
      kind: 'text',
      type: 'text',
      placeholder: 'Ex.: Universidade Federal do Maranhão',
      maxLength: 150,
      autoComplete: 'organization',
    }),
    validate: (raw) => {
      // "trabalho na UFMA." vira "UFMA"
      const name = cleanInstitution(text(raw));
      return name.length >= 2 ? ok(name) : fail('Informe o nome da instituição.');
    },
    display: (value) => text(value),
  },
  {
    id: 'cnpj',
    stage: 'dados',
    label: 'CNPJ',
    isActive: (ctx) => ctx.answers.tipoSolicitante === 'instituicao',
    prompts: () => ['E o CNPJ da instituição?'],
    input: () => ({
      kind: 'text',
      type: 'text',
      placeholder: '00.000.000/0000-00',
      inputMode: 'numeric',
      format: formatCnpj,
    }),
    validate: (raw) => (isValidCnpj(text(raw)) ? ok(onlyDigits(text(raw))) : fail('Esse CNPJ não é válido. Confira os números.')),
    display: (value) => formatCnpj(text(value)),
  },
  {
    id: 'cpf',
    stage: 'dados',
    label: 'CPF',
    isActive: (ctx) => ctx.answers.tipoSolicitante === 'pessoa-fisica',
    prompts: () => ['Qual é o seu CPF?'],
    input: () => ({ kind: 'text', type: 'text', placeholder: '000.000.000-00', inputMode: 'numeric', format: formatCpf }),
    validate: (raw) => (isValidCpf(text(raw)) ? ok(onlyDigits(text(raw))) : fail('Esse CPF não é válido. Confira os números.')),
    display: (value) => formatCpf(text(value)),
  },
  {
    id: 'espaco',
    stage: 'reserva',
    label: 'Espaço',
    prompts: (ctx) => {
      const suggested = ctx.suggestedSpace;
      if (!suggested) return ['Agora vamos à reserva. Qual espaço você quer reservar?'];
      const capacity = suggested.capacity ? `, para até ${suggested.capacity} pessoas` : '';
      return [`Agora vamos à reserva. Você escolheu o espaço ${suggested.name}${capacity}. Seguimos com ele?`];
    },
    input: (ctx) => ({ kind: 'space', spaces: ctx.spaces, suggested: ctx.suggestedSpace }),
    validate: (raw, ctx) => {
      const space = ctx.spaces.find((item) => item.id === Number(raw));
      return space ? ok(space.id) : fail('Escolha um dos espaços.');
    },
    display: (value, ctx) => ctx.spaces.find((space) => space.id === value)?.name ?? '',
  },
  {
    id: 'data',
    stage: 'reserva',
    label: 'Data',
    prompts: () => ['Para qual data?'],
    input: (ctx) => ({ kind: 'date', min: ctx.today, hint: SCHEDULE_HINT }),
    validate: (raw, ctx) => {
      const date = text(raw);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('Escolha uma data.');
      if (date < ctx.today) return fail('Escolha uma data a partir de hoje.');
      if (!hoursOn(date)) return fail('O Parque não funciona aos sábados e domingos. Escolha um dia de segunda a sexta.');
      if (startSlots({ ...ctx, answers: { ...ctx.answers, data: date } }).length === 0) {
        return fail('Hoje não há mais horários disponíveis. Escolha outra data.');
      }
      return ok(date);
    },
    display: (value) => capitalize(formatLongDate(text(value))),
  },
  {
    id: 'inicio',
    stage: 'reserva',
    label: 'Início',
    dependsOn: ['data'],
    prompts: () => ['Que horas começa?'],
    input: (ctx) => {
      const hours = hoursOn(text(ctx.answers.data));
      const hint = hours
        ? `Nesse dia o Parque funciona das ${formatTime(minutesToTime(hours.open))} às ${formatTime(minutesToTime(hours.close))}.`
        : SCHEDULE_HINT;
      return { kind: 'time', slots: startSlots(ctx), hint };
    },
    validate: (raw, ctx) => (startSlots(ctx).includes(text(raw)) ? ok(raw) : fail('Escolha um dos horários disponíveis.')),
    display: (value) => formatTime(text(value)),
  },
  {
    id: 'termino',
    stage: 'reserva',
    label: 'Término',
    dependsOn: ['data', 'inicio'],
    prompts: () => ['E que horas termina?'],
    input: (ctx) => ({ kind: 'time', slots: endSlots(ctx), hint: 'O término precisa ser depois do início, dentro do funcionamento.' }),
    validate: (raw, ctx) => (endSlots(ctx).includes(text(raw)) ? ok(raw) : fail('Escolha um dos horários disponíveis.')),
    display: (value) => formatTime(text(value)),
  },
  {
    id: 'participantes',
    stage: 'reserva',
    label: 'Participantes',
    prompts: () => ['Quantas pessoas devem participar?'],
    input: () => ({ kind: 'number', placeholder: 'Número de participantes' }),
    validate: (raw) => {
      const count = Number(raw);
      return Number.isInteger(count) && count >= 1 && count <= 100_000
        ? ok(count)
        : fail('Informe o número de participantes, só com algarismos.');
    },
    display: (value, ctx) => {
      const count = Number(value);
      const capacity = selectedSpace(ctx)?.capacity;
      const over = capacity && count > capacity ? ' (acima da capacidade do espaço)' : '';
      return `${count} ${count === 1 ? 'pessoa' : 'pessoas'}${over}`;
    },
  },
  {
    // A reserva passa por aprovação: acima da capacidade, sugere trocar de espaço mas deixa seguir
    id: 'capacidade',
    stage: 'reserva',
    label: 'Capacidade',
    isActive: (ctx) => {
      const capacity = selectedSpace(ctx)?.capacity;
      return Boolean(capacity && Number(ctx.answers.participantes) > capacity);
    },
    dependsOn: ['espaco', 'participantes'],
    resetWithDependencies: true,
    hiddenInSummary: true,
    prompts: (ctx) => {
      const space = selectedSpace(ctx);
      return [
        `O espaço ${space?.name} comporta até ${space?.capacity} pessoas, e você informou ${Number(ctx.answers.participantes)}. Como a solicitação ainda passa por aprovação, você pode seguir assim mesmo ou trocar de espaço.`,
      ];
    },
    input: () => ({ kind: 'choice', options: CAPACITY_OPTIONS }),
    validate: (raw) => validateChoice(raw, CAPACITY_OPTIONS),
    display: (value) => labelOf(CAPACITY_OPTIONS, value),
  },
  {
    id: 'tipoEvento',
    stage: 'reserva',
    label: 'Tipo de evento',
    prompts: () => ['Qual é o tipo de evento?'],
    input: () => ({ kind: 'choice', options: EVENT_OPTIONS }),
    validate: (raw) => validateChoice(raw, EVENT_OPTIONS),
    display: (value) => text(value),
  },
  {
    id: 'tipoEventoOutro',
    stage: 'reserva',
    label: 'Qual tipo',
    isActive: (ctx) => ctx.answers.tipoEvento === 'Outro',
    prompts: () => ['Qual seria o tipo de evento?'],
    input: () => ({ kind: 'text', type: 'text', placeholder: 'Ex.: feira, exposição, lançamento', maxLength: 60 }),
    validate: (raw) => {
      // "é uma feira de inovação." vira "Feira de inovação"
      const type = cleanShortAnswer(text(raw));
      return type.length >= 3 ? ok(type) : fail('Conte qual é o tipo de evento.');
    },
    display: (value) => text(value),
  },
  {
    id: 'equipamentos',
    stage: 'reserva',
    label: 'Equipamentos',
    dependsOn: ['espaco'],
    prompts: () => ['Vai precisar de algum equipamento?'],
    input: (ctx) => ({
      kind: 'multi',
      options: equipmentFor(selectedSpace(ctx)),
      noneLabel: 'Não preciso de equipamentos',
    }),
    validate: (raw, ctx) => {
      const options = equipmentFor(selectedSpace(ctx));
      return Array.isArray(raw) && raw.every((item) => options.includes(item))
        ? ok(raw)
        : fail('Escolha os equipamentos da lista.');
    },
    display: (value) => (Array.isArray(value) && value.length > 0 ? value.join(', ') : 'Nenhum equipamento'),
  },
  {
    id: 'apoioTi',
    stage: 'reserva',
    label: 'Apoio de TI',
    prompts: () => ['Precisa de apoio da equipe de TI durante o evento?'],
    input: () => ({ kind: 'choice', options: YES_NO_OPTIONS }),
    validate: (raw) => {
      const result = validateChoice(raw, YES_NO_OPTIONS);
      return result.ok ? ok(raw === 'sim') : result;
    },
    display: (value) => (value ? 'Sim' : 'Não'),
    toRaw: (value) => (value ? 'sim' : 'nao'),
  },
  {
    id: 'assunto',
    stage: 'reserva',
    label: 'Assunto',
    prompts: () => ['Descreva em poucas linhas o assunto ou o objetivo do evento.'],
    input: () => ({
      kind: 'textarea',
      placeholder: 'Ex.: Reunião de alinhamento do projeto com as empresas parceiras',
      maxLength: 1000,
    }),
    validate: (raw) => {
      const subject = text(raw).trim();
      return subject.length >= 10 ? ok(subject) : fail('Conte um pouco mais sobre o evento (pelo menos 10 caracteres).');
    },
    display: (value) => text(value),
  },
  {
    id: 'oficio',
    stage: 'documentos',
    label: 'Ofício',
    prompts: () => ['Agora os documentos. Envie o ofício da solicitação.'],
    input: () => fileInput(true, null),
    validate: (raw) => validateFile(raw, true),
    display: (value) => fileLabel(value, ''),
  },
  {
    id: 'projeto',
    stage: 'documentos',
    label: 'Projeto',
    prompts: () => ['Quer anexar o projeto do evento?'],
    input: () => fileInput(false, 'Pular'),
    validate: (raw) => validateFile(raw, false),
    display: (value) => fileLabel(value, 'Sem projeto anexado'),
  },
  {
    id: 'apresentacao',
    stage: 'documentos',
    label: 'Apresentação',
    prompts: () => ['E a apresentação?'],
    input: () => fileInput(false, 'Pular'),
    validate: (raw) => validateFile(raw, false),
    display: (value) => fileLabel(value, 'Sem apresentação anexada'),
  },
  {
    id: 'pauta',
    stage: 'documentos',
    label: 'Pauta',
    prompts: () => ['Tem a pauta do evento?'],
    input: () => fileInput(false, 'Não possui pauta definida'),
    validate: (raw) => validateFile(raw, false),
    display: (value) => fileLabel(value, 'Não possui pauta definida'),
  },
];

const stepById = (id: ReservaStepId) => STEPS.find((step) => step.id === id) as StepDef;
const isStepActive = (step: StepDef, ctx: StepContext) => !step.isActive || step.isActive(ctx);

const sameValue = (a: AnswerValue | undefined, b: AnswerValue) =>
  Array.isArray(a) && Array.isArray(b) ? a.join('\u0000') === b.join('\u0000') : a === b;

/**
 * Depois de mudar `changed`, apaga as respostas que dependem dela e deixaram de
 * valer (ex.: horário fora do funcionamento do novo dia). Devolve o que apagou.
 */
function invalidateDependents(changed: ReservaStepId, next: Answers, ctx: StepContext): ReservaStepId[] {
  const removed: ReservaStepId[] = [];
  const queue: ReservaStepId[] = [changed];
  while (queue.length > 0) {
    const id = queue.shift() as ReservaStepId;
    for (const step of STEPS) {
      const value = next[step.id];
      if (!step.dependsOn?.includes(id) || value === undefined) continue;
      const stillValid = !step.resetWithDependencies && step.validate(value, { ...ctx, answers: next }).ok;
      if (!stillValid) {
        delete next[step.id];
        removed.push(step.id);
        queue.push(step.id);
      }
    }
  }
  return removed;
}

function buildRequest(answers: Answers, consent: boolean): { request: ReservationRequest; files: ReservationFiles } {
  const type = answers.tipoSolicitante as RequesterType;
  const eventType = text(answers.tipoEvento);
  const fileOrNull = (value: AnswerValue | undefined) => (value instanceof File ? value : null);

  return {
    request: {
      requester: {
        name: text(answers.nome),
        email: text(answers.email),
        phone: text(answers.telefone),
        type,
        institution: type === 'instituicao' ? text(answers.instituicao) : null,
        document: type === 'instituicao' ? text(answers.cnpj) : text(answers.cpf),
      },
      spaceId: Number(answers.espaco),
      date: text(answers.data),
      startTime: text(answers.inicio),
      endTime: text(answers.termino),
      participants: Number(answers.participantes),
      eventType: eventType === 'Outro' ? text(answers.tipoEventoOutro) : eventType,
      equipment: Array.isArray(answers.equipamentos) ? answers.equipamentos : [],
      needsItSupport: answers.apoioTi === true,
      subject: text(answers.assunto),
      consent,
    },
    files: {
      oficio: answers.oficio as File,
      projeto: fileOrNull(answers.projeto),
      apresentacao: fileOrNull(answers.apresentacao),
      pauta: fileOrNull(answers.pauta),
    },
  };
}

/** Pergunta respondida pelo campo da base do chat: a pendente ou uma resposta em edição */
export interface ComposerStep {
  id: ReservaStepId;
  label: string;
  /** Última mensagem da pergunta, usada como rótulo acessível do campo */
  question: string;
  input: ReservaInput;
  /** Resposta atual, no formato do campo (só ao editar) */
  initial: AnswerValue | undefined;
}

export interface ReservaViewModel {
  stages: readonly { id: ReservaStage; label: string; state: 'done' | 'current' | 'todo' }[];
  /** Perguntas já respondidas, na ordem em que foram respondidas */
  transcript: readonly { id: ReservaStepId; messages: string[]; answer: string; isEditing: boolean }[];
  /** Mensagens novas do assistente, ao pé da conversa; `key` muda a cada nova leva */
  pending: { key: string; messages: string[] } | null;
  phase: 'perguntas' | 'revisao' | 'enviado';
  composer: ComposerStep | null;
  isEditing: boolean;
  reviewIntro: string;
  summary: readonly { stage: string; items: { id: ReservaStepId; label: string; value: string }[] }[];
  canEdit: boolean;
  error: string | null;
  consent: boolean;
  isSending: boolean;
  answer: (value: AnswerValue) => void;
  startEdit: (id: ReservaStepId) => void;
  cancelEdit: () => void;
  clearError: () => void;
  setConsent: (value: boolean) => void;
  submit: () => void;
  restart: () => void;
}

/** Chat de reserva: roteiro de perguntas, validação, edição das respostas e envio */
export function useReservaViewModel(spaces: readonly Space[]): ReservaViewModel {
  const [searchParams] = useSearchParams();
  const [answers, setAnswers] = useState<Answers>({});
  const [order, setOrder] = useState<ReservaStepId[]>([]);
  const [reasked, setReasked] = useState<ReservaStepId[]>([]);
  const [editing, setEditing] = useState<ReservaStepId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsentState] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Vindo do cartão de um espaço (?espaco=id), o chat já sugere esse espaço
  const suggestedSpace = spaces.find((space) => space.id === Number(searchParams.get('espaco'))) ?? null;

  const now = new Date();
  const ctx: StepContext = {
    answers,
    spaces,
    suggestedSpace,
    today: toIsoDate(now),
    nowMinutes: now.getHours() * 60 + now.getMinutes(),
  };

  const activeSteps = STEPS.filter((step) => isStepActive(step, ctx));
  const pendingStep = activeSteps.find((step) => answers[step.id] === undefined) ?? null;
  const phase = status === 'sent' ? 'enviado' : pendingStep ? 'perguntas' : 'revisao';
  const isSending = status === 'sending';
  const canEdit = phase !== 'enviado' && !isSending;

  const toComposer = (step: StepDef, isEdit: boolean): ComposerStep => {
    const messages = step.prompts(ctx);
    const saved = answers[step.id];
    return {
      id: step.id,
      label: step.label,
      question: messages[messages.length - 1],
      input: step.input(ctx),
      initial: isEdit && saved !== undefined ? (step.toRaw?.(saved) ?? saved) : undefined,
    };
  };

  let pending: ReservaViewModel['pending'] = null;
  if (phase === 'enviado') {
    pending = {
      key: 'enviado',
      messages: [
        `Solicitação enviada! A SEMISPE vai analisar o pedido e responder no e-mail ${text(answers.email)}.`,
        'Obrigado por escolher o Parque Tecnológico de São Luís.',
      ],
    };
  } else if (pendingStep) {
    const messages = pendingStep.prompts(ctx);
    pending = {
      key: `passo-${pendingStep.id}`,
      messages: reasked.includes(pendingStep.id) ? [REASK_MESSAGE, ...messages] : messages,
    };
  } else {
    pending = { key: 'revisao', messages: [REVIEW_INTRO] };
  }

  const editingStep = editing ? stepById(editing) : null;
  const composer = editingStep
    ? toComposer(editingStep, true)
    : phase === 'perguntas' && pendingStep
      ? toComposer(pendingStep, false)
      : null;

  const currentStage: ReservaStage = pendingStep?.stage ?? 'revisao';
  const currentIndex = phase === 'enviado' ? STAGES.length : STAGES.findIndex((stage) => stage.id === currentStage);
  const stages = STAGES.map((stage, index) => ({
    ...stage,
    state: index < currentIndex ? ('done' as const) : index === currentIndex ? ('current' as const) : ('todo' as const),
  }));

  const transcript = order
    .map(stepById)
    .filter((step) => isStepActive(step, ctx) && answers[step.id] !== undefined)
    .map((step) => ({
      id: step.id,
      messages: step.prompts(ctx),
      answer: step.display(answers[step.id] as AnswerValue, ctx),
      isEditing: editing === step.id,
    }));

  const summary = STAGES.filter((stage) => stage.id !== 'revisao').map((stage) => ({
    stage: stage.label,
    items: activeSteps
      .filter((step) => step.stage === stage.id && !step.hiddenInSummary && answers[step.id] !== undefined)
      .map((step) => ({ id: step.id, label: step.label, value: step.display(answers[step.id] as AnswerValue, ctx) })),
  }));

  const answer = (raw: AnswerValue) => {
    const step = editingStep ?? pendingStep;
    if (!step || isSending) return;

    const result = step.validate(raw, ctx);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);

    // "Trocar de espaço" reabre a escolha do espaço no lugar da resposta antiga
    if (step.id === 'capacidade' && result.value === 'trocar') {
      setEditing('espaco');
      return;
    }

    const next: Answers = { ...answers, [step.id]: result.value };
    const removed = sameValue(answers[step.id], result.value) ? [] : invalidateDependents(step.id, next, ctx);

    setAnswers(next);
    setOrder((prev) => (prev.includes(step.id) ? prev : [...prev, step.id]).filter((id) => !removed.includes(id)));
    setReasked((prev) => [...prev.filter((id) => id !== step.id && !removed.includes(id)), ...removed]);
    setEditing(null);
  };

  const startEdit = (id: ReservaStepId) => {
    if (!canEdit) return;
    setEditing(id);
    setError(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setError(null);
  };

  const setConsent = (value: boolean) => {
    setConsentState(value);
    if (value) setError(null);
  };

  const submit = async () => {
    if (isSending || phase !== 'revisao') return;
    if (!consent) {
      setError('Para enviar, marque a autorização de uso dos dados.');
      return;
    }
    setStatus('sending');
    setError(null);
    try {
      const { request, files } = buildRequest(answers, consent);
      await submitReservation(request, files);
      setStatus('sent');
      setEditing(null);
    } catch {
      setStatus('idle');
      setError('Não foi possível enviar a solicitação. Tente de novo em instantes.');
    }
  };

  const restart = () => {
    setAnswers({});
    setOrder([]);
    setReasked([]);
    setEditing(null);
    setError(null);
    setConsentState(false);
    setStatus('idle');
  };

  return {
    stages,
    transcript,
    pending,
    phase,
    composer,
    isEditing: editing !== null,
    reviewIntro: REVIEW_INTRO,
    summary,
    canEdit,
    error,
    consent,
    isSending,
    answer,
    startEdit,
    cancelEdit,
    clearError: () => setError(null),
    setConsent,
    submit: () => void submit(),
    restart,
  };
}
