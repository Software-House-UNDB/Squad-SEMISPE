# Padrão NestJS: um módulo por feature

Este backend segue a arquitetura modular padrão do NestJS: cada funcionalidade de
domínio vira um **módulo próprio**, isolado, com suas próprias rotas, regras de
negócio e acesso a dados. O Nest cuida da injeção de dependência entre as peças —
nada é instanciado manualmente.

## Anatomia de um módulo

Um módulo de feature (ex.: `users`) tem até 4 tipos de arquivo:

```
src/<feature>/
├── entities/
│   └── <feature>.entity.ts     # mapeamento da tabela (TypeORM)
├── dto/
│   ├── create-<feature>.dto.ts # forma dos dados aceitos na criação
│   └── update-<feature>.dto.ts # geralmente um Partial do create
├── <feature>.service.ts        # regra de negócio + acesso ao repository
├── <feature>.controller.ts     # rotas HTTP, sem lógica de negócio
└── <feature>.module.ts         # registra e conecta as peças acima
```

### Entity

Classe decorada com `@Entity()` que representa a tabela no MySQL. Colunas
sensíveis (senha, tokens) usam `@Exclude()` do `class-transformer` para nunca
vazar em uma resposta JSON.

### DTOs

Classes com decorators do `class-validator` (`@IsString`, `@IsEmail`,
`@MinLength`, etc.). O `ValidationPipe` global configurado em
[`main.ts`](src/main.ts) usa esses decorators para validar o corpo da
requisição automaticamente — se o payload não bater com o DTO, a requisição é
rejeitada antes de chegar no controller. O DTO de update normalmente estende o
de create com `PartialType` (`@nestjs/mapped-types`), deixando todos os campos
opcionais sem repetir as regras de validação.

### Service

Onde vive a regra de negócio. Recebe o `Repository<Entity>` do TypeORM via
`@InjectRepository()` no construtor e expõe métodos como `create`, `findAll`,
`findOne`, `update`, `remove`. Não conhece nada de HTTP (sem `@Req`, sem
status code) — isso é responsabilidade do controller.

### Controller

Só traduz rotas HTTP em chamadas ao service. `@Controller('users')` gera rotas
sob `/api/users` (o prefixo `/api` vem do `setGlobalPrefix` em `main.ts`).
Parâmetros de rota usam pipes (`ParseIntPipe`) e o corpo usa o DTO
correspondente via `@Body()`.

### Module

Amarra tudo: registra a entity no TypeORM (`TypeOrmModule.forFeature([...])`),
declara o controller e o service, e exporta o service caso outro módulo
precise dele (ex.: o módulo `auth` injetando `UsersService` para
validar login).

## Fluxo de injeção de dependência

```
UsersModule
 ├─ TypeOrmModule.forFeature([User])  → disponibiliza Repository<User>
 ├─ UsersController  ← injeta UsersService
 └─ UsersService      ← injeta Repository<User>
```

O `AppModule` importa `UsersModule` (junto com `ConfigModule` e
`DatabaseModule`, que são globais) e é o único lugar que precisa saber que o
módulo existe — nenhum outro módulo referencia `UsersModule` diretamente a
menos que precise do `UsersService` exportado.

## Passo a passo para criar um módulo novo

Usando `orders` como exemplo:

1. `src/orders/entities/order.entity.ts` — `@Entity('orders')` com as colunas.
2. `src/orders/dto/create-order.dto.ts` — campos aceitos na criação, com
   decorators de validação.
3. `src/orders/dto/update-order.dto.ts` — `export class UpdateOrderDto extends PartialType(CreateOrderDto) {}`.
4. `src/orders/orders.service.ts` — injeta `Repository<Order>`, implementa
   `create/findAll/findOne/update/remove`.
5. `src/orders/orders.controller.ts` — `@Controller('orders')`, mapeia
   `POST/GET/GET:id/PATCH:id/DELETE:id` para os métodos do service.
6. `src/orders/orders.module.ts` — `TypeOrmModule.forFeature([Order])`,
   declara controller/service, exporta o service se necessário.
7. Registrar `OrdersModule` no array `imports` de
   [`app.module.ts`](src/app.module.ts).
8. Gerar e rodar a migration:
   ```bash
   npm run migration:generate -- src/database/migrations/CreateOrders
   npm run migration:run
   ```
   (`synchronize` só está ligado em desenvolvimento — ver
   [`database.module.ts`](src/database/database.module.ts) — produção sempre
   passa por migration.)

## Exemplo real neste projeto

O módulo [`users`](src/users) implementa exatamente esse padrão: CRUD
completo, senha com hash via `bcrypt` no service, senha nunca exposta na
resposta (`@Exclude()` na entity + `ClassSerializerInterceptor` no
controller). O módulo `auth` (JWT) injeta `UsersService` para validar credenciais
e conferir a versão da sessão em cada requisição protegida.

## Alternativa: gerar via Nest CLI

```bash
npx nest g resource <feature>
```

Gera controller, service, module e DTOs de uma vez (pergunta REST ou GraphQL
e se quer os métodos CRUD prontos). Equivalente ao passo a passo manual acima,
mas vale sempre conferir o resultado — o gerador não aplica convenções como o
`@Exclude()` de campos sensíveis nem o hash de senha automaticamente.
