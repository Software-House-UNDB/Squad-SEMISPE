import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UserAccount } from '../models/auth.model';
import { profileSchema, toProfileForm, toProfileRequest, type ProfileForm } from '../models/profile.model';
import { MAIN_NAV_ITEMS } from '../models/navigation.model';
import { ApiError } from '../services/api';
import { fetchMyProfile } from '../services/auth.service';
import { useAuth } from './useAuth';
import { useSiteNavigation } from './useSiteNavigation';

export const profileQueryKey = ['my-profile'] as const;
export function useProfileViewModel() {
  const auth = useAuth();
  const client = useQueryClient();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expired, setExpired] = useState(false);
  const navigateTo = useSiteNavigation();
  const logout = auth.logout;
  const onSessionExpired = useCallback(() => {
    setExpired(true);
    logout();
    client.removeQueries({ queryKey: profileQueryKey });
  }, [logout, client]);
  const profile = useQuery({
    queryKey: [...profileQueryKey, auth.account?.id],
    queryFn: async ({ signal }) => {
      try {
        return await fetchMyProfile(auth.accessToken!, signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) onSessionExpired();
        throw error;
      }
    },
    enabled: auth.status === 'authenticated',
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
  });
  return {
    auth,
    profile,
    expired,
    onSessionExpired,
    navItems: MAIN_NAV_ITEMS,
    isMobileMenuOpen,
    toggleMobileMenu: () => setMobileMenuOpen((previous) => !previous),
    onNavigateToSection: (href: string) => {
      setMobileMenuOpen(false);
      navigateTo(href);
    },
    onSaved: (account: UserAccount) => client.setQueryData([...profileQueryKey, account.id], account),
  };
}

export function useProfileFormViewModel(
  account: UserAccount,
  onSaved: (account: UserAccount) => void,
  onSessionExpired: () => void
) {
  const auth = useAuth();
  const form = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: toProfileForm(account) });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const submit = form.handleSubmit(async (values) => {
    setError(null);
    setSaved(false);
    try {
      const updated = await auth.updateProfile(toProfileRequest(values));
      onSaved(updated);
      form.reset(toProfileForm(updated));
      setSaved(true);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else
        setError(
          cause instanceof ApiError && cause.status < 500
            ? cause.message
            : 'Não foi possível salvar seus dados. Confira a conexão e tente novamente.'
        );
    }
  });
  const cancel = () => {
    form.reset(toProfileForm(account));
    setError(null);
    setSaved(false);
  };
  return {
    form,
    submit,
    error,
    saved,
    cancel,
    clearNotice: () => {
      setSaved(false);
      setError(null);
    },
  };
}
