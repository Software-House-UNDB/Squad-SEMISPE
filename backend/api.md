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

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

- Sem o cabeçalho `Authorization` → `401 Unauthorized`.
- Token inválido, malformado ou expirado → `401 Unauthorized`.
- Token válido, mas role sem permissão para a rota (quando a rota exigir um
  papel específico via `@Roles(...)`) → `403 Forbidden`.

O payload do JWT carrega apenas `sub` (id do usuário), `email` e `role` —
nunca a senha ou outros dados pessoais.

## Users

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

O campo `role` existe para uso futuro do módulo de autenticação/autorização.
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
curl -X GET http://localhost:3000/api/users
```

### Buscar usuário por id

```bash
curl -X GET http://localhost:3000/api/users/1
```

### Atualizar usuário (parcial)

```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane D. Doe"
  }'
```

### Remover usuário

```bash
curl -X DELETE http://localhost:3000/api/users/1
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
- O token é obtido no login (veja seção Auth)
- Funções de escrita referentes ao painel de admin (`POST`, `PATCH` e `DELETE`) requerem token de usuário com role `admin`.
- Usuário sem token ou token inválido recebe `401`, um usuário que tente uma função de escrita sem role de `admin` recebe ` `.

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
    "logoUrl": "https://empresax.com/logo.png"
  }'
```

### Listar Parceiros

```bash
curl -X GET http://localhost:3000/api/partners
```

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

## Notas

- Todas as rotas ficam sob o prefixo `/api` (definido em
  [`main.ts`](src/main.ts) via `setGlobalPrefix`).
- O corpo de `POST`/`PATCH` é validado pelo `ValidationPipe` global: campos
  fora do DTO (`CreateUserDto`/`UpdateUserDto`) são rejeitados, e campos
  obrigatórios ausentes retornam `400`.
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
  diferentemente do `logoUrl`.
- O não preenchimento de campos obrigatórios no `POST` retornará 400.
- Campo `shortDescription` possui limite de 150 caracteres, serve para descrever o que a parceria
  com aquela empresa traz de benefícios.
- Nenhum dado é obrigatório na edição dos parceiros, no entanto os campos ainda passam pela validação.
- Tentar cadastrar um email que pertence a outro parceiro retorna `409` no `POST` e `PATCH`
