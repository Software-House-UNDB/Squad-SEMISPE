# Squad SEMISPE — Backend

API em NestJS + TypeORM + MySQL para o `frontend` do Squad SEMISPE (Parque
Tecnologico). Projeto proprio, sem dependencia de nenhum outro sistema.

## Rodando localmente (sem Docker)

```bash
cp .env.example .env
npm install
npm run start:dev
```

API disponivel em `http://localhost:3000/api`, health check em `GET /api/health`.

## Rodando com Docker

Veja o `docker-compose.yml` na raiz do repositorio, que sobe o backend junto com
o banco MySQL e o `frontend`.

```bash
docker compose up
```

## Migrations (TypeORM)

```bash
npm run migration:generate -- src/database/migrations/NomeDaMigration
npm run migration:run
npm run migration:revert
```

## Estrutura

- `src/main.ts`: bootstrap, CORS, prefixo global `/api`, ValidationPipe global
- `src/app.module.ts`: modulo raiz (Config + Database)
- `src/config/configuration.ts`: leitura tipada das variaveis de ambiente
- `src/database/database.module.ts`: conexao TypeORM (MySQL)
- `src/database/data-source.ts`: DataSource usado pelo CLI do TypeORM (migrations)

Autenticacao ainda nao foi implementada. Quando for, o plano e JWT proprio
(`@nestjs/jwt` + `passport-jwt`), com usuarios persistidos no banco deste
projeto.

## API de reservas

Contrato das rotas, exemplos multipart e regras de aprovação em
[reservations-api.md](reservations-api.md).

## API de Fale conosco

Recebimento público, consulta administrativa e configuração futura de SMTP em
[contacts-api.md](contacts-api.md).

## API do Ecossistema de Inovação

CRUD de atores, categorias, filtros e dados GeoJSON para mapa em
[ecosystem-api.md](ecosystem-api.md).
