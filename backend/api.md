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

## Users

### Criar usuário

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

## Partners

### Criar Parceiro

```bash
curl -X POST http://localhost:3000/api/partners \
  -H "Content-Type: application/json" \
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
  -d '{
    "logoUrl": "http://empresay.com/logo.png"
  }'
```

### Remover um parceiro

```bash
curl -X DELETE http://localhost:3000/api/partners/1
```

## Notas

- Todas as rotas ficam sob o prefixo `/api` (definido em
  [`main.ts`](src/main.ts) via `setGlobalPrefix`).
- O corpo de `POST`/`PATCH` é validado pelo `ValidationPipe` global: campos
  fora do DTO (`CreateUserDto`/`UpdateUserDto`) são rejeitados, e campos
  obrigatórios ausentes retornam `400`.
- O campo `password` nunca volta nas respostas (`@Exclude()` na entity
  `User`).
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
