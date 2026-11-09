import { cn } from '../../../utils/cn';
import { BRAND_STRIPE_COLORS } from '../../../models/brand.model';

const stripeGradient = `linear-gradient(90deg, ${BRAND_STRIPE_COLORS.join(', ')})`;

/** Faixa fina com as cores do símbolo do logotipo, usada como divisória */
export function BrandStripe({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('h-0.5 w-full', className)}
      style={{ backgroundImage: stripeGradient }}
    />
  );
}
