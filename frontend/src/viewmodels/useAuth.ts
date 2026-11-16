import { useSyncExternalStore } from 'react';
import { type LoginRequest, type RegisterRequest, type UserAccount } from '../models/auth.model';
import { ApiError } from '../services/api';
import {
  clearSession,
  fetchAccount,
  loadSession,
  login as loginRequest,
  register as registerRequest,
  saveSession,
} from '../services/auth.service';

export type AuthState =
  /** Conferindo a sessão guardada, na primeira vez que alguma tela pergunta */
  | { status: 'checking'; account: null; accessToken: null }
  | { status: 'anonymous'; account: null; accessToken: null }
  | { status: 'authenticated'; account: UserAccount; accessToken: string };

const ANONYMOUS: AuthState = { status: 'anonymous', account: null, accessToken: null };

// A sessão é uma só para o site inteiro: fica fora dos componentes, e cada tela
// que usa useAuth é avisada quando ela muda
let state: AuthState = { status: 'checking', account: null, accessToken: null };
const listeners = new Set<() => void>();
let hasRestored = false;

function setState(next: AuthState) {
  state = next;
  listeners.forEach((listener) => listener());
}

/** 401, 403 ou 404 ao ler a conta: token vencido ou revogado, ou conta excluída */
const isSessionGone = (error: unknown) => error instanceof ApiError && [401, 403, 404].includes(error.status);

/** Retoma a sessão da visita anterior, relendo a conta na API */
async function restoreSession() {
  const saved = loadSession();
  if (!saved) {
    setState(ANONYMOUS);
    return;
  }
  try {
    const account = await fetchAccount(saved.userId, saved.accessToken);
    setState({ status: 'authenticated', account, accessToken: saved.accessToken });
  } catch (error) {
    // Sem resposta do servidor, a sessão continua guardada para a próxima visita
    if (isSessionGone(error)) clearSession();
    setState(ANONYMOUS);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!hasRestored) {
    hasRestored = true;
    void restoreSession();
  }
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

/** Entra e já busca a conta completa (o login devolve só nome, e-mail e papel) */
async function login(request: LoginRequest): Promise<void> {
  const session = await loginRequest(request);
  const account = await fetchAccount(session.user.id, session.accessToken);
  saveSession({ accessToken: session.accessToken, userId: session.user.id });
  setState({ status: 'authenticated', account, accessToken: session.accessToken });
}

/** Cria a conta sem entrar; quem chama faz o login em seguida */
async function createAccount(request: RegisterRequest): Promise<void> {
  await registerRequest(request);
}

function logout(): void {
  clearSession();
  setState(ANONYMOUS);
}

export type AuthViewModel = AuthState & {
  login: (request: LoginRequest) => Promise<void>;
  createAccount: (request: RegisterRequest) => Promise<void>;
  logout: () => void;
};

/** Sessão do usuário: estado do login, conta carregada e as ações de entrar, cadastrar e sair */
export function useAuth(): AuthViewModel {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  return { ...snapshot, login, createAccount, logout };
}
