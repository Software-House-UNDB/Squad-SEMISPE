import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Navega a partir de um `href` do menu: '/#secao' rola até a seção quando a
 * página já está aberta (ou abre a home direto nela, vindo de outra página),
 * '/rota' troca de página e o link da própria página aberta ('/' na home) volta
 * ao topo.
 */
export function useSiteNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useCallback(
    (href: string) => {
      const [path, sectionId] = href.split('#');
      const targetPath = path || pathname;

      if (targetPath === pathname) {
        if (sectionId) document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      navigate({ pathname: targetPath, hash: sectionId ? `#${sectionId}` : '' });
    },
    [navigate, pathname]
  );
}
