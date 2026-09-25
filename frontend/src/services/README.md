# Services & Repositories

Camada responsável pela **comunicação com fontes externas de dados**:
- Clientes HTTP (`api.ts`, instâncias Axios ou Fetch API).
- Métodos de integração com endpoints do backend (`authService.ts`, `projectService.ts`).
- Acesso a armazenamento local (`localStorage`, `sessionStorage`, `IndexedDB`).
- Mapeamento de respostas da API para os modelos de domínio definidos em `src/models/`.
