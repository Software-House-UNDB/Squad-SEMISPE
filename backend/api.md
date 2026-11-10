# API — Squad SEMISPE Backend

Coleção de requisições em `curl`, prontas para importar no Insomnia ou no
Postman (ambos aceitam colar um comando `curl` direto e convertem para uma
requisição).

**Base URL:** `http://localhost:3000/api` (ajuste a porta se alterar `PORT`
no `.env` ou no `docker-compose.yml`).

## Health

### Health check

```bash
curl -X GET http://localhost:3000/api/health
```

## Auth

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.doe@example.com",
    "password": "senha12345"
  }'
```

Resposta (`200`):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "role": "user"
  }
}
```

Credenciais inválidas (e-mail inexistente ou senha incorreta — resposta
idêntica para ambos os casos, para não revelar se o e-mail existe):

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.doe@example.com",
    "password": "senha-errada"
  }'
```

Resposta (`401`):

```json
{
  "message": "Credenciais inválidas",
  "error": "Unauthorized",
  "statusCode": 401
}
```

E-mail em formato inválido → `400 Bad Request`.

### Autenticando requisições

Rotas protegidas exigem o `accessToken` retornado pelo login no cabeçalho
`Authorization`:

O exemplo abaixo usa um token de administrador para alterar um espaço:

```bash
curl -X PATCH http://localhost:3000/api/spaces/1 \
  -H "Authorization: Bearer TOKEN_DO_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"capacity": 80}'
```

- Sem o cabeçalho `Authorization` → `401 Unauthorized`.
- Token inválido, malformado ou expirado → `401 Unauthorized`.
- Token válido, mas role sem permissão para a rota (quando a rota exigir um
  papel específico via `@Roles(...)`) → `403 Forbidden`.

O payload do JWT carrega apenas `sub` (id do usuário), `email` e `role` —
nunca a senha ou outros dados pessoais.

## Users

### Acesso às rotas de usuários

| Método | Rota | Acesso |
| --- | --- | --- |
| POST | `/api/users` | Público; novos usuários recebem `user` |
| GET | `/api/users` | Administrador |
| GET/PATCH/DELETE | `/api/users/:id` | Próprio usuário ou administrador |

Nas rotas protegidas, envie `Authorization: Bearer TOKEN`.
Sem token, token inválido/expirado ou conta excluída: `401`.
Usuário comum tentando listar usuários ou acessar outra conta: `403`.
O JWT é validado contra o banco a cada requisição; email e papel atuais
prevalecem sobre os dados antigos do token. Falhas do banco não são tratadas
como credenciais inválidas. Esta consulta não revoga tokens por troca de senha.


Modelo de usuário (`User`):

| Campo         | Obrigatório | Observações                                                        |
| ------------- | ----------- | ------------------------------------------------------------------- |
| `name`        | sim         | string, não vazio, até 150 caracteres                               |
| `institution` | não         | string, até 150 caracteres                                          |
| `cpf`         | não         | somente dígitos; quando informado, exige exatamente 11 dígitos; único |
| `cnpj`        | não         | somente dígitos; quando informado, exige exatamente 14 dígitos; único |
| `email`       | sim         | formato de e-mail válido; normalizado (trim + lowercase); único      |
| `phone`       | não         | formatação é removida antes de salvar; aceita 10 ou 11 dígitos       |
| `password`    | sim (na criação) | mínimo de 8 caracteres; nunca retornado nas respostas          |
| `role`        | —           | definido pelo backend (`user` por padrão); não pode ser enviado pelo cliente |

`cpf`/`cnpj` aceitam entrada formatada (ex.: `123.456.789-09`) — os
caracteres não numéricos são removidos automaticamente antes da validação e
da persistência. Não é aplicado algoritmo de dígito verificador nesta etapa,
apenas a checagem de quantidade de dígitos.

O campo `role` é usado pelo módulo de autenticação/autorização.
`CreateUserDto` e `UpdateUserDto` não expõem esse campo — qualquer tentativa
de enviá-lo é rejeitada com `400` pelo `ValidationPipe` (`whitelist` +
`forbidNonWhitelisted`), impedindo que um cliente se autopromova a
administrador.

### Criar usuário

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "institution": "Instituto Fictício",
    "cpf": "123.456.789-09",
    "email": "jane.doe@example.com",
    "phone": "(11) 91234-5678",
    "password": "senha12345"
  }'
```

Resposta (`201`):

```json
{
  "id": 1,
  "name": "Jane Doe",
  "institution": "Instituto Fictício",
  "cpf": "12345678909",
  "cnpj": null,
  "email": "jane.doe@example.com",
  "phone": "11912345678",
  "role": "user",
  "createdAt": "2026-01-01T12:00:00.000Z",
  "updatedAt": "2026-01-01T12:00:00.000Z"
}
```

`institution`, `cpf`, `cnpj` e `phone` são opcionais — o corpo abaixo também
é válido:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "senha12345"
  }'
```

### Listar usuários

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer TOKEN"
```

### Buscar usuário por id

```bash
curl -X GET http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer TOKEN"
```

### Atualizar usuário (parcial)

```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane D. Doe"
  }'
```

### Remover usuário

```bash
curl -X DELETE http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer TOKEN"
```

### Exemplo de validação inválida

CPF com quantidade de dígitos incorreta:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "senha12345",
    "cpf": "123"
  }'
```

Resposta (`400`):

```json
{
  "message": ["cpf deve conter exatamente 11 dígitos numéricos"],
  "error": "Bad Request",
  "statusCode": 400
}
```

Outros exemplos de erro esperados:

- E-mail ou CPF/CNPJ já cadastrados → `409 Conflict`, com mensagem indicando
  qual campo está duplicado.
- Tentativa de enviar `role` no corpo da requisição → `400 Bad Request`
  (`property role should not exist`).
- Usuário inexistente em `GET/PATCH/DELETE /users/:id` → `404 Not Found`.


## Partners

- Todas as rotas `GET` são públicas e não precisam de autenticação.
- O token é obtido no login (veja seção [Auth](#auth)).
- Funções de escrita referentes ao painel de admin (`POST`, `PATCH` e `DELETE`) requerem token de usuário com role `admin`.
- Usuário sem token ou token inválido recebe `401`, um usuário que tente uma função de escrita sem role de `admin` recebe `403`.

### Categorias

O campo `category` classifica o parceiro e aceita apenas os valores abaixo.
É opcional na criação: quando omitido, o parceiro é salvo como `other`.
Qualquer outro valor retorna `400`.

| Valor | Significado |
| ----- | ----------- |
| `company` | Empresa |
| `startup` | Startup |
| `educational_institution` | Instituição de ensino |
| `government` | Órgão público |
| `support_entity` | Entidade de apoio |
| `other` | Outro |

### Criar Parceiro

```bash
curl -X POST http://localhost:3000/api/partners \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "Empresa X",
    "email": "contato@empresax.com",
    "description": "Empresa de tecnologia instalada no Parque Tecnológico.",
    "shortDescription": "Tecnologia e inovação",
    "category": "company",
    "logoUrl": "https://empresax.com/logo.png"
  }'
```

### Listar Parceiros

```bash
curl -X GET http://localhost:3000/api/partners
```

Para listar apenas uma categoria, use o filtro opcional `category`:

```bash
curl -X GET "http://localhost:3000/api/partners?category=educational_institution"
```

Sem o filtro, todos os parceiros são retornados. Uma categoria inexistente
retorna `400`, e uma categoria sem parceiros retorna uma lista vazia (`[]`).

### Buscar um Parceiro pelo id

```bash
curl -X GET http://localhost:3000/api/partners/1
```

### Atualizar um Parceiro (parcial)

```bash
curl -X PATCH http://localhost:3000/api/partners/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "logoUrl": "http://empresay.com/logo.png"
  }'
```

### Remover um parceiro

```bash
curl -X DELETE http://localhost:3000/api/partners/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## Spaces

Cadastro dos espaços físicos do Parque Tecnológico. A solicitação de reservas
é uma funcionalidade separada.

| Campo | Obrigatório na criação | Observações |
| ----- | ---------------------- | ----------- |
| `id` | — | gerado automaticamente; não enviar no corpo |
| `name` | sim | texto não vazio, até 150 caracteres; espaços nas bordas são removidos; nomes repetidos são permitidos |
| `description` | não | texto opcional; `null` representa ausência de descrição |
| `capacity` | sim | número inteiro maior que zero, até 2147483647 |
| `photoUrls` | não | lista de URLs HTTP/HTTPS; começa como `[]` quando omitida; arquivos de imagem não são enviados por esta API |
| `equipment` | não | lista de nomes não vazios; começa como `[]` quando omitida |
| `state` | não | `"active"` ou `"inactive"`; começa como `"active"` quando omitido |
| `createdAt` / `updatedAt` | — | gerados automaticamente; não enviar no corpo |

| Método | Rota | Acesso | Sucesso |
| ------ | ---- | ------ | ------- |
| GET | `/api/spaces` | público | `200` com uma lista |
| GET | `/api/spaces/:id` | público | `200` com o espaço |
| POST | `/api/spaces` | administrador | `201` com o espaço criado |
| PATCH | `/api/spaces/:id` | administrador | `200` com o espaço atualizado |
| DELETE | `/api/spaces/:id` | administrador | `200` sem corpo |

Nas três rotas de alteração:

- Sem token, token inválido ou expirado → `401`.
- Token válido de usuário com `role: "user"` → `403`.
- Token válido de usuário com `role: "admin"` → a requisição segue para validação e execução.

### Preparar administrador para o teste local

Na raiz do repositório, com o banco e o backend em execução:

```bash
docker compose exec semispe-back npm run dev:spaces-admin
```

Esse comando é exclusivo do ambiente de desenvolvimento e cria a conta abaixo
com senha em hash. Se o e-mail já pertencer a uma conta com outras credenciais
ou outro papel, o comando interrompe e preserva a conta existente.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin.espacos@example.com",
    "password": "EspacosTeste123!"
  }'
```

Confira `user.role: "admin"` na resposta e copie o `accessToken`. Nos exemplos
seguintes, substitua `TOKEN_DO_ADMIN` por esse token.

No Postman, configure **Authorization → Bearer Token** e cole somente o token,
sem o prefixo `Bearer`. Para `POST` e `PATCH`, use **Body → raw → JSON**.
As consultas `GET` podem usar **No Auth**.

### Criar espaço

```bash
curl -X POST http://localhost:3000/api/spaces \
  -H "Authorization: Bearer TOKEN_DO_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Miniauditório",
    "description": "Espaço para palestras e apresentações.",
    "capacity": 60,
    "photoUrls": ["https://example.com/miniauditorio.jpg"],
    "equipment": ["Projetor", "Microfone"]
  }'
```

Resposta de exemplo (`201`):

```json
{
  "id": 1,
  "name": "Miniauditório",
  "description": "Espaço para palestras e apresentações.",
  "capacity": 60,
  "photoUrls": ["https://example.com/miniauditorio.jpg"],
  "equipment": ["Projetor", "Microfone"],
  "state": "active",
  "createdAt": "2026-10-13T12:00:00.000Z",
  "updatedAt": "2026-10-13T12:00:00.000Z"
}
```

Guarde o `id` real retornado. Substitua o `1` dos exemplos seguintes por esse
valor; o banco pode já ter utilizado outros IDs.

### Listar espaços

```bash
curl -X GET http://localhost:3000/api/spaces
```

### Buscar espaço por id

```bash
curl -X GET http://localhost:3000/api/spaces/1
```

### Atualizar parcialmente

```bash
curl -X PATCH http://localhost:3000/api/spaces/1 \
  -H "Authorization: Bearer TOKEN_DO_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"capacity": 80}'
```

Campos omitidos mantêm seus valores. Uma lista enviada substitui a lista
anterior por inteiro. Este exemplo troca os equipamentos por `TV`:

```bash
curl -X PATCH http://localhost:3000/api/spaces/1 \
  -H "Authorization: Bearer TOKEN_DO_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"equipment": ["TV"]}'
```

Para inativar ou reativar um espaço (controlando a exibição no front-end):

```bash
curl -X PATCH http://localhost:3000/api/spaces/1 \
  -H "Authorization: Bearer TOKEN_DO_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"state": "inactive"}'
```

Para limpar as listas e a descrição:

```bash
curl -X PATCH http://localhost:3000/api/spaces/1 \
  -H "Authorization: Bearer TOKEN_DO_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"equipment": [], "photoUrls": [], "description": null}'
```

`null` não é aceito em `name`, `capacity`, `equipment`, `photoUrls` ou `state`.
Listas vazias removem os itens do cadastro; não apagam arquivos de imagens.

### Remover espaço

```bash
curl -X DELETE http://localhost:3000/api/spaces/1 \
  -H "Authorization: Bearer TOKEN_DO_ADMIN"
```

A exclusão é física. A resposta é `200` sem corpo; consultar o mesmo ID depois
retorna `404`.

### Testar validação e permissões

Com o token de admin, capacidade zero retorna `400`:

```bash
curl -X POST http://localhost:3000/api/spaces \
  -H "Authorization: Bearer TOKEN_DO_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Miniauditório", "capacity": 0}'
```

```json
{
  "message": ["A capacidade deve ser maior que zero."],
  "error": "Bad Request",
  "statusCode": 400
}
```

Outros casos para conferir no Postman:

- Nome vazio ou só com espaços, capacidade fracionada, URL inválida, item
  de equipamento vazio ou `state` diferente de `"active"`/`"inactive"` → `400`,
  com mensagens dos validators em português.
- Enviar campos desconhecidos, como `id` ou `role`, no corpo → `400`.
- ID não numérico, como `/api/spaces/abc` → `400`.
- Espaço inexistente em `GET/PATCH/DELETE /spaces/:id` → `404`.
- Repetir a mesma alteração com **No Auth** → `401`.
- Fazer login com uma conta criada por `POST /api/users` e usar seu token nas
  alterações de espaços → `403`, pois o cadastro padrão recebe `role: "user"`.

### Testes automatizados de espaços

```bash
docker compose exec semispe-back npm test -- --runInBand
docker compose exec semispe-back npm run test:spaces:service
docker compose exec semispe-back npm run test:spaces:http
```

A suíte Jest confere os DTOs e as permissões do controller. Os dois testes
adicionais usam o MySQL local; o teste HTTP também usa a API em execução.
Eles criam registros temporários com identificadores exclusivos e os removem
ao finalizar. Ambos exigem `NODE_ENV=development`.

## Ideas (Banco de Ideias Digital)

Recebe propostas de inovação enviadas por usuários logados (seção 3.8 do
documento de requisitos). Os dados do proponente (nome, instituição, e-mail e
telefone) vêm da conta do usuário; a ideia guarda apenas o `authorId`. Não há
anexos nem envio de e-mail nesta versão.

### Como testar no Postman (passo a passo)

Você vai precisar de **dois tokens**: um de usuário comum (o autor da ideia) e
um de administrador. Em todas as requisições com corpo, use
**Body → raw → JSON**. Onde estiver escrito "Bearer Token", vá em
**Authorization → Type: Bearer Token** e cole só o token.

**Passo 1 — Criar o usuário comum** (uma vez só)

- `POST http://localhost:3000/api/users` · Authorization: **No Auth**
- Body:

```json
{
  "name": "Autor de Teste",
  "institution": "UNDB",
  "phone": "98912345678",
  "email": "autor.ideias@example.com",
  "password": "senha12345"
}
```

- Esperado: `201`. Se der `409`, o usuário já existe; siga para o passo 2.

**Passo 2 — Logar como usuário comum e guardar o token**

- `POST http://localhost:3000/api/auth/login` · Authorization: **No Auth**
- Body:

```json
{ "email": "autor.ideias@example.com", "password": "senha12345" }
```

- Esperado: `200`. Copie o valor de `accessToken`: esse é o **TOKEN DO USUÁRIO**.

**Passo 3 — Criar o admin e guardar o token**

- No terminal, na raiz do projeto, rode uma vez:
  `docker compose exec semispe-back npm run dev:spaces-admin`
- `POST http://localhost:3000/api/auth/login` · Authorization: **No Auth**
- Body:

```json
{ "email": "admin.espacos@example.com", "password": "EspacosTeste123!" }
```

- Esperado: `200` com `"role": "admin"`. Copie o `accessToken`: esse é o **TOKEN DO ADMIN**.

O login aceita cinco tentativas por minuto por IP. Se aparecer `429`, espere um minuto.

**Passo 4 — Enviar a ideia** (TOKEN DO USUÁRIO)

- `POST http://localhost:3000/api/ideas` · Bearer Token: TOKEN DO USUÁRIO
- Body:

```json
{
  "title": "Wi-fi gratuito nos ônibus",
  "category": "mobility",
  "problem": "Passageiros ficam sem acesso à internet durante o trajeto.",
  "solution": "Instalar roteadores nos ônibus da frota municipal.",
  "expectedBenefits": "Inclusão digital e melhor experiência no transporte público.",
  "targetAudience": "Usuários do transporte público",
  "applicationArea": "Transporte municipal"
}
```

- Esperado: `201`, `"status": "submitted"` e o objeto `author` com seus dados.
  **Anote o `id`** e use-o no lugar de `ID` nos próximos passos.

**Passo 5 — Ver as próprias ideias** (TOKEN DO USUÁRIO)

- `GET http://localhost:3000/api/ideas/mine` → `200`, a ideia aparece na lista.

**Passo 6 — Editar a ideia** (TOKEN DO USUÁRIO)

- `PATCH http://localhost:3000/api/ideas/ID`
- Body: `{ "title": "Wi-fi gratuito em toda a frota" }`
- Esperado: `200` com o título novo.

**Passo 7 — Listar todas como admin** (TOKEN DO ADMIN)

- `GET http://localhost:3000/api/ideas` → `200`.
- Com o TOKEN DO USUÁRIO a mesma rota deve dar `403`.

**Passo 8 — Mudar o status** (TOKEN DO ADMIN)

- `PATCH http://localhost:3000/api/ideas/ID/status`
- Body: `{ "status": "evaluation" }`
- Esperado: `200` com `"status": "evaluation"`.

**Passo 9 — Conferir a trava** (TOKEN DO USUÁRIO)

- Repita o passo 6. Esperado: **`409`** com
  `A ideia já está em avaliação e não pode mais ser alterada.`

**Passo 10 — Remover** (TOKEN DO ADMIN)

- `DELETE http://localhost:3000/api/ideas/ID` → `200` sem corpo.
- `GET http://localhost:3000/api/ideas/ID` depois → `404`.

| Campo | Obrigatório na criação | Observações |
| ----- | ---------------------- | ----------- |
| `id` | — | gerado automaticamente |
| `title` | sim | texto não vazio, até 150 caracteres |
| `category` | sim | uma das categorias da tabela abaixo |
| `problem` | sim | problema identificado; texto não vazio, até 5000 caracteres |
| `solution` | sim | solução proposta; texto não vazio, até 5000 caracteres |
| `expectedBenefits` | sim | benefícios esperados; texto não vazio, até 5000 caracteres |
| `targetAudience` | sim | público-alvo; texto não vazio, até 255 caracteres |
| `applicationArea` | sim | área de aplicação; texto não vazio, até 255 caracteres |
| `status` | — | começa em `submitted`; só o admin altera, por rota própria |
| `authorId` / `author` | — | definidos pelo token; enviar no corpo retorna `400` |
| `createdAt` / `updatedAt` | — | gerados automaticamente |

Espaços nas bordas dos textos são removidos. Mensagens de validação em português.

### Categorias e status

| `category` | Exibição |
| ---------- | -------- |
| `health` | Saúde |
| `education` | Educação |
| `mobility` | Mobilidade |
| `environment` | Meio Ambiente |
| `tourism` | Turismo |
| `culture` | Cultura |
| `security` | Segurança |
| `technology` | Tecnologia |
| `smart_city` | Cidade Inteligente |
| `digital_government` | Governo Digital |
| `other` | Outros |

| `status` | Exibição |
| -------- | -------- |
| `submitted` | Submetida |
| `evaluation` | Avaliação |
| `under_analysis` | Em análise |
| `approved` | Aprovada |
| `forwarded` | Encaminhada |
| `implemented` | Implementada |

O admin pode escolher qualquer status, sem ordem obrigatória.

### Rotas e permissões

Todas as rotas exigem login (`Authorization: Bearer TOKEN`). Sem token ou com
token inválido → `401`.

| Método | Rota | Acesso | Sucesso |
| ------ | ---- | ------ | ------- |
| POST | `/api/ideas` | qualquer usuário logado | `201` com a ideia e o autor |
| GET | `/api/ideas/mine` | usuário logado (somente as próprias) | `200` com uma lista |
| GET | `/api/ideas` | admin; filtros opcionais `?category=` e `?status=` | `200` com uma lista |
| GET | `/api/ideas/:id` | admin ou o autor | `200` com a ideia e o autor |
| PATCH | `/api/ideas/:id` | somente o autor, enquanto `submitted` | `200` com a ideia atualizada |
| PATCH | `/api/ideas/:id/status` | admin | `200` com a ideia atualizada |
| DELETE | `/api/ideas/:id` | admin a qualquer momento; autor só enquanto `submitted` | `200` sem corpo |

Regras de acesso:

- Usuário comum em rota de admin, ou acessando ideia de outra pessoa → `403`.
- O conteúdo da ideia só é editado pelo autor; um admin que não seja o autor recebe `403` no `PATCH /api/ideas/:id`.
- Quando o status deixa de ser `submitted`, o autor não pode mais editar nem excluir → `409` com a mensagem
  `A ideia já está em avaliação e não pode mais ser alterada.`
- Ideia inexistente → `404`. Id não numérico → `400`.
- Ao excluir a conta de um usuário, as ideias dele são excluídas junto.

A ideia retornada inclui `author` com `id`, `name`, `institution`, `email` e
`phone`. Senha, CPF, CNPJ e papel do autor nunca são retornados. O
`GET /api/ideas/mine` devolve as ideias sem o objeto `author`.

### Enviar ideia

```bash
curl -X POST http://localhost:3000/api/ideas \
  -H "Authorization: Bearer TOKEN_DO_USUARIO" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wi-fi gratuito nos ônibus",
    "category": "mobility",
    "problem": "Passageiros ficam sem acesso à internet durante o trajeto.",
    "solution": "Instalar roteadores nos ônibus da frota municipal.",
    "expectedBenefits": "Inclusão digital e melhor experiência no transporte público.",
    "targetAudience": "Usuários do transporte público",
    "applicationArea": "Transporte municipal"
  }'
```

Resposta de exemplo (`201`):

```json
{
  "id": 1,
  "title": "Wi-fi gratuito nos ônibus",
  "category": "mobility",
  "problem": "Passageiros ficam sem acesso à internet durante o trajeto.",
  "solution": "Instalar roteadores nos ônibus da frota municipal.",
  "expectedBenefits": "Inclusão digital e melhor experiência no transporte público.",
  "targetAudience": "Usuários do transporte público",
  "applicationArea": "Transporte municipal",
  "status": "submitted",
  "authorId": 2,
  "createdAt": "2026-11-10T12:00:00.000Z",
  "updatedAt": "2026-11-10T12:00:00.000Z",
  "author": {
    "id": 2,
    "name": "Jane Doe",
    "institution": "Instituto Fictício",
    "email": "jane.doe@example.com",
    "phone": "11912345678"
  }
}
```

### Minhas ideias

```bash
curl -X GET http://localhost:3000/api/ideas/mine \
  -H "Authorization: Bearer TOKEN_DO_USUARIO"
```

### Listar todas (admin)

```bash
curl -X GET "http://localhost:3000/api/ideas?category=mobility&status=submitted" \
  -H "Authorization: Bearer TOKEN_DO_ADMIN"
```

Os dois filtros são opcionais. Valor fora da lista → `400`.

### Buscar ideia por id

```bash
curl -X GET http://localhost:3000/api/ideas/1 \
  -H "Authorization: Bearer TOKEN_DO_USUARIO"
```

### Editar ideia (autor)

```bash
curl -X PATCH http://localhost:3000/api/ideas/1 \
  -H "Authorization: Bearer TOKEN_DO_USUARIO" \
  -H "Content-Type: application/json" \
  -d '{"title": "Wi-fi gratuito em toda a frota"}'
```

Campos omitidos mantêm seus valores; `null` é rejeitado. Enviar `status`,
`authorId` ou `author` → `400`.

### Alterar status (admin)

```bash
curl -X PATCH http://localhost:3000/api/ideas/1/status \
  -H "Authorization: Bearer TOKEN_DO_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"status": "evaluation"}'
```

O corpo aceita somente `status`.

### Remover ideia

```bash
curl -X DELETE http://localhost:3000/api/ideas/1 \
  -H "Authorization: Bearer TOKEN_DO_USUARIO"
```

### Testes automatizados de ideias

```bash
docker compose exec semispe-back npm test -- --runInBand
docker compose exec semispe-back npm run test:ideas:http
```

A suíte Jest confere DTOs, regras do service e permissões do controller. O
teste HTTP usa a API em execução e o MySQL local: cria usuários e ideias
temporários com identificadores exclusivos e os remove ao final. Exige
`NODE_ENV=development`.

### Atualização do banco

`CreateIdeas1794282716408` cria a tabela `ideas` com chave estrangeira
`authorId` → `users.id` (`ON DELETE CASCADE`). Em produção, aplique com
`npm run migration:run` antes de iniciar a API. Reverter a migration apaga a
tabela e as ideias registradas.

## Notas

- Todas as rotas ficam sob o prefixo `/api` (definido em
  [`main.ts`](src/main.ts) via `setGlobalPrefix`).
- O corpo de `POST`/`PATCH` é validado pelo `ValidationPipe` global: campos
  fora do respectivo DTO são rejeitados. Na criação, campos obrigatórios
  ausentes retornam `400`.
- O campo `password` nunca volta nas respostas (`@Exclude()` na entity
  `User`).
- Autenticação é feita via `POST /api/auth/login` (ver seção [Auth](#auth)),
  que retorna um JWT. Rotas que exigirem autenticação devem usar o
  `JwtAuthGuard` do módulo `auth`; rotas que exigirem um papel específico
  também usam o `RolesGuard` + decorator `@Roles(...)`.
- Substitua o `1` no path de `:id` pelo id real retornado no `POST`.
- Conforme novos módulos forem criados (ver [`pattern.md`](pattern.md)),
  adicione as novas rotas aqui.
- `name`, `email`, `description` e `shortDescription` são obrigatórios na criação de parceiros,
  diferentemente do `logoUrl` e da `category`.
- O não preenchimento de campos obrigatórios no `POST` retornará 400.
- Campo `shortDescription` possui limite de 150 caracteres, serve para descrever o que a parceria
  com aquela empresa traz de benefícios.
- Nenhum dado é obrigatório na edição dos parceiros, no entanto os campos ainda passam pela validação.
- Tentar cadastrar um email que pertence a outro parceiro retorna `409` no `POST` e `PATCH`


### Validação de parceiros

- Campos omitidos no PATCH preservam seus valores.
- `name`, `email`, `description`, `shortDescription` e `category` não aceitam `null`.
- `logoUrl` aceita `null` para remover a logomarca; URLs têm limite de 255 caracteres.
- E-mail duplicado retorna 409 inclusive quando a duplicação ocorre durante a gravação concorrente.
- A categoria `support_entity` representa Entidades de Apoio; as categorias anteriores permanecem válidas.

### Atualização do banco

Antes de iniciar a versão atualizada em produção, execute `npm run migration:run`.
As migrations acrescentam a categoria de parceiros e a coluna `spaces.state`,
com `active` como valor inicial para os espaços existentes.
Na reversão, parceiros `support_entity` são convertidos para `other` antes de
remover a categoria. Reverter a migration de espaços remove a coluna e seus valores.

### Limite de tentativas de login

`POST /api/auth/login` aceita cinco requisições por minuto por IP, incluindo
requisições inválidas e logins bem-sucedidos. Ao exceder, retorna `429` com
`Retry-After` indicando a espera em segundos. O contador fica em memória por
instância e é reiniciado com o processo. Para várias instâncias, usar armazenamento
compartilhado. Atrás de proxy, configurar apenas os proxies confiáveis antes de
usar o IP encaminhado. Referência: https://docs.nestjs.com/security/rate-limiting

### Validações de usuários e implantação

- Nome é aparado, obrigatório e limitado a 150 caracteres; email é normalizado e limitado a 255.
- Senha tem no mínimo oito caracteres e no máximo 72 bytes em UTF-8 (limite do bcrypt).
- No PATCH, `name`, `email` e `password` rejeitam `null`; campos omitidos são preservados.
- `institution`, `cpf`, `cnpj` e `phone` aceitam `null` para limpar dados opcionais.
- `CreateUsers1793199600000` cria a tabela com índices únicos de email, CPF e CNPJ.
- Aplicar migrations antes de iniciar a API em produção, com sincronização automática desativada.
- Bancos locais criados por `synchronize` precisam de alinhamento de histórico/schema antes de executar as migrations iniciais; não execute sobre tabelas existentes sem esse alinhamento.
- Reverter `CreateUsers` apaga a tabela e seus registros; não reverter em banco com dados que devam ser preservados.
