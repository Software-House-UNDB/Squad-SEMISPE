# Views - Pages

Camada de **telas e rotas da aplicação**:
- Páginas completas (ex: `HomePage.tsx`, `DashboardPage.tsx`, `LoginPage.tsx`).
- Consome o ViewModel correspondente (ex: `const vm = useHomeViewModel();`).
- Renderiza a estrutura da tela combinando componentes de `src/views/components/` e repassando o estado e eventos do ViewModel.
