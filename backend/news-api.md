# API de Notícias

Módulo `NewsModule`, conforme a tarefa de Notícias e a seção 3.7 dos requisitos.
Gerencia notícias nas categorias Inovação, Startups, Parque Tecnológico,
Ecossistema e Editais. Escopo restrito ao backend.

## Decisões de escopo

- Toda notícia nasce como rascunho e exige ação explícita de publicação.
- Consultas públicas exibem somente notícias publicadas. Rascunhos retornam 404
  tanto por id quanto por slug, mesmo para administradores nas rotas públicas.
- Criação, edição, publicação, retirada e exclusão exigem JWT de administrador.
- Título, resumo, conteúdo e categoria são obrigatórios, inclusive no rascunho.
- Imagem de destaque e texto alternativo são opcionais, informados por URL/texto.
- Conteúdo é texto simples com múltiplas linhas; não há editor rich text,
  processamento de HTML ou Markdown nesta etapa. Consumidores devem renderizar
  como texto, sem interpretar HTML fornecido no conteúdo.
- Data de publicação é definida pelo servidor, sem agendamento ou retroação.
- Slug é único e estável: mudar o título não altera o endereço. Um administrador
  pode mudar explicitamente o slug, mas isso invalida links anteriores; não há
  redirecionamentos ou histórico de slugs.
- Não adiciona dependências, integrações com redes sociais ou chamadas externas.

## Endpoints

Prefixo global: `/api`.

| Método | Rota | Acesso | Resultado |
| --- | --- | --- | --- |
| GET | `/news/categories` | Público | Lista valores e rótulos das categorias |
| GET | `/news` | Público | Lista paginada de notícias publicadas |
| GET | `/news/:id` | Público | Notícia publicada completa |
| GET | `/news/slug/:slug` | Público | Notícia publicada pelo endereço amigável |
| GET | `/news/admin` | Administrador | Lista paginada, incluindo rascunhos |
| GET | `/news/admin/:id` | Administrador | Notícia completa, inclusive rascunho |
| POST | `/news` | Administrador | Cria rascunho (201) |
| PATCH | `/news/:id` | Administrador | Atualiza campos editoriais (200) |
| POST | `/news/:id/publish` | Administrador | Publica (200) |
| POST | `/news/:id/unpublish` | Administrador | Retorna para rascunho (200) |
| DELETE | `/news/:id` | Administrador | Remove definitivamente (204, sem corpo) |

## Categorias

| Valor | Rótulo |
| --- | --- |
| `innovation` | Inovação |
| `startups` | Startups |
| `technology_park` | Parque Tecnológico |
| `ecosystem` | Ecossistema |
| `notices` | Editais |

Notícias na categoria Editais são conteúdos jornalísticos. Não substituem a
API de Editais e Oportunidades, que possui escopo próprio.

## Cadastro e edição

```sh
curl -X POST http://localhost:3000/api/news \
  -H 'Authorization: Bearer TOKEN_ADMIN' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Novidades do Parque Tecnológico","summary":"Resumo da notícia.","content":"Texto completo da notícia.","category":"innovation","imageUrl":"https://example.com/noticia.jpg","imageAlt":"Participantes de uma atividade no parque"}'
```

| Campo | Regra |
| --- | --- |
| `title` | Obrigatório, texto não vazio, até 200 caracteres |
| `summary` | Obrigatório, texto não vazio, até 500 caracteres |
| `content` | Obrigatório, texto não vazio, até 20.000 caracteres |
| `category` | Obrigatório, uma das cinco categorias |
| `slug` | Opcional na criação; até 200 caracteres, letras ASCII minúsculas, números e hífens simples entre segmentos |
| `imageUrl` | Opcional ou null; URL HTTP/HTTPS completa, até 2.048 caracteres, sem credenciais |
| `imageAlt` | Opcional ou null; texto não vazio, até 300 caracteres |

Textos editoriais e metadados têm espaços nas extremidades removidos.
Campos desconhecidos, inclusive `id`, `status` e `publishedAt`, são rejeitados
na criação/edição. O cliente não pode publicar pelo corpo do POST ou PATCH.
O limite HTTP global do projeto também se aplica ao corpo JSON.

Sem `slug`, a API gera um a partir do título sem acentos, seguido de UUID para
evitar colisões. Títulos sem caracteres latinos usam o prefixo `noticia`.
Um slug personalizado, como `novidades-do-parque`, deve respeitar o formato.
Slugs ficam reservados inclusive em rascunhos. Duplicação, mesmo concorrente,
retorna 409 pela restrição única do MySQL.

PATCH preserva campos omitidos. Título, resumo, conteúdo, categoria e slug não
aceitam null; `imageUrl` e `imageAlt` aceitam null para limpeza. Editar uma
notícia publicada mantém sua publicação e data; para revisar fora do portal,
retire-a de publicação primeiro. Alterações em notícia publicada ficam públicas
imediatamente. Não há versionamento ou revisão pendente nesta etapa.

Respostas de criação, edição e detalhe contêm `id`, `title`, `slug`, `summary`,
`content`, `category`, `imageUrl`, `imageAlt`, `status`, `publishedAt`,
`createdAt` e `updatedAt`. Metadados opcionais ausentes retornam null.

## Publicação

```sh
curl -X POST http://localhost:3000/api/news/123/publish \
  -H 'Authorization: Bearer TOKEN_ADMIN'
```

O servidor muda `status` de `draft` para `published` e atribui `publishedAt`.
Repetir a publicação de uma notícia já publicada mantém a data. Retirar de
publicação muda para `draft` e limpa a data; republicar atribui uma nova data.
Datas são retornadas em JSON ISO 8601.

```sh
curl -X POST http://localhost:3000/api/news/123/unpublish \
  -H 'Authorization: Bearer TOKEN_ADMIN'
```

Publicação, retirada e edição bloqueiam a linha da notícia dentro de transação.
Isso evita perda de campos em edições concorrentes e mantém as alterações de
estado e data consistentes. Não há modificação no cadastro de usuários.

## Consulta e busca

Filtros de `GET /news`:

- `category`: uma das categorias.
- `search`: até 150 caracteres, busca parcial no título ou resumo.
- `page`: padrão 1, mínimo 1, máximo 1.000.000.
- `limit`: padrão 20, mínimo 1, máximo 100.

```sh
curl 'http://localhost:3000/api/news?category=innovation&search=parque&page=1&limit=20'
curl 'http://localhost:3000/api/news/slug/novidades-do-parque'
```

Resposta da listagem: `{ items, total, page, limit }`. Os itens omitem `content`;
o texto completo vem no detalhe. Ordenação pública: data de publicação
decrescente, depois id decrescente. `total` considera os filtros antes da
paginação. Busca parametrizada trata `%`, `_` e `=` como texto literal;
sensibilidade a maiúsculas/acentos segue a collation do MySQL.

`GET /news/admin` aceita os mesmos filtros, mais `status=draft|published`.
Sem status, inclui ambos. A ordem administrativa usa data de criação e id,
decrescentes. A rota pública não aceita o filtro status e aplica sempre
`published`, evitando acesso a rascunhos por manipulação de parâmetros.

## Erros e exclusão

400: payload, slug, categoria, paginação ou id inválido. 401/403: operação
administrativa sem autenticação/perfil. 404: notícia inexistente, removida ou
rascunho consultado publicamente. 409: slug já utilizado. 413: corpo acima do
limite HTTP. Exclusão é definitiva; excluir novamente retorna 404.

## Banco e testes

Tabela `news`, migration `1794490000000-CreateNews`, com índice único de slug e
índice para consulta de publicações. `down` remove somente a tabela `news`.
Em um banco novo sem sincronização automática:

```sh
npm run migration:run
npm run build
npm run start:prod
```

O banco local existente usa `synchronize` e não possui histórico das migrations
anteriores. Foi preservado. Não executar a sequência histórica nesse banco sem
preparar uma baseline; testes usam bancos isolados sem synchronize.

```sh
npm test -- --runInBand
npm run build
npm run test:news:docker
```

O teste Docker requer `semispe-db` e `semispe-back` iniciados. Cria um banco
isolado `semispe_news_test_<sufixo>`, valida migrations down/up e alinhamento
de schema, HTTP, proteção de rascunhos, categorias, busca literal, paginação,
publicação, retirada, republicação, edições e slug duplicado sob concorrência,
texto Unicode longo, limpeza de imagem e exclusão. Revoga permissões temporárias
e remove o banco ao terminar.

Para outro MySQL, criar banco vazio com esse prefixo, configurar `DB_*` e executar
`NODE_ENV=production npm run test:news:mysql`. Esse comando não cria nem remove
o banco por conta própria.

## Integrações futuras

Frontend da página de notícias, editor administrativo, upload/armazenamento de
imagens, botões de compartilhamento, URLs de páginas e metadados sociais
(Open Graph) ficam para a integração do frontend. A API fornece o slug estável,
título, resumo e imagem para esse uso; não publica automaticamente em redes
sociais. Não foram criados links para páginas que ainda não existem.
