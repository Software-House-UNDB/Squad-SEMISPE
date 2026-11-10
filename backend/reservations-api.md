# API de reservas de espaços

Módulo NestJS `ReservationsModule`, integrado ao cadastro existente por `spaceId`.
Reutiliza `SpacesService` dentro do backend, sem chamadas HTTP para a própria API.
O frontend não faz parte desta implementação.

## Rotas

Todas as rotas usam o prefixo `/api`.

| Método | Rota | Acesso | Resultado |
| --- | --- | --- | --- |
| POST | `/reservations` | Público | Envia uma solicitação com anexos; retorna 201 |
| GET | `/reservations/spaces/:spaceId/schedule?date=AAAA-MM-DD` | Público | Horários ocupados por reservas aprovadas, sem dados pessoais |
| GET | `/reservations` | Administrador (Bearer JWT) | Lista paginada de solicitações |
| GET | `/reservations/:id` | Administrador (Bearer JWT) | Dados completos e metadados dos anexos |
| PATCH | `/reservations/:id/status` | Administrador (Bearer JWT) | Aprova, rejeita ou cancela |
| GET | `/reservations/:id/attachments/:attachmentId` | Administrador (Bearer JWT) | Download do anexo vinculado à reserva |

Filtros da listagem: `spaceId`, `date`, `status`, `page` (padrão 1), `limit`
(padrão 20, máximo 100). Resposta: `{ items, total, page, limit }`.

## Envio multipart

`Content-Type: multipart/form-data`, com um campo textual `dados` contendo JSON e
os campos de arquivo `oficio` (obrigatório), `projeto`, `apresentacao` e `pauta`
(opcionais). Máximo de um arquivo por campo, 10 MB por arquivo e 64 KB no JSON.
Não definir manualmente o boundary ao usar FormData ou cURL.

Exemplo do campo `dados` (substitua espaço, equipamentos e data por valores reais):

```json
{
  "requester": {
    "name": "Maria Silva",
    "email": "maria@example.com",
    "phone": "98999999999",
    "type": "pessoa-fisica",
    "institution": null,
    "document": "52998224725"
  },
  "spaceId": 1,
  "date": "2099-06-10",
  "startTime": "09:00",
  "endTime": "10:00",
  "participants": 10,
  "eventType": "Reunião",
  "equipment": [],
  "needsItSupport": false,
  "subject": "Reunião de planejamento",
  "consent": true
}
```

Para instituição, usar `type: "instituicao"`, nome da instituição e CNPJ em
`document`. Para pessoa física, informar CPF e deixar `institution` nulo ou
omitir. CPF/CNPJ e telefone devem conter somente dígitos. Os documentos passam
por validação de tamanho e dígitos verificadores. O consentimento deve ser `true`.
Campos desconhecidos, inclusive dentro de `requester`, são rejeitados.

Com o JSON salvo em `dados.json`:

```sh
curl -X POST http://localhost:3000/api/reservations \
  -F 'dados=<dados.json' \
  -F 'oficio=@oficio.pdf'
```

Resposta pública:

```json
{ "id": 123, "status": "pending", "createdAt": "2026-11-10T15:00:00.000Z" }
```

Datas e horários são locais de São Luís (UTC-03:00), independentemente do fuso
do servidor. Início e término devem estar no mesmo dia, com início no futuro e
término posterior ao início. O envio usa `HH:MM`; horários lidos do MySQL são
retornados como `HH:MM:SS`.

## Regras de agenda e análise

- Todo pedido começa em `pending`.
- Pendentes podem compartilhar horário; não bloqueiam a agenda.
- Um intervalo já aprovado impede novos pedidos sobrepostos e outras aprovações.
- Intervalos são tratados como `[início, término)`: uma reserva pode começar
  exatamente quando a anterior terminar.
- O espaço precisa estar ativo, comportar os participantes e possuir todos os
  equipamentos solicitados. `equipment: []` indica nenhum equipamento necessário.
- Estado, capacidade, equipamentos, início no futuro e conflitos são revalidados
  na aprovação.
- `pending` pode passar para `approved`, `rejected` ou `cancelled`.
- `approved` pode passar para `cancelled`, liberando o intervalo.
- Rejeitadas e canceladas não podem ser reabertas. Para outro horário, enviar um
  novo pedido. Não há edição ou exclusão de solicitações nesta versão.
- A decisão registra `reviewedBy` a partir do JWT, `reviewedAt` e `reviewNote`
  opcional (até 2.000 caracteres). Esses campos refletem a última decisão.
- O espaço com histórico de reservas não pode ser excluído; desative-o.

Exemplo de análise:

```sh
curl -X PATCH http://localhost:3000/api/reservations/123/status \
  -H 'Authorization: Bearer TOKEN_ADMIN' \
  -H 'Content-Type: application/json' \
  -d '{"status":"approved","reviewNote":"Uso autorizado"}'
```

Criação e análise usam transações MySQL/InnoDB e bloqueio pessimista da linha do
espaço antes da leitura de conflitos. Isso serializa decisões concorrentes para
o mesmo espaço. Falha ao salvar qualquer anexo desfaz o pedido inteiro.

## Arquivos e persistência

Tabelas: `reservations` e `reservation_attachments`. Os anexos ficam no MySQL em
`longblob`, junto da transação, sem diretório público ou dependência de volume de
uploads. O conteúdo não é selecionado em consultas comuns; apenas no download
administrativo, com `Content-Disposition: attachment`.

Formatos aceitos: PDF, DOC, DOCX, PPT, PPTX, JPG, JPEG e PNG. A API confere extensão,
tamanho e assinatura inicial do conteúdo; não confia no MIME informado pelo
cliente. Para documentos Office, isso verifica o contêiner OLE/ZIP, não a
estrutura interna completa. Não há antivírus integrado nesta versão.

## Banco e execução

Configurar o `.env` conforme `.env.example`. Antes de subir em produção
(`NODE_ENV=production`, com synchronize desativado), executar:

```sh
npm run migration:run
npm run build
npm run start:prod
```

Migration: `1794300000000-CreateReservations`. O `down` remove somente as duas
tabelas novas. Backups e o limite `max_allowed_packet` do MySQL devem comportar os
anexos de até 10 MB.

O banco local existente foi criado com `synchronize` e não possui histórico de
migrations. Suas tabelas foram preservadas. Não executar a sequência histórica
de migrations sobre esse banco sem antes planejar uma baseline: as tabelas já
existentes causariam conflitos. A instalação por migrations foi validada em um
banco vazio, com `NODE_ENV=production` e sem sincronização automática.

Erros principais: 400 (dados, intervalo, espaço inativo, capacidade ou anexos
inválidos), 401/403 (autenticação/perfil), 404 (recurso inexistente), 409
(sobreposição ou transição de status inválida), 413 (arquivo acima do limite).

## Validação

```sh
npm test -- --runInBand
npm run build
npm run test:reservations:docker
```

Os testes cobrem HTTP multipart com o ValidationPipe global, JWT/perfis, downloads,
DTOs, limites de upload, regras de domínio e uso dos locks/transações. Os testes de
serviço usam repositories/EntityManager simulados: não substituem a execução da
migration e de aprovações concorrentes em uma instância real do MySQL.

O comando `test:reservations:docker` executa a integração real nos containers
`semispe-db` e `semispe-back`, que precisam estar iniciados. Cria um banco
temporário exclusivo, executa todas as migrations, testa reversão/reaplicação da
migration de reservas e inicia uma aplicação de teste sem `synchronize`.
Verifica envio HTTP, persistência, permissões, downloads, seis disputas entre
aprovações, decisões simultâneas sobre o mesmo pedido, cancelamento, intervalos
adjacentes, rollback por falha no anexo e upload/download de 10 MB. Ao terminar,
revoga as permissões temporárias e remove o banco, inclusive em caso de falha.

Para outro MySQL, provisionar um banco vazio com nome
`semispe_reservations_test_<sufixo>`, configurar `DB_*` e executar
`NODE_ENV=production npm run test:reservations:mysql`. Esse comando exige banco
exclusivo e vazio; não cria nem remove o banco por conta própria.

E-mail, painel administrativo e integração com o frontend ficam fora desta etapa.
