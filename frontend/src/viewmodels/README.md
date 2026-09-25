# ViewModels (VM)

Camada responsável por **fazer a ponte entre os Models/Services e as Views**:
- No React, os ViewModels são implementados primariamente como **Custom Hooks** (ex: `useAuthViewModel.ts`, `useProjectsViewModel.ts`).
- Gerencia o estado da tela (`useState`, `useReducer`).
- Dispara chamadas assíncronas aos `services` e trata estados de carregamento (`isLoading`), erros (`error`) e sucesso.
- Expõe apenas os dados preparados e as funções de ação (*handlers*) necessárias para a View renderizar e reagir a interações.
