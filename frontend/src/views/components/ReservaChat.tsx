import { Fragment, useEffect, useRef, useState } from 'react';
import { Check, LogOut } from 'lucide-react';
import simboloParque from '../../assets/brand/favicon.png';
import { type UserAccount } from '../../models/auth.model';
import { useEstruturaContext } from '../../viewmodels/useEstruturaViewModel';
import { useReservaViewModel, type ReservaViewModel } from '../../viewmodels/useReservaViewModel';
import { ReservaComposer } from './ReservaComposer';

/** Tempo de "digitando…" antes de cada mensagem nova do assistente */
const FIRST_MESSAGE_DELAY = 450;
const NEXT_MESSAGE_DELAY = 750;

const bubbleWidthClass = 'max-w-[85%] sm:max-w-[75%]';

function BotAvatar({ isHidden = false }: { isHidden?: boolean }) {
  return (
    <span
      className={`shrink-0 grid place-items-center w-9 h-9 rounded-full bg-white shadow-sm ring-1 ring-semispe-blue-dark/10 ${
        isHidden ? 'invisible' : ''
      }`}
      aria-hidden="true"
    >
      <img src={simboloParque} alt="" className="w-6 h-6 object-contain" />
    </span>
  );
}

/** Mensagem do assistente; o avatar aparece só na última de cada sequência */
function BotMessage({
  children,
  showAvatar,
  isWide = false,
}: {
  children: React.ReactNode;
  showAvatar: boolean;
  isWide?: boolean;
}) {
  return (
    <div className={`flex items-end gap-2.5 ${isWide ? '' : bubbleWidthClass}`}>
      <BotAvatar isHidden={!showAvatar} />
      <div className="min-w-0 flex-1 sm:flex-initial rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm leading-relaxed shadow-sm ring-1 ring-semispe-blue-dark/10">
        <span className="sr-only">Assistente: </span>
        {children}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <BotAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3.5 shadow-sm ring-1 ring-semispe-blue-dark/10">
        <span className="sr-only">O assistente está digitando</span>
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-semispe-blue-dark/40 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

function UserMessage({
  text,
  isEditing,
  onEdit,
  caption,
}: {
  text: string;
  isEditing: boolean;
  onEdit?: () => void;
  /** Rótulo do dado, quando ele veio da conta e não de uma pergunta */
  caption?: string;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className={`${bubbleWidthClass} rounded-2xl rounded-br-md bg-semispe-blue-dark px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm whitespace-pre-wrap break-words transition-shadow ${
          isEditing ? 'ring-2 ring-semispe-yellow-light ring-offset-2 ring-offset-semispe-surface' : ''
        }`}
      >
        {caption ? (
          <span className="block text-[10px] font-black tracking-wider uppercase text-white/65">
            {caption}
            <span className="sr-only"> (da sua conta): </span>
          </span>
        ) : (
          <span className="sr-only">Você: </span>
        )}
        {text}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          disabled={isEditing}
          className="px-1 text-[11px] font-bold text-semispe-blue-dark/70 underline underline-offset-2 hover:text-semispe-blue-dark rounded-sm cursor-pointer disabled:no-underline disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark"
        >
          {isEditing ? 'Editando…' : 'Editar'}
        </button>
      )}
    </div>
  );
}

/** Resumo da solicitação, agrupado por etapa, com edição de cada resposta */
function ReviewSummary({ vm }: { vm: ReservaViewModel }) {
  return (
    <div className="mt-2 -mx-1 divide-y divide-semispe-blue-dark/10 rounded-xl ring-1 ring-semispe-blue-dark/10 overflow-hidden">
      {vm.summary.map((group) => (
        <section key={group.stage} className="px-4 py-3">
          <h3 className="text-[11px] font-black tracking-wider uppercase text-semispe-blue-dark/60">{group.stage}</h3>
          {/* No celular o rótulo fica em cima do valor; a partir do sm, lado a lado */}
          <dl className="mt-2 space-y-2 sm:space-y-1.5">
            {group.items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[8.5rem_1fr_auto] gap-x-3 text-sm">
                <dt className="col-start-1 row-start-1 text-xs sm:text-sm text-semispe-blue-dark/60">{item.label}</dt>
                <dd className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 font-bold break-words min-w-0">
                  {item.value}
                </dd>
                {vm.canEdit && (
                  <button
                    type="button"
                    onClick={() => vm.startEdit(item.id)}
                    aria-label={`Editar ${item.label}`}
                    className="col-start-2 row-start-1 sm:col-start-3 self-start text-[11px] font-bold text-semispe-blue-dark/70 underline underline-offset-2 hover:text-semispe-blue-dark rounded-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark"
                  >
                    Editar
                  </button>
                )}
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function ProgressStages({ stages }: { stages: ReservaViewModel['stages'] }) {
  return (
    <ol
      aria-label="Etapas da reserva"
      className="flex items-center gap-2 overflow-x-auto px-4 sm:px-6 py-3 border-b border-semispe-blue-dark/10 [scrollbar-width:none]"
    >
      {stages.map((stage, index) => (
        <li
          key={stage.id}
          aria-current={stage.state === 'current' ? 'step' : undefined}
          className="flex shrink-0 items-center gap-2"
        >
          <span
            className={`grid place-items-center w-6 h-6 rounded-full text-[11px] font-black ${
              stage.state === 'done'
                ? 'bg-semispe-blue-dark text-white'
                : stage.state === 'current'
                  ? 'bg-semispe-yellow-light'
                  : 'bg-semispe-surface text-semispe-blue-dark/50'
            }`}
          >
            {stage.state === 'done' ? <Check className="w-3.5 h-3.5" aria-label="concluída" /> : index + 1}
          </span>
          <span className={`text-xs font-bold ${stage.state === 'todo' ? 'text-semispe-blue-dark/50' : ''}`}>
            {stage.label}
          </span>
          {index < stages.length - 1 && (
            <span className="w-5 sm:w-10 h-px bg-semispe-blue-dark/15" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );
}

/** Conta que preenche a reserva, com a saída, no topo do chat */
function AccountBar({ account, onLogout }: { account: UserAccount; onLogout: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-semispe-blue-dark/10 bg-semispe-surface/60 px-4 py-2 text-xs sm:px-6">
      <p className="min-w-0 truncate">
        <span className="text-semispe-blue-dark/60">Reservando como </span>
        <span className="font-bold">{account.name}</span>
      </p>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-sm font-bold text-semispe-blue-dark/70 underline underline-offset-2 hover:text-semispe-blue-dark cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark"
      >
        <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
        Sair
      </button>
    </div>
  );
}

export interface ReservaChatProps {
  /** Conta logada: os dados dela entram como respostas já dadas */
  account: UserAccount;
  accessToken: string | null;
  onSessionExpired: () => void;
  onLogout: () => void;
}

/** A solicitação de reserva em formato de conversa */
export function ReservaChat({ account, accessToken, onSessionExpired, onLogout }: ReservaChatProps) {
  const estrutura = useEstruturaContext();
  const vm = useReservaViewModel(estrutura.spaces, account, accessToken, onSessionExpired);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // As mensagens novas aparecem uma de cada vez, depois de um "digitando…"
  const pendingKey = vm.pending?.key ?? '';
  const pendingTotal = vm.pending?.messages.length ?? 0;
  const [reveal, setReveal] = useState({ key: '', count: 0 });
  if (reveal.key !== pendingKey) {
    setReveal({ key: pendingKey, count: prefersReducedMotion ? pendingTotal : 0 });
  }
  const revealed = reveal.key === pendingKey ? reveal.count : 0;
  const isTyping = revealed < pendingTotal;

  useEffect(() => {
    if (revealed >= pendingTotal) return;
    const timeout = window.setTimeout(
      () => setReveal((prev) => ({ ...prev, count: prev.count + 1 })),
      revealed === 0 ? FIRST_MESSAGE_DELAY : NEXT_MESSAGE_DELAY
    );
    return () => window.clearTimeout(timeout);
  }, [revealed, pendingTotal, pendingKey]);

  // Acompanha a conversa: rola até a última mensagem a cada novidade
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [vm.transcript.length, revealed, vm.phase, prefersReducedMotion]);

  const showReview = vm.phase === 'enviado' || (vm.phase === 'revisao' && !isTyping);

  return (
    <div className="max-w-4xl">
      <h1 className="sr-only">Fazer reserva</h1>
      {/* Abaixo do lg o menu da Estrutura vira uma faixa no topo: o chat desconta a altura dela
          para caber inteiro na tela */}
      <div className="flex flex-col h-[calc(100svh-16rem)] min-h-[26rem] lg:h-[calc(100svh-66px-6rem)] lg:min-h-[32rem] rounded-2xl bg-white shadow-sm ring-1 ring-semispe-blue-dark/10 overflow-hidden">
        <AccountBar account={account} onLogout={onLogout} />
        {!accessToken && (
          <div role="alert" className="px-4 py-2 text-sm">
            Sua sessão expirou. As respostas estão mantidas nesta página.{' '}
            <button type="button" className="font-bold underline" onClick={onSessionExpired}>
              Entrar novamente
            </button>
          </div>
        )}
        <ProgressStages stages={vm.stages} />

        {/* `relative` prende aqui os textos só para leitor de tela (sr-only, posição absoluta):
            sem ele, os das mensagens lá embaixo escapavam da rolagem e esticavam a página */}
        <div
          ref={scrollRef}
          role="log"
          aria-label="Conversa com o assistente de reservas"
          className="relative flex-1 overflow-y-auto bg-semispe-surface/70"
        >
          {/* As mensagens se acumulam de baixo para cima, junto do campo, como nos apps de conversa */}
          <div className="min-h-full flex flex-col justify-end gap-3 px-4 sm:px-6 py-6">
            {vm.transcript.map((item) => (
              <Fragment key={item.id}>
                {item.messages.map((message, index) => (
                  <BotMessage key={index} showAvatar={index === item.messages.length - 1}>
                    {message}
                  </BotMessage>
                ))}
                <div className="pb-2">
                  <UserMessage
                    text={item.answer}
                    caption={item.fromAccount ? item.label : undefined}
                    isEditing={item.isEditing}
                    onEdit={vm.canEdit ? () => vm.startEdit(item.id) : undefined}
                  />
                </div>
              </Fragment>
            ))}

            {/* Depois do envio, o resumo fica na conversa acima da confirmação */}
            {vm.phase === 'enviado' && (
              <BotMessage showAvatar isWide>
                {vm.reviewIntro}
                <ReviewSummary vm={vm} />
              </BotMessage>
            )}

            {vm.pending?.messages.slice(0, revealed).map((message, index) => {
              const isLast = index === pendingTotal - 1;
              const isReview = vm.phase === 'revisao' && isLast;
              return (
                <BotMessage key={`${pendingKey}-${index}`} showAvatar={isLast} isWide={isReview}>
                  {message}
                  {isReview && showReview && <ReviewSummary vm={vm} />}
                </BotMessage>
              );
            })}

            {isTyping && <TypingIndicator />}
          </div>
        </div>

        {!isTyping && ['inicio', 'termino'].includes(vm.composer?.id ?? '') && (
          <div className="px-4 py-3 text-sm" aria-live="polite">
            {vm.scheduleLoading ? (
              <p>Consultando disponibilidade…</p>
            ) : vm.scheduleError ? (
              <p role="alert">
                Não foi possível consultar os horários.{' '}
                <button type="button" className="underline" onClick={vm.retrySchedule}>
                  Tentar novamente
                </button>
              </p>
            ) : vm.composer?.input.kind === 'time' && vm.composer.input.slots.length === 0 ? (
              <p>Não há horários disponíveis nesta data.</p>
            ) : (
              <p>Horários de São Luís (MA). Reservas aprovadas já estão descontadas.</p>
            )}
            <button type="button" className="font-bold underline" onClick={() => vm.startEdit('data')}>
              Escolher outra data
            </button>
          </div>
        )}
        {!isTyping &&
          !(['inicio', 'termino'].includes(vm.composer?.id ?? '') && (vm.scheduleLoading || vm.scheduleError)) && (
            <ReservaComposer
              phase={vm.phase}
              step={vm.composer}
              isEditing={vm.isEditing}
              error={vm.error}
              consent={vm.consent}
              isSending={vm.isSending}
              onAnswer={vm.answer}
              onCancelEdit={vm.cancelEdit}
              onClearError={vm.clearError}
              onConsentChange={vm.setConsent}
              onSubmit={vm.submit}
              onRestart={vm.restart}
            />
          )}
      </div>
    </div>
  );
}
