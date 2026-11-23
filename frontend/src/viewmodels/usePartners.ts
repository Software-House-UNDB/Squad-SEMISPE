import { useQuery } from '@tanstack/react-query';
import {
  LAUNCH_PARTNERS,
  countPartnersByCategory,
  type Partner,
  type PartnerCategoryCount,
} from '../models/partner.model';
import { fetchPartners, partnersQueryKey } from '../services/partners.service';

export interface PartnersViewModel {
  partners: readonly Partner[];
  /** Quantos há em cada categoria (só as que têm algum) */
  counts: PartnerCategoryCount[];
  total: number;
  /** Ainda esperando a primeira resposta da API */
  isLoading: boolean;
  /** Mostrando os acordos do lançamento, porque a API não tem parceiros (ou não respondeu) */
  isProvisional: boolean;
}

/**
 * Parceiros cadastrados no painel. Sem nenhum cadastrado (ou com a API fora do ar),
 * vale a lista provisória dos acordos firmados no lançamento do Parque.
 */
export function resolvePartners(fromApi: readonly Partner[] | undefined, hasFailed: boolean) {
  const useLaunchList = hasFailed || (fromApi !== undefined && fromApi.length === 0);
  const partners = useLaunchList ? LAUNCH_PARTNERS : (fromApi ?? []);
  return { partners, isProvisional: useLaunchList };
}

/** Parceiros do Parque, compartilhados pela home (Indicadores e Parceiros) e pela página /parceiros */
export function usePartners(): PartnersViewModel {
  const query = useQuery({
    queryKey: partnersQueryKey,
    queryFn: ({ signal }) => fetchPartners(signal),
    staleTime: 5 * 60_000,
  });
  const { partners, isProvisional } = resolvePartners(query.data, query.isError);

  return {
    partners,
    counts: countPartnersByCategory(partners),
    total: partners.length,
    isLoading: query.isPending,
    isProvisional,
  };
}
