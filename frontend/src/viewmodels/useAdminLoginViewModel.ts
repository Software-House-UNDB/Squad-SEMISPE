import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginForm } from '../models/auth.model';
import { ApiError } from '../services/api';
import { useAuth } from './useAuth';

export function useAdminLoginViewModel() {
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await auth.login({ email: values.email.toLowerCase(), password: values.password });
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 401
          ? 'E-mail ou senha incorretos.'
          : cause instanceof ApiError && cause.status === 429
            ? 'Muitas tentativas. Aguarde um minuto antes de tentar novamente.'
            : 'Não foi possível entrar. Confira a conexão e tente novamente.'
      );
    }
  });
  return { form, submit, error };
}
