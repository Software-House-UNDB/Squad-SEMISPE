/**
 * Limpeza das respostas digitadas no chat de reserva: tira o que a pessoa escreve
 * em volta do dado ("meu nome é…", "Olá,", ponto final) e devolve só o dado. A
 * resposta limpa aparece no balão, então um corte errado é visto e corrigido em
 * "Editar". Para cobrir um caso novo, basta ampliar as listas abaixo.
 */

/**
 * Saudações no começo da resposta ("Olá, tudo bem? …"). A saudação precisa
 * terminar ali (espaço, pontuação ou fim), para "ola" não cortar "Olavo".
 */
const GREETINGS = /^(oi|olá|ola|opa|e aí|e ai|bom dia|boa tarde|boa noite|tudo bem|tudo bom)(?=[\s,!.?]|$)[\s,!.?]*/iu;

/** Começos que apresentam o nome ("meu nome é", "me chamo", "sou a"…) */
const NAME_INTROS =
  /^(o meu nome( completo)? (é|e)|meu nome( completo)? (é|e)|nome( completo)?\s*[:-]|eu me chamo|me chamo|chamo-me|eu sou( (o|a))?|sou (o|a)|sou|aqui (é|e)( (o|a))?|é (o|a)|é)\s+/iu;

/** Começos que apresentam a instituição ("é a", "trabalho na", "sou da"…) */
const INSTITUTION_INTROS =
  /^((a |o )?institui[çc][ãa]o (é|e)|institui[çc][ãa]o\s*[:-]|trabalho (na|no|em)|sou (da|do|de)|represento (a|o)|fa[çc]o parte (da|do|de)|é (a|o)|é)\s+/iu;

/** Começos de respostas curtas ("é uma feira", "seria um lançamento"…) */
const SHORT_ANSWER_INTROS = /^((é|seria|vai ser|será|sera)( (um|uma))?|um|uma|tipo\s*[:-])\s+/iu;

/** Palavras que não aparecem em nomes de pessoas: sinal de que veio uma frase */
const NON_NAME_WORDS = new Set([
  'meu', 'minha', 'nome', 'chamo', 'sou', 'eu', 'aqui', 'é', 'oi', 'olá', 'ola', 'tudo',
  'obrigado', 'obrigada', 'favor', 'completo', 'email', 'e-mail', 'telefone', 'cpf',
]);

/** Partículas que ficam em minúsculas no meio do nome (Maria da Silva) */
const NAME_PARTICLES = new Set(['da', 'das', 'de', 'do', 'dos', 'e', 'di', 'du', 'del', 'van', 'von']);

/** Letras (com acento), espaço, hífen, apóstrofo e ponto de abreviação */
const NAME_CHARACTERS = /^[\p{L}\p{M}'’. -]+$/u;

const EMAIL_IN_TEXT = /[^\s@<>()[\]"',;:]+@[^\s@<>()[\]"',;:]+\.[^\s@<>()[\]"',;:]+/u;

const collapseSpaces = (value: string) => value.trim().replace(/\s+/g, ' ');

/** Tira aspas em volta e pontuação no fim ("Vitor Cruz." vira "Vitor Cruz") */
const trimPunctuation = (value: string) =>
  value.replace(/^["'“”‘’]+/u, '').replace(/["'“”‘’\s.!?,;:]+$/u, '');

/** Remove os começos da lista enquanto houver, sem nunca apagar a resposta inteira */
function stripIntros(value: string, patterns: readonly RegExp[]): string {
  let result = value;
  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of patterns) {
      const next = result.replace(pattern, '').trimStart();
      if (next !== result && next) {
        result = next;
        changed = true;
      }
    }
  }
  return result;
}

const capitalizeFirst = (value: string) => value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1);

/**
 * Iniciais em maiúscula ("vitor cruz" vira "Vitor Cruz", "d'ávila" vira "D'Ávila"),
 * com as partículas em minúsculas. Palavras com caixa mista ("McGregor") ficam
 * como a pessoa escreveu.
 */
export function formatPersonName(value: string): string {
  return value
    .split(' ')
    .map((word, index) => {
      const lower = word.toLocaleLowerCase('pt-BR');
      if (index > 0 && NAME_PARTICLES.has(lower)) return lower;
      const isUniformCase = word === lower || word === word.toLocaleUpperCase('pt-BR');
      if (!isUniformCase) return word;
      return lower.replace(/(^|[-'’])(\p{L})/gu, (_, separator: string, letter: string) =>
        separator + letter.toLocaleUpperCase('pt-BR')
      );
    })
    .join(' ');
}

/** "Olá, meu nome é vitor cruz." vira "Vitor Cruz" */
export function cleanName(value: string): string {
  const stripped = stripIntros(trimPunctuation(collapseSpaces(value)), [GREETINGS, NAME_INTROS]);
  return formatPersonName(trimPunctuation(stripped));
}

/** Verdadeiro quando a resposta parece um nome de pessoa, e não uma frase */
export function looksLikeName(value: string): boolean {
  const words = value.split(' ');
  return (
    NAME_CHARACTERS.test(value) &&
    words.length <= 8 &&
    !words.some((word) => NON_NAME_WORDS.has(word.toLocaleLowerCase('pt-BR')))
  );
}

/** "meu e-mail é Vitor@Gmail.com." vira "vitor@gmail.com"; sem e-mail no texto, devolve o texto */
export function extractEmail(value: string): string {
  const match = value.match(EMAIL_IN_TEXT);
  return (match ? match[0] : value.trim()).replace(/[.!?]+$/, '').toLowerCase();
}

/** "trabalho na Universidade Federal do Maranhão." vira "Universidade Federal do Maranhão" */
export function cleanInstitution(value: string): string {
  const stripped = stripIntros(trimPunctuation(collapseSpaces(value)), [GREETINGS, INSTITUTION_INTROS]);
  return capitalizeFirst(trimPunctuation(stripped));
}

/** "é uma feira de inovação." vira "Feira de inovação" */
export function cleanShortAnswer(value: string): string {
  const stripped = stripIntros(trimPunctuation(collapseSpaces(value)), [SHORT_ANSWER_INTROS]);
  return capitalizeFirst(trimPunctuation(stripped));
}
