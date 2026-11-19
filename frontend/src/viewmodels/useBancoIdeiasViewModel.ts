import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EMPTY_IDEA_FORM,
  ideaSchema,
  toCreateIdeaRequest,
  type Idea,
  type IdeaForm,
  type ValidIdeaForm,
} from '../models/idea.model';
import { ApiError } from '../services/api';
import { createIdea, fetchMyIdeas, myIdeasQueryKey } from '../services/ideas.service';
import { type AuthMode } from './useAuthModalViewModel';
import { useAuth, type AuthViewModel } from './useAuth';
import { usePageNavigation, type PageNavigationViewModel } from './usePageNavigation';

/** Mais recente primeiro */
const newestFirst = (ideas: Idea[]) => [...ideas].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export interface BancoIdeiasViewModel extends PageNavigationViewModel {
  auth: AuthViewModel;
  /** Modal de acesso aberto (entrar ou criar conta), ou null */
  authModal: AuthMode | null;
  openAuthModal: (mode: AuthMode) => void;
  closeAuthModal: () => void;
  /** A sessão venceu no meio do uso: a tela de acesso avisa e o rascunho é mantido */
  sessionExpired: boolean;
  form: UseFormReturn<IdeaForm, unknown, ValidIdeaForm>;
  submit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  /** Erro do envio (validação do servidor ou falha de conexão) */
  submitError: string | null;
  /** Ideia que acabou de ser enviada, para a confirmação */
  sentIdea: Idea | null;
  dismissSentIdea: () => void;
  myIdeas: {
    ideas: Idea[];
    isLoading: boolean;
    isError: boolean;
    retry: () => void;
  };
  /** Ideia aberta no modal de detalhe (null com o modal fechado) */
  selectedIdea: Idea | null;
  openIdea: (idea: Idea) => void;
  closeIdea: () => void;
}

/**
 * Banco de Ideias: enviar uma ideia e acompanhar as já enviadas. Exige conta,
 * como a reserva: os dados do proponente vêm dela.
 */
export function useBancoIdeiasViewModel(): BancoIdeiasViewModel {
  const navigation = usePageNavigation('');
  const auth = useAuth();
  const client = useQueryClient();
  const [authModal, setAuthModal] = useState<AuthMode | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sentIdea, setSentIdea] = useState<Idea | null>(null);
  // Guarda só o id: o modal mostra a versão mais recente da ideia na lista
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null);

  // O formulário fica no viewmodel: se a sessão vencer, o rascunho volta depois do login
  const form = useForm<IdeaForm, unknown, ValidIdeaForm>({
    resolver: zodResolver(ideaSchema),
    defaultValues: EMPTY_IDEA_FORM,
  });

  const logout = auth.logout;
  const onSessionExpired = useCallback(() => {
    setSessionExpired(true);
    logout();
    client.removeQueries({ queryKey: myIdeasQueryKey });
    setAuthModal('entrar');
  }, [logout, client]);

  const accountId = auth.account?.id;
  const ideasKey = [...myIdeasQueryKey, accountId] as const;
  const myIdeas = useQuery({
    queryKey: ideasKey,
    queryFn: async ({ signal }) => {
      try {
        return newestFirst(await fetchMyIdeas(auth.accessToken!, signal));
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) onSessionExpired();
        throw error;
      }
    },
    enabled: auth.status === 'authenticated',
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
  });

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setSentIdea(null);
    if (auth.status !== 'authenticated') {
      setAuthModal('entrar');
      return;
    }
    try {
      const idea = await createIdea(toCreateIdeaRequest(values), auth.accessToken);
      setSentIdea(idea);
      form.reset(EMPTY_IDEA_FORM);
      client.setQueryData<Idea[]>(ideasKey, (previous) => newestFirst([idea, ...(previous ?? [])]));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else
        setSubmitError(
          cause instanceof ApiError && cause.status < 500
            ? cause.message
            : 'Não foi possível enviar a sua ideia. Confira a conexão e tente novamente.'
        );
    }
  });

  return {
    ...navigation,
    auth,
    authModal,
    openAuthModal: setAuthModal,
    closeAuthModal: () => setAuthModal(null),
    sessionExpired: sessionExpired && auth.status !== 'authenticated',
    form,
    submit,
    submitError,
    sentIdea,
    dismissSentIdea: () => setSentIdea(null),
    myIdeas: {
      ideas: myIdeas.data ?? [],
      isLoading: myIdeas.isPending && auth.status === 'authenticated',
      isError: myIdeas.isError,
      retry: () => void myIdeas.refetch(),
    },
    selectedIdea:
      auth.status === 'authenticated' ? (myIdeas.data?.find((idea) => idea.id === selectedIdeaId) ?? null) : null,
    openIdea: (idea: Idea) => setSelectedIdeaId(idea.id),
    closeIdea: () => setSelectedIdeaId(null),
  };
}
