import { apiClient } from './api';
import type { Partner, PartnerCategory } from '../models/partner.model';

/** Parceiro como `GET /partners` devolve (rota pública) */
interface PartnerResponse {
  id: number;
  name: string;
  category: PartnerCategory;
  shortDescription: string;
  description: string;
  logoUrl: string | null;
}

export const partnersQueryKey = ['partners'] as const;

/** Todos os parceiros cadastrados. O e-mail de contato do cadastro não é usado no site */
export async function fetchPartners(signal?: AbortSignal): Promise<Partner[]> {
  const partners = await apiClient<PartnerResponse[]>('partners', { signal });
  return partners.map((partner) => ({
    id: String(partner.id),
    name: partner.name,
    category: partner.category,
    shortDescription: partner.shortDescription,
    description: partner.description,
    logoUrl: partner.logoUrl,
  }));
}
