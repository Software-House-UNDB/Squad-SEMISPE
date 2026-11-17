# Módulo administrativo de reservas

## Escopo e acesso

Primeiro módulo operacional do [painel geral do portal](admin-panel.md): consultar
solicitações, conferir detalhes/anexos e aprovar ou rejeitar pedidos pendentes.
Frontend em `/admin/reservas`; `/admin` abre a visão geral de todas as áreas de
gestão. O rodapé do site contém o link de acesso ao painel geral.

O login reutiliza `POST /api/auth/login` e `GET /api/users/:id`. Somente contas
com papel `admin` acessam o painel. Cadastro público continua criando usuários
comuns; esta entrega não oferece promoção de conta ou cadastro público de admin.
Cada endpoint administrativo valida novamente JWT e papel com os guards existentes.
Uma conta comum recebe 403; sessão ausente, expirada ou revogada recebe 401.

## Backend

- `GET /api/reservations`: lista paginada com filtros `status`, `spaceId`, `date`,
  `page`, `limit` e inclui o cadastro atual de `space` em cada pedido.
- `GET /api/reservations/summary`: retorna `{pending, approved, rejected,
  cancelled, total}` como números, incluindo zeros. O resumo abrange todo o
  histórico e não depende dos filtros da lista.
- `GET /api/reservations/:id`: dados completos, espaço atual e metadados dos anexos.
- `GET /api/reservations/:id/attachments/:attachmentId`: download restrito do arquivo.
- `PATCH /api/reservations/:id/status`: recebe `status` e `reviewNote` opcional
  de até 2.000 caracteres. O painel oferece `approved` e `rejected` para pedidos
  pendentes; o revisor é obtido do JWT, nunca enviado pelo frontend.

Consultas, decisões e downloads administrativos recebem `Cache-Control: no-store`.
O corpo dos arquivos não integra a listagem nem o detalhe. A agenda pública
continua mostrando apenas intervalos aprovados, sem dados pessoais.

A aprovação reutiliza a transação e os locks existentes: verifica espaço ativo,
capacidade, equipamentos, período futuro e sobreposição. Uma disputa de aprovação
ou tentativa de reanálise devolve 409. A rejeição registra a decisão sem ocupar a
agenda. Não foi criada outra tabela ou migration nesta etapa.

## Frontend e decisões

A organização segue Models, Services, ViewModels e Views do projeto. O painel
reutiliza a identidade visual, campos, botões, sessão e rodapé do site. Componentes
específicos ficam em `views/components/admin`.

- Filtro inicial: pendentes, com 10 solicitações por página, mais recentes primeiro.
  Espaços inativos também aparecem no filtro para permitir consulta do histórico.
- Os filtros e o pedido selecionado ficam na URL; filtros novos reiniciam a página.
  Não são colocados dados pessoais ou tokens na URL.
- Resumo, lista e detalhe se atualizam periodicamente e após uma decisão.
- Aprovação/rejeição exigem confirmação em janela com protocolo, sala, data e
  horário. Observação opcional; não há promessa de notificação por e-mail.
- Durante o envio, os controles impedem duplicação e troca do pedido pela interface.
  PATCH nunca é repetido automaticamente. Em falha de rede, os dados são consultados
  novamente, pois a decisão pode ter sido gravada antes da perda da resposta.
- Após 409, o painel apresenta a mensagem da API e atualiza os dados; não apresenta
  sucesso fictício. Pedidos já analisados exibem decisão, observação, data e revisor.
- Downloads usam Blob e Authorization no cabeçalho; o token não integra links.
- Sessão expirada retorna ao login. Sair limpa as consultas administrativas em memória.

## Desenvolvimento e validação

Iniciar MySQL/backend/frontend pelo ambiente existente e configurar `VITE_API_URL`
e CORS conforme a integração de reservas. O backend em Docker pode exigir reinício
se o watcher não detectar alterações nos arquivos montados pelo Windows.

Para acesso local, reutilizar o comando já existente:
`docker exec semispe-back npm run dev:spaces-admin`. Ele só funciona em
`NODE_ENV=development`, verifica conflitos antes de criar a conta e usa as
credenciais de exemplo documentadas em `api.md`. Não usar essa conta em produção;
a concessão de papel administrativo real continua sob responsabilidade da equipe.

Verificar com `npm test -- --runInBand`, `npm run build` e
`npm run test:reservations:docker` no backend; `npm test`, `npm run lint` e
`npm run build` no frontend. Os testes MySQL usam banco isolado descartável.

Validação em 17/11/2026: 424 testes de backend e 25 de frontend passaram; builds,
lint dos arquivos de backend alterados e integração de reservas com MySQL aprovados.
O lint do frontend mantém apenas avisos anteriores na Home/About/partículas; o
build mantém o aviso anterior de tamanho do bundle. No navegador foram conferidos
login administrativo, bloqueio de conta comum, listagem/detalhes, download real,
aprovação, rejeição, observações e bloqueio de conflito. Revisor e decisões foram
confirmados no banco. Conta solicitante e pedidos temporários removidos ao final;
a conta administrativa local de exemplo foi preservada para conferência.

## Próximas etapas

Cancelamento pela interface, edição de pedidos, gestão dos demais módulos,
gestão de usuários/permissões e notificações por e-mail não fazem parte desta
primeira etapa. A API de cancelamento já existente permanece disponível apenas
para administradores, sem ação correspondente neste painel.
