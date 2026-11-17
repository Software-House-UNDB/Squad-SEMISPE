# Integração das reservas

O fluxo `/estrutura` usa o catálogo real de `GET /api/spaces`. Apenas espaços
ativos são oferecidos. Não há fallback para espaços ou IDs fictícios. Erros,
carregamento e catálogo vazio têm mensagens próprias e opção de tentar novamente.

## Executar localmente

1. Inicie banco e backend: `docker compose up -d semispe-db semispe-back`.
2. Configure `VITE_API_URL=http://localhost:3000/api` no `.env` do frontend.
3. No frontend, execute `npm ci` e `npm run dev`. Abra `http://localhost:5173/estrutura`.
4. Em um banco de desenvolvimento sem catálogo, execute uma vez
   `docker exec semispe-back npm run dev:spaces-catalog`.
   Esse comando adiciona as cinco salas e capacidades publicadas no site da SEMISPE,
   preservando os cadastros existentes. Não atribui equipamentos sem confirmação.

O backend permite CORS para `FRONTEND_URL`, que deve corresponder à origem do
frontend. URLs e portas diferentes exigem ajustar ambas as configurações.
Em produção, configure a URL pública HTTPS da API no build do frontend e aplique
as migrations antes de iniciar o backend. O banco local antigo usa synchronize;
nunca aplique todas as migrations históricas nele sem preparar uma baseline.

## Contratos e comportamento

- Cadastro: `POST /users`; login: `POST /auth/login`; perfil: `GET /users/:id`.
  O perfil autenticado preenche os dados disponíveis; as edições no pedido não alteram a conta.
- Agenda: `GET /reservations/spaces/:id/schedule?date=AAAA-MM-DD`, pública e sem
  dados pessoais. A tela Agenda e o assistente consultam reservas aprovadas.
  Datas e horários são de São Luís (`America/Fortaleza`).
- Envio: `POST /reservations` com Bearer JWT, JSON em `dados` e anexos em FormData.
  Não se define Content-Type manualmente, para preservar o boundary do multipart.
- A disponibilidade é atualizada periodicamente e catálogo/agenda são consultados
  novamente antes do envio. A transação do backend continua decidindo conflitos concorrentes.
- Capacidade e equipamentos seguem o cadastro do espaço. Intervalos ocupados
  são removidos das opções; horários adjacentes são permitidos.
- A confirmação mostra o ID real retornado pela API. O pedido permanece `pending`;
  a reserva só é confirmada após análise administrativa. Não há promessa de e-mail automático.
- 401 solicita novo login e preserva o formulário e arquivos em memória na página.
  Outra conta inicia outro formulário; sair explicitamente descarta o rascunho.
  409 permite escolher outro horário; 429 orienta aguardar; falhas de conexão ou
  servidor mantêm as respostas. Não há repetição automática do POST.

## Fotos e pendências

As cinco fotos oficiais ficam em `public/images/spaces`, com fonte documentada
no README desse diretório. Fotos cadastradas na API têm prioridade. A alternativa
local é associada pelo nome da sala, sem presumir IDs. Não foi encontrada foto
do Coworking no site informado; não foram inventados foto, capacidade ou cadastro.
Renomeações de salas exigem cadastrar uma foto na API ou atualizar essa associação.

O painel de análise das reservas está disponível em `/admin/reservas`, para contas
administradoras. Consulte `backend/admin-reservations.md` para o contrato e escopo.
Ainda dependem de definição/implementação: inventário de equipamentos por sala,
dados oficiais do Coworking, demais módulos administrativos e notificações por e-mail.
Não há sincronização com o Google Agenda legado: a agenda desta aplicação mostra
as reservas aprovadas no próprio backend.

## Verificação

Frontend: `npm test`, `npm run lint`, `npm run build`.
Backend: `npm test -- --runInBand`, `npm run build`,
`npm run test:reservations:docker` e `npm run test:integrity:docker`.
Os testes MySQL usam bancos temporários e verificam migrations, permissões,
arquivos, conflitos, concorrência e rollback.

Validação em 17/11/2026: 14 testes de frontend e 420 testes de backend passaram;
builds e lint aprovados (o frontend mantém avisos anteriores na Home/About/partículas
e no tamanho do bundle). Integrações de reservas e integridade passaram no MySQL.
No navegador, foram verificados as cinco fotos, login, capacidade, envio com ofício,
protocolo real e recuperação de sessão expirada sem perder respostas ou anexo.
A conta e a reserva temporárias usadas nessa verificação foram removidas.
