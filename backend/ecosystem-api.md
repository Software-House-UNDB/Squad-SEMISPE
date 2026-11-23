# API do Ecossistema de Inovação

Implementa o cadastro, consulta, edição e remoção dos atores, conforme o card do
Trello fornecido e a seção 3.9 do documento de requisitos. Disponibiliza dados
para a listagem e o mapa do ecossistema de São Luís. Escopo restrito ao backend.

## Decisões de implementação

- Consultas são públicas; criação, edição e remoção exigem JWT de administrador.
- As seis categorias são startups, empresas, universidades, instituições,
  ambientes de inovação e investidores.
- O documento/card não detalha os campos de cada ator. Nesta versão, nome,
  categoria e descrição são obrigatórios; site, logo, endereço, cidade, UF e
  coordenadas são opcionais.
- Atores podem ser cadastrados sem localização e completados posteriormente.
- Atores são independentes de parceiros: participar do ecossistema não implica
  parceria institucional. Não há vínculo ou sincronização automática com `partners`.
- Todo registro cadastrado fica disponível nas consultas públicas. Informar
  somente conteúdo destinado à publicação. Não há rascunhos ou dados privados.
- Nome não é identificador único. A API não deduplica organizações pelo nome e
  não exige CPF/CNPJ, contas de usuário ou vínculo com reservas.

## Endpoints

Prefixo global: `/api`.

| Método | Rota | Acesso | Resposta |
| --- | --- | --- | --- |
| GET | `/ecosystem/categories` | Público | Categorias com valores e rótulos em português |
| GET | `/ecosystem/actors` | Público | Lista paginada e filtrada |
| GET | `/ecosystem/actors/:id` | Público | Ator completo |
| GET | `/ecosystem/map` | Público | GeoJSON paginado dos atores localizados |
| POST | `/ecosystem/actors` | Administrador | Cria e retorna o ator (201) |
| PATCH | `/ecosystem/actors/:id` | Administrador | Atualiza parcialmente (200) |
| DELETE | `/ecosystem/actors/:id` | Administrador | Exclui definitivamente (204, sem corpo) |

Categorias aceitas:

| Valor | Rótulo |
| --- | --- |
| `startup` | Startups |
| `company` | Empresas |
| `university` | Universidades |
| `institution` | Instituições |
| `innovation_environment` | Ambientes de inovação |
| `investor` | Investidores |

## Cadastro

```sh
curl -X POST http://localhost:3000/api/ecosystem/actors \
  -H 'Authorization: Bearer TOKEN_ADMIN' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Organização de exemplo","category":"startup","description":"Descrição pública da organização.","websiteUrl":"https://example.com","city":"São Luís","state":"MA","latitude":-2.53,"longitude":-44.30}'
```

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| `name` | Sim | Texto, até 150 caracteres, não pode estar em branco |
| `category` | Sim | Uma das seis categorias |
| `description` | Sim | Texto público, até 5.000 caracteres, não pode estar em branco |
| `websiteUrl` | Não | URL HTTP/HTTPS completa, até 2.048 caracteres, sem credenciais |
| `logoUrl` | Não | URL HTTP/HTTPS completa, até 2.048 caracteres, sem credenciais |
| `address` | Não | Endereço público, até 255 caracteres |
| `city` | Não | Até 150 caracteres |
| `state` | Não | Sigla de UF brasileira, normalizada para maiúsculas |
| `latitude` | Não | Número JSON entre -90 e 90 |
| `longitude` | Não | Número JSON entre -180 e 180 |

Textos têm espaços nas extremidades removidos. Opcionais podem ser omitidos ou
enviados como `null`. Campos textuais opcionais, quando preenchidos, não podem
ser vazios. As duas coordenadas devem estar presentes juntas ou ambas ausentes;
zero é válido. URLs são armazenadas, sem download ou requisição pelo backend.

Campos extras são rejeitados. A resposta inclui os campos acima, `id`,
`createdAt` e `updatedAt`; opcionais ausentes retornam `null`.

## Consultas, busca e paginação

`GET /ecosystem/actors` aceita:

- `category`: uma das categorias.
- `search`: até 150 caracteres, busca parcial em nome, descrição ou cidade.
- `hasLocation`: `true` para localizados, `false` para não localizados; omitir
  para incluir ambos. Outros valores, inclusive `1` e `0`, são rejeitados.
- `page`: padrão 1, mínimo 1, máximo 1.000.000.
- `limit`: padrão 20, mínimo 1, máximo 100.

```sh
curl 'http://localhost:3000/api/ecosystem/actors?category=startup&search=tecnologia&hasLocation=true&page=1&limit=20'
```

Resposta: `{ items, total, page, limit }`, ordenada por nome e depois por id.
`total` considera os filtros antes da paginação. Busca usa parâmetros SQL e
trata `%`, `_` e `=` como texto literal. Sensibilidade a maiúsculas/acentos segue
a collation do MySQL. Não há filtro fixo de cidade, para permitir organizações
que atuam no ecossistema sem endereço local.

## Mapa

`GET /ecosystem/map` aceita os mesmos filtros e paginação, mas sempre restringe
a atores com as duas coordenadas preenchidas, independentemente de `hasLocation`.
Retorna uma `FeatureCollection` GeoJSON com pontos na ordem `[longitude, latitude]`.
`properties` contém os dados do ator, exceto as coordenadas, que ficam em
`geometry`. `total`, `page` e `limit` são metadados adicionais da coleção.

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 1,
      "geometry": { "type": "Point", "coordinates": [-44.3, -2.53] },
      "properties": {
        "id": 1,
        "name": "Organização de exemplo",
        "category": "startup",
        "description": "Descrição pública da organização.",
        "websiteUrl": "https://example.com",
        "logoUrl": null,
        "address": null,
        "city": "São Luís",
        "state": "MA",
        "createdAt": "2026-11-10T15:00:00.000Z",
        "updatedAt": "2026-11-10T15:00:00.000Z"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

O consumidor deve percorrer as páginas para obter todos os pontos. Resultado
sem atores localizados tem `features: []` e `total: 0`.

## Atualização e exclusão

PATCH preserva campos omitidos. `name`, `category` e `description` não aceitam
`null`. Opcionais aceitam `null` para limpar. Para remover localização, enviar
`{"latitude":null,"longitude":null}`. Para um ator já localizado, é possível
atualizar apenas uma coordenada, preservando a outra. Para um ator sem
localização, a primeira inclusão exige o par completo.

Atualizações usam transação com bloqueio da linha e validam o estado combinado.
Isso preserva alterações em campos distintos quando dois PATCHs são simultâneos.
Excluir não remove parceiros, usuários, contatos ou reservas.

Erros: 400 (dados, coordenadas, filtros ou id inválidos), 401/403 (escrita sem
autorização), 404 (ator inexistente). Excluir novamente um ator removido retorna 404.

## Banco e verificação

Tabela `ecosystem_actors`, migration `1794323000000-CreateEcosystemActors`.
Não adiciona dependências. Em banco novo sem sincronização automática:

```sh
npm run migration:run
npm run build
npm run start:prod
```

O banco local existente usa `synchronize` e não possui histórico das migrations
anteriores. Foi preservado; não aplicar a sequência histórica sem preparar uma
baseline. O teste usa um banco temporário isolado com `NODE_ENV=production`.

```sh
npm test -- --runInBand
npm run build
npm run test:ecosystem:docker
npm run test:contacts:docker
npm run test:reservations:docker
```

O teste Docker requer `semispe-db` e `semispe-back`. Cria um banco exclusivo
`semispe_ecosystem_test_<sufixo>`, executa as migrations, testa down/up e compara
o schema da entity com a migration. Valida HTTP, seis categorias, persistência,
permissões, busca literal, filtros, paginação, GeoJSON, coordenadas zero,
limpeza de opcionais, PATCHs concorrentes e exclusão. Revoga as permissões e
remove o banco temporário ao finalizar.

Para outro MySQL, provisionar banco vazio com esse prefixo, configurar `DB_*`
e executar `NODE_ENV=production npm run test:ecosystem:mysql`. Esse comando não
cria nem remove o banco por conta própria.

## Fora desta etapa

Frontend do mapa, escolha de biblioteca/provedor cartográfico, geocodificação de
endereços e upload de logos não fazem parte desta API. Coordenadas e URLs são
informadas pela equipe no cadastro. Não há dependência de chaves ou serviços
externos para usar os endpoints. Integração automática com parceiros e
importação de dados podem ser avaliadas em tarefas separadas, se necessárias.
