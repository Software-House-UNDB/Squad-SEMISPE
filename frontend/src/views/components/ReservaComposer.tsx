import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Paperclip, RotateCcw, SendHorizontal, X } from 'lucide-react';
import { type Space } from '../../models/space.model';
import { formatFileSize, formatTime } from '../../utils/formatters';
import { type AnswerValue, type ComposerStep, type ReservaInput } from '../../viewmodels/useReservaViewModel';

// Os formulários usam noValidate: quem valida é o chat, com as mensagens do assistente
// e a limpeza das respostas (a validação do navegador barraria "meu e-mail é x@y.com")
const fieldClass =
  'w-full min-w-0 rounded-xl bg-semispe-surface px-4 py-3 text-sm text-semispe-blue-dark placeholder:text-semispe-blue-dark/45 ring-1 ring-semispe-blue-dark/10 transition-shadow focus:outline-none focus:ring-2 focus:ring-semispe-blue-dark';

const sendButtonClass =
  'shrink-0 grid place-items-center w-12 h-12 rounded-xl bg-semispe-blue-dark text-white transition-colors hover:bg-semispe-yellow-light hover:text-semispe-blue-dark cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-semispe-blue-dark disabled:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark focus-visible:ring-offset-2';

const optionClass = (isSelected: boolean) =>
  `rounded-full px-4 py-2 text-sm font-bold ring-1 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark ${
    isSelected
      ? 'bg-semispe-yellow-light ring-semispe-yellow-light'
      : 'bg-white ring-semispe-blue-dark/20 hover:bg-semispe-yellow-soft hover:ring-semispe-yellow-light'
  }`;

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-semispe-blue-dark px-5 py-3 text-xs font-black tracking-wider uppercase text-white transition-colors hover:bg-semispe-yellow-light hover:text-semispe-blue-dark cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-semispe-blue-dark disabled:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark focus-visible:ring-offset-2';

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-black tracking-wider uppercase ring-1 ring-semispe-blue-dark/20 transition-colors hover:bg-semispe-blue-dark/5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark';

/**
 * Foca o campo quando a pergunta aparece, sem rolar a página. Só com mouse: no
 * celular o foco abriria o teclado sozinho, cobrindo a conversa.
 */
function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
}

interface FieldProps<T extends ReservaInput['kind']> {
  input: Extract<ReservaInput, { kind: T }>;
  question: string;
  initial: AnswerValue | undefined;
  onAnswer: (value: AnswerValue) => void;
  onChange: () => void;
}

function TextField({ input, question, initial, onAnswer, onChange }: FieldProps<'text'>) {
  const format = input.format ?? ((value: string) => value);
  const [value, setValue] = useState(typeof initial === 'string' ? format(initial) : '');
  const inputRef = useFocusOnMount<HTMLInputElement>();

  return (
    <form
      noValidate
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onAnswer(value);
      }}
    >
      <input
        ref={inputRef}
        type={input.type}
        value={value}
        onChange={(e) => {
          setValue(format(e.target.value));
          onChange();
        }}
        placeholder={input.placeholder}
        maxLength={input.maxLength}
        autoComplete={input.autoComplete}
        inputMode={input.inputMode}
        aria-label={question}
        className={fieldClass}
      />
      <button type="submit" disabled={!value.trim()} className={sendButtonClass} aria-label="Enviar resposta">
        <SendHorizontal className="w-5 h-5" aria-hidden="true" />
      </button>
    </form>
  );
}

function NumberField({ input, question, initial, onAnswer, onChange }: FieldProps<'number'>) {
  const [value, setValue] = useState(initial === undefined ? '' : String(initial));
  const inputRef = useFocusOnMount<HTMLInputElement>();

  return (
    <form
      noValidate
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onAnswer(value);
      }}
    >
      <input
        ref={inputRef}
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange();
        }}
        placeholder={input.placeholder}
        aria-label={question}
        className={fieldClass}
      />
      <button type="submit" disabled={!value} className={sendButtonClass} aria-label="Enviar resposta">
        <SendHorizontal className="w-5 h-5" aria-hidden="true" />
      </button>
    </form>
  );
}

function TextareaField({ input, question, initial, onAnswer, onChange }: FieldProps<'textarea'>) {
  const [value, setValue] = useState(typeof initial === 'string' ? initial : '');
  const textareaRef = useFocusOnMount<HTMLTextAreaElement>();

  return (
    <form
      noValidate
      className="flex gap-2 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        onAnswer(value);
      }}
    >
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onChange();
          }}
          rows={3}
          maxLength={input.maxLength}
          placeholder={input.placeholder}
          aria-label={question}
          className={`${fieldClass} resize-none`}
        />
        <p className="mt-1 text-right text-[11px] text-semispe-blue-dark/50">
          {value.length}/{input.maxLength}
        </p>
      </div>
      <button type="submit" disabled={!value.trim()} className={`${sendButtonClass} mb-5`} aria-label="Enviar resposta">
        <SendHorizontal className="w-5 h-5" aria-hidden="true" />
      </button>
    </form>
  );
}

function ChoiceField({ input, question, initial, onAnswer }: FieldProps<'choice'>) {
  return (
    <div role="group" aria-label={question} className="flex flex-wrap gap-2">
      {input.options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onAnswer(option.value)}
          aria-pressed={initial === option.value}
          className={optionClass(initial === option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SpaceOption({ space, isSelected, onPick }: { space: Space; isSelected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={isSelected}
      className={`flex flex-col items-start rounded-xl px-4 py-3 text-left ring-1 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark ${
        isSelected
          ? 'bg-semispe-yellow-light ring-semispe-yellow-light'
          : 'bg-white ring-semispe-blue-dark/15 hover:bg-semispe-yellow-soft hover:ring-semispe-yellow-light'
      }`}
    >
      <span className="text-sm font-black">{space.name}</span>
      <span className="text-xs text-semispe-blue-dark/70">
        {space.capacity ? `Até ${space.capacity} pessoas` : 'Capacidade a confirmar'}
      </span>
    </button>
  );
}

function SpaceField({ input, question, initial, onAnswer }: FieldProps<'space'>) {
  // Vindo do cartão de um espaço, a primeira opção é seguir com ele; a lista abre ao pedir outro
  const [showAll, setShowAll] = useState(!input.suggested || initial !== undefined);

  if (!showAll && input.suggested) {
    const suggested = input.suggested;
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onAnswer(suggested.id)} className={primaryButtonClass}>
          Seguir com {suggested.name}
        </button>
        <button type="button" onClick={() => setShowAll(true)} className={secondaryButtonClass}>
          Escolher outro espaço
        </button>
      </div>
    );
  }

  return (
    <div role="group" aria-label={question} className="grid gap-2 grid-cols-2 sm:grid-cols-3 max-h-56 overflow-y-auto p-0.5">
      {input.spaces.map((space) => (
        <SpaceOption key={space.id} space={space} isSelected={initial === space.id} onPick={() => onAnswer(space.id)} />
      ))}
    </div>
  );
}

function DateField({ input, question, initial, onAnswer, onChange }: FieldProps<'date'>) {
  const [value, setValue] = useState(typeof initial === 'string' ? initial : '');

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onAnswer(value);
      }}
    >
      <div className="flex gap-2">
        <input
          type="date"
          min={input.min}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onChange();
          }}
          aria-label={question}
          className={fieldClass}
        />
        <button type="submit" disabled={!value} className={sendButtonClass} aria-label="Confirmar data">
          <SendHorizontal className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2 text-xs text-semispe-blue-dark/60">{input.hint}</p>
    </form>
  );
}

function TimeField({ input, question, initial, onAnswer }: FieldProps<'time'>) {
  return (
    <div>
      <div role="group" aria-label={question} className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto p-0.5">
        {input.slots.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => onAnswer(slot)}
            aria-pressed={initial === slot}
            className={`${optionClass(initial === slot)} px-2`}
          >
            {formatTime(slot)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-semispe-blue-dark/60">{input.hint}</p>
    </div>
  );
}

function MultiField({ input, question, initial, onAnswer }: FieldProps<'multi'>) {
  const [selected, setSelected] = useState<string[]>(Array.isArray(initial) ? initial : []);
  // "Nenhum" é uma escolha explícita, para o botão de confirmar não valer sem resposta
  const [isNone, setIsNone] = useState(Array.isArray(initial) && initial.length === 0);

  const toggle = (option: string) => {
    setIsNone(false);
    setSelected((prev) => (prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]));
  };

  return (
    <div>
      <div role="group" aria-label={question} className="flex flex-wrap gap-2">
        {input.options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={isSelected}
              className={`${optionClass(isSelected)} inline-flex items-center gap-1.5`}
            >
              {isSelected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
              {option}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setSelected([]);
            setIsNone(true);
          }}
          aria-pressed={isNone}
          className={optionClass(isNone)}
        >
          {input.noneLabel}
        </button>
      </div>
      <button
        type="button"
        disabled={selected.length === 0 && !isNone}
        onClick={() => onAnswer(selected)}
        className={`${primaryButtonClass} mt-3`}
      >
        Confirmar
      </button>
    </div>
  );
}

function FileField({ input, question, initial, onAnswer, onChange }: FieldProps<'file'>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(initial instanceof File ? initial : null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={input.accept}
        aria-label={question}
        className="sr-only"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          onChange();
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        {file ? (
          <>
            <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl bg-semispe-surface px-4 py-3 text-sm ring-1 ring-semispe-blue-dark/10">
              <Paperclip className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate font-bold">{file.name}</span>
              <span className="shrink-0 text-xs text-semispe-blue-dark/60">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="shrink-0 rounded-full p-0.5 hover:bg-semispe-blue-dark/10 cursor-pointer"
                aria-label="Remover arquivo"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </span>
            <button type="button" onClick={() => onAnswer(file)} className={primaryButtonClass}>
              Enviar arquivo
            </button>
          </>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} className={primaryButtonClass}>
            <Paperclip className="w-4 h-4" aria-hidden="true" />
            Escolher arquivo
          </button>
        )}
        {input.skipLabel && (
          <button type="button" onClick={() => onAnswer(null)} className={secondaryButtonClass}>
            {input.skipLabel}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-semispe-blue-dark/60">{input.hint}</p>
    </div>
  );
}

function StepField({ step, onAnswer, onChange }: { step: ComposerStep; onAnswer: (value: AnswerValue) => void; onChange: () => void }) {
  const common = { question: step.question, initial: step.initial, onAnswer, onChange };
  const { input } = step;

  switch (input.kind) {
    case 'text':
      return <TextField input={input} {...common} />;
    case 'number':
      return <NumberField input={input} {...common} />;
    case 'textarea':
      return <TextareaField input={input} {...common} />;
    case 'choice':
      return <ChoiceField input={input} {...common} />;
    case 'space':
      return <SpaceField input={input} {...common} />;
    case 'date':
      return <DateField input={input} {...common} />;
    case 'time':
      return <TimeField input={input} {...common} />;
    case 'multi':
      return <MultiField input={input} {...common} />;
    case 'file':
      return <FileField input={input} {...common} />;
  }
}

export interface ReservaComposerProps {
  phase: 'perguntas' | 'revisao' | 'enviado';
  step: ComposerStep | null;
  isEditing: boolean;
  error: string | null;
  consent: boolean;
  isSending: boolean;
  onAnswer: (value: AnswerValue) => void;
  onCancelEdit: () => void;
  onClearError: () => void;
  onConsentChange: (value: boolean) => void;
  onSubmit: () => void;
  onRestart: () => void;
}

/** Base do chat: o campo da pergunta atual, a edição de uma resposta ou o envio final */
export function ReservaComposer({
  phase,
  step,
  isEditing,
  error,
  consent,
  isSending,
  onAnswer,
  onCancelEdit,
  onClearError,
  onConsentChange,
  onSubmit,
  onRestart,
}: ReservaComposerProps) {
  let content: React.ReactNode = null;

  if (step) {
    // A chave recria o campo a cada pergunta, sem herdar o texto da anterior
    content = (
      <StepField key={`${step.id}-${isEditing ? 'edicao' : 'nova'}`} step={step} onAnswer={onAnswer} onChange={onClearError} />
    );
  } else if (phase === 'revisao') {
    content = (
      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm leading-snug cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 shrink-0 accent-semispe-blue-dark cursor-pointer"
          />
          Autorizo o uso dos meus dados pela SEMISPE para analisar esta solicitação, conforme a Lei Geral de Proteção
          de Dados (LGPD).
        </label>
        <button type="button" onClick={onSubmit} disabled={!consent || isSending} className={primaryButtonClass}>
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Enviando…
            </>
          ) : (
            <>
              <SendHorizontal className="w-4 h-4" aria-hidden="true" />
              Enviar solicitação
            </>
          )}
        </button>
      </div>
    );
  } else if (phase === 'enviado') {
    content = (
      <button type="button" onClick={onRestart} className={primaryButtonClass}>
        <RotateCcw className="w-4 h-4" aria-hidden="true" />
        Fazer outra reserva
      </button>
    );
  }

  if (!content) return null;

  return (
    <div className="relative border-t border-semispe-blue-dark/10 bg-white px-4 sm:px-6 py-4">
      {isEditing && step && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-semispe-blue-dark/70">
            Editando: <span className="text-semispe-blue-dark">{step.label}</span>
          </p>
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs font-bold underline underline-offset-2 rounded-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark"
          >
            Cancelar
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mb-2 text-xs font-bold text-red-700">
          {error}
        </p>
      )}
      {content}
    </div>
  );
}
