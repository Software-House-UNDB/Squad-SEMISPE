import { expect, it } from 'vitest';
import { LAUNCH_PARTNERS, countPartnersByCategory, partnerInitials, type Partner } from '../models/partner.model';
import { resolvePartners } from './usePartners';

const cadastrado: Partner = {
  id: '7',
  name: 'Empresa X',
  category: 'company',
  shortDescription: 'Tecnologia e inovação',
  description: 'Empresa instalada no Parque.',
  logoUrl: null,
};

it('usa os parceiros da API quando há algum cadastrado', () => {
  expect(resolvePartners([cadastrado], false)).toEqual({ partners: [cadastrado], isProvisional: false });
});

it('mostra os acordos do lançamento quando a API não tem parceiros ou falha', () => {
  expect(resolvePartners([], false)).toEqual({ partners: LAUNCH_PARTNERS, isProvisional: true });
  expect(resolvePartners(undefined, true)).toEqual({ partners: LAUNCH_PARTNERS, isProvisional: true });
});

it('não mostra a lista provisória enquanto a API ainda não respondeu', () => {
  expect(resolvePartners(undefined, false)).toEqual({ partners: [], isProvisional: false });
});

it('conta só as categorias que têm parceiros, na ordem dos pilares', () => {
  const counts = countPartnersByCategory(LAUNCH_PARTNERS).map(({ category, count }) => [category.id, count]);
  expect(counts).toEqual([
    ['educational_institution', 2],
    ['company', 1],
    ['support_entity', 1],
  ]);
});

it('usa a sigla do nome ou as iniciais no selo sem logo', () => {
  expect(partnerInitials('Centro Universitário UNDB')).toBe('UNDB');
  expect(partnerInitials('IFMA')).toBe('IFMA');
  expect(partnerInitials('Porto Digital')).toBe('PD');
  expect(partnerInitials('Casa Azul Ventures')).toBe('CA');
});
