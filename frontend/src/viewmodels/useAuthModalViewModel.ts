import { useState } from 'react';
import { useForm, type UseFormRegisterReturn, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EMPTY_REGISTER_FORM,
  loginSchema,
  registerSchema,
  toRegisterRequest,
  type LoginForm,
  type RegisterForm,
} from '../models/auth.model';
import { ApiError } from '../services/api';
import { useAuth } from './useAuth';

export type AuthMode = 'entrar' | 'cadastro';

/** Campos do cadastro que recebem máscara enquanto a pessoa digita */
type MaskedField = 'phone' | 'cpf' | 'cnpj';

function errorMessage(error: unknown, mode: AuthMode): string {
  if (error instanceof ApiError) {
    if (mode === 'entrar' && error.status === 401) return 'E-mail ou senha incorretos.';
    if (error.status === 429) return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.';
    // E-mail, CPF ou CNPJ já cadastrados: o backend diz qual
    if (error.status === 409) return error.message;
    if (error.status === 400) return 'Confira os dados informados e tente de novo.';
    return 'Algo deu errado do nosso lado. Tente de novo em instantes.';
  }
  return 'Não foi possível falar com o servidor. Confira a sua conexão e tente de novo.';
}

export interface AuthModalViewModel {
  mode: AuthMode;
  switchMode: (mode: AuthMode) => void;
  /** Erro do envio (credenciais, conta já existente, servidor fora do ar) */
  error: string | null;
  /** Aviso neutro, como "conta criada, agora entre" */
  notice: string | null;
  isSubmitting: boolean;
  loginForm: UseFormReturn<LoginForm>;
  registerForm: UseFormReturn<RegisterForm>;
  /** `register` do campo com máscara de telefone, CPF ou CNPJ */
  registerMasked: (field: MaskedField, format: (value: string) => string) => UseFormRegisterReturn<MaskedField>;
  /** Handlers do onSubmit dos formulários (impedem o envio nativo) */
  submitLogin: React.SubmitEventHandler<HTMLFormElement>;
  submitRegister: React.SubmitEventHandler<HTMLFormElement>;
}

/**
 * Modal de acesso: entrar ou criar a conta. Ao criar, já entra com o mesmo
 * e-mail e senha, para a pessoa seguir direto para a reserva.
 */
export function useAuthModalViewModel(initialMode: AuthMode, onSuccess: () => void): AuthModalViewModel {
  const auth = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: EMPTY_REGISTER_FORM,
  });

  const switchMode = (next: AuthMode) => {
    if (next === mode || isSubmitting) return;
    // O e-mail digitado vai junto para a outra aba
    if (next === 'cadastro') {
      const email = loginForm.getValues('email');
      if (email) registerForm.setValue('email', email);
    } else {
      const email = registerForm.getValues('email');
      if (email) loginForm.setValue('email', email);
    }
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const registerMasked = (field: MaskedField, format: (value: string) => string) =>
    registerForm.register(field, {
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => registerForm.setValue(field, format(event.target.value)),
    });

  const submitLogin = loginForm.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await auth.login({ email: values.email.toLowerCase(), password: values.password });
      onSuccess();
    } catch (cause) {
      setError(errorMessage(cause, 'entrar'));
      setIsSubmitting(false);
    }
  });

  const submitRegister = registerForm.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setError(null);
    const request = toRegisterRequest(values);
    try {
      await auth.createAccount(request);
    } catch (cause) {
      setError(errorMessage(cause, 'cadastro'));
      setIsSubmitting(false);
      return;
    }
    try {
      await auth.login({ email: request.email, password: request.password });
      onSuccess();
    } catch {
      // A conta existe, só o login automático falhou: a pessoa entra pela outra aba
      loginForm.setValue('email', request.email);
      setMode('entrar');
      setNotice('Conta criada! Agora entre com o seu e-mail e a sua senha.');
      setIsSubmitting(false);
    }
  });

  return {
    mode,
    switchMode,
    error,
    notice,
    isSubmitting,
    loginForm,
    registerForm,
    registerMasked,
    submitLogin: (event) => void submitLogin(event),
    submitRegister: (event) => void submitRegister(event),
  };
}
