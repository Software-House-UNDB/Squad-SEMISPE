import { expect, it } from 'vitest';
import { EMPTY_IDEA_FORM, IDEA_FLOW, ideaSchema, ideaStageIndex, toCreateIdeaRequest } from './idea.model';

it('segue o fluxo do documento de requisitos, na ordem e com os mesmos nomes', () => {
  expect(IDEA_FLOW.map((stage) => stage.label)).toEqual([
    'Submetida',
    'Avaliação',
    'Em análise',
    'Aprovada',
    'Encaminhada',
    'Implementada',
  ]);
  expect(ideaStageIndex('submitted')).toBe(0);
  expect(ideaStageIndex('implemented')).toBe(5);
});

const valida = {
  title: '  Wi-fi gratuito nos ônibus ',
  category: 'mobility',
  problem: 'Passageiros ficam sem internet durante o trajeto.',
  solution: 'Instalar roteadores nos ônibus da frota municipal.',
  expectedBenefits: 'Inclusão digital no transporte público.',
  targetAudience: 'Usuários do transporte público',
  applicationArea: 'Transporte municipal',
};

it('aceita uma ideia completa e envia os textos sem espaços nas bordas', () => {
  const result = ideaSchema.safeParse(valida);
  expect(result.success).toBe(true);
  expect(toCreateIdeaRequest(result.data!)).toEqual({ ...valida, title: 'Wi-fi gratuito nos ônibus' });
});

it('pede todos os campos obrigatórios, inclusive a categoria', () => {
  const result = ideaSchema.safeParse(EMPTY_IDEA_FORM);
  expect(result.success).toBe(false);
  const fields = result.error!.issues.map((issue) => issue.path[0]);
  expect(new Set(fields)).toEqual(
    new Set(['title', 'category', 'problem', 'solution', 'expectedBenefits', 'targetAudience', 'applicationArea'])
  );
});

it('recusa categoria fora da lista e textos acima dos limites da API', () => {
  expect(ideaSchema.safeParse({ ...valida, category: 'esporte' }).success).toBe(false);
  expect(ideaSchema.safeParse({ ...valida, title: 'a'.repeat(151) }).success).toBe(false);
  expect(ideaSchema.safeParse({ ...valida, problem: 'a'.repeat(5001) }).success).toBe(false);
  expect(ideaSchema.safeParse({ ...valida, targetAudience: 'a'.repeat(256) }).success).toBe(false);
});

it('não aceita campo só com espaços', () => {
  expect(ideaSchema.safeParse({ ...valida, solution: '   ' }).success).toBe(false);
});
