import type { ReactNode } from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';

/** No Pages, o fragmento mantém as rotas no index.html, inclusive ao recarregar. */
export function SiteRouter({ children }: { children: ReactNode }) {
  const Router = import.meta.env.BASE_URL === '/' ? BrowserRouter : HashRouter;
  return <Router>{children}</Router>;
}
