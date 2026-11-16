/** Cor de identidade de uma seção, tirada do símbolo do logotipo */
export interface SectionAccent {
  /** Nome da cor no Manual de Identidade Visual */
  name: string;
  /** Tom original do logotipo */
  color: string;
  /** Tom legível sobre os fundos azul-escuros do site (texto, pontos e brilhos) */
  onDark: string;
  /** Tom legível sobre as seções de fundo claro (#f3f5f1) */
  onLight: string;
  /** Fundo bem clarinho para ícones e selos nas seções claras (com o ícone em `onLight`) */
  tint: string;
}

// Tons amostrados do símbolo do logotipo. Os tons `onDark` são clareados para
// manter contraste de texto sobre #021f42 / #033165, e os `onLight` escurecidos
// para manter 4.5:1 sobre o fundo claro das seções
export const BRAND_ACCENTS = {
  azul: { name: 'Azul', color: '#1f71b7', onDark: '#3b9cd6', onLight: '#1f71b7', tint: '#e6f0f9' },
  amarelo: { name: 'Amarelo', color: '#ffdf00', onDark: '#ffdf00', onLight: '#806a00', tint: '#fff8d1' },
  // O amarelo do logotipo clareado, mais suave: identidade da Estrutura
  amareloClaro: { name: 'Amarelo Claro', color: '#ffeb80', onDark: '#ffeb80', onLight: '#806a00', tint: '#fff8d1' },
  verde: { name: 'Verde', color: '#3d8f00', onDark: '#6cc12e', onLight: '#2f7d00', tint: '#e7f2de' },
  verdeClaro: { name: 'Verde Claro', color: '#92bf71', onDark: '#92bf71', onLight: '#4f7f33', tint: '#edf5e7' },
  verdeOliva: { name: 'Verde Oliva', color: '#8ea700', onDark: '#b2cc18', onLight: '#637400', tint: '#eef3d4' },
  verdePetroleo: { name: 'Verde Petróleo', color: '#22755e', onDark: '#3fb08f', onLight: '#22755e', tint: '#dff0ea' },
} as const satisfies Record<string, SectionAccent>;

/** Cores do símbolo na ordem em que aparecem no logotipo (faixa decorativa) */
export const BRAND_STRIPE_COLORS: readonly string[] = [
  '#3b9cd6',
  '#3d8f00',
  '#216700',
  '#8ea700',
  '#92bf71',
  '#ffdf00',
];
