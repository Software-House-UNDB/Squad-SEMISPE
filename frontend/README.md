# React + TypeScript + Vite

O cabeçalho permite entrar e acessar **Meus dados** (`/meus-dados`). O perfil
permite atualizar contatos e dados da instituição, com nome e CPF bloqueados.
Contrato e decisões em [Conta e perfil](../backend/profile.md).

O fluxo de reservas está integrado ao backend. Veja
[Integração de reservas](reservations-integration.md) para configuração,
contratos, fotos, validações e pendências. Verificações: `npm test`,
`npm run lint` e `npm run build`.

O painel geral de administração está em `/admin`, também acessível pelo rodapé.
Reservas é o primeiro módulo operacional, em `/admin/reservas`; as demais áreas
de gestão aparecem como planejadas. Somente contas `admin` acessam o painel.
Estrutura em [Painel administrativo](../backend/admin-panel.md); acesso local e
contratos de reservas em [Módulo de reservas](../backend/admin-reservations.md).

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
