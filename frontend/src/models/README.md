# Models (M)

Camada responsável pelas **entidades de domínio**, **contratos de dados** e **regras de negócio puras**:
- Interfaces e Types TypeScript (`user.model.ts`, `project.model.ts`).
- Schemas de validação (ex: Zod, Yup).
- Classes ou funções puras de manipulação de dados de domínio.
- **Atenção:** Nenhum código React (JSX, Hooks ou estado) deve entrar nesta camada.
