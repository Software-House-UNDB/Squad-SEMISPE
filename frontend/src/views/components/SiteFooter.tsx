import { BrandStripe } from './ui/BrandStripe';
import { Link } from 'react-router-dom';

/** Rodapé institucional, comum a todas as páginas */
export function SiteFooter() {
  return (
    <footer className="py-6 text-center text-xs text-semispe-light/60 bg-[#021f42] relative">
      <BrandStripe className="absolute top-0 left-0 opacity-60" />
      <p>© 2026 Parque Tecnológico de São Luís — SEMISPE / Prefeitura de São Luís</p>
      <Link to="/admin" className="mt-3 inline-block rounded-sm text-white/70 underline underline-offset-4 hover:text-semispe-yellow-light">Área administrativa</Link>
    </footer>
  );
}
