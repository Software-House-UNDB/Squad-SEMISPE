# API de Fale conosco

Módulo `ContactsModule`, somente backend. Recebe nome, e-mail, assunto e mensagem,
conforme a seção 3.11 dos requisitos do portal. Não exige cadastro para envio.

## Rotas

Prefixo global: `/api`.

| Método | Rota | Acesso | Resultado |
| --- | --- | --- | --- |
| POST | `/contacts` | Público | Salva a mensagem e tenta notificar o destinatário institucional, se configurado (201) |
| GET | `/contacts` | Administrador, Bearer JWT | Lista paginada e filtrada |
| GET | `/contacts/:id` | Administrador, Bearer JWT | Consulta a mensagem completa |
| PATCH | `/contacts/:id/status` | Administrador, Bearer JWT | Altera o estado de atendimento |
| POST | `/contacts/:id/notification` | Administrador, Bearer JWT | Tenta enviar uma notificação pendente ou falha (201) |

## Envio público

```sh
curl -X POST http://localhost:3000/api/contacts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Maria Silva","email":"maria@example.com","subject":"Visita ao parque","message":"Gostaria de receber informações sobre visitas."}'
```

Os quatro campos são obrigatórios. Nome e assunto têm até 150 caracteres e não
aceitam quebras de linha; e-mail tem até 254 caracteres; mensagem tem até 5.000
caracteres e aceita múltiplas linhas. Espaços nas extremidades são removidos e
o e-mail é convertido para minúsculas. Campos extras são rejeitados, inclusive
`to`, `status` ou `notificationStatus`.

Resposta:

```json
{
  "id": 123,
  "createdAt": "2026-11-10T15:00:00.000Z",
  "message": "Mensagem recebida com sucesso."
}
```

201 confirma que a mensagem foi salva no MySQL. Não confirma entrega de e-mail.
A resposta pública não repete os dados pessoais nem expõe informações SMTP.
O endpoint permite cinco tentativas por IP a cada minuto, incluindo payloads
inválidos; excesso retorna 429. O contador fica na memória de cada instância,
seguindo o Throttler já usado no projeto. Escala horizontal requer armazenamento
compartilhado e configuração adequada do proxy antes de confiar em cabeçalhos de IP.

## Administração

Filtros de `GET /contacts`: `status`, `notificationStatus`, `page` (padrão 1) e
`limit` (padrão 20, máximo 100). Ordenação: mais recentes primeiro. Resposta:
`{ items, total, page, limit }`. Cada item contém os dados da mensagem, datas,
estado de atendimento e estado/tentativas da notificação.

Estados de atendimento, independentes do envio de e-mail:

- `new`: recebido, padrão da criação.
- `read`: lido pela equipe.
- `closed`: atendimento encerrado.

Consultar uma mensagem não muda seu estado. A equipe pode alterá-lo explicitamente
e reabrir um atendimento mudando para `new` ou `read`.

```sh
curl -X PATCH http://localhost:3000/api/contacts/123/status \
  -H 'Authorization: Bearer TOKEN_ADMIN' \
  -H 'Content-Type: application/json' \
  -d '{"status":"read"}'
```

Estados de notificação:

- `pending`: envio ainda não tentado, inclusive quando SMTP está ausente.
- `sent`: servidor SMTP aceitou o destinatário e a mensagem; não equivale a
  confirmação de entrega ou leitura na caixa institucional.
- `failed`: tentativa de envio falhou; a mensagem permanece salva.

O administrador pode filtrar pendências/falhas e tentar notificar novamente:

```sh
curl -X POST http://localhost:3000/api/contacts/123/notification \
  -H 'Authorization: Bearer TOKEN_ADMIN'
```

Retorna `{ id, notificationStatus, notificationAttempts, notifiedAt }`. Sem SMTP,
retorna 503. Se o SMTP falhar, retorna 201 com `notificationStatus: "failed"`;
o resultado deve ser conferido no corpo. Registros já marcados como `sent` não
são reenviados. Transações com bloqueio por mensagem serializam tentativas
concorrentes. Falhas SMTP não fazem o formulário perder a mensagem recebida.

O envio ocorre durante a requisição, com timeouts de conexão e leitura. Não há
worker, agendamento de reenvio, resposta automática ao visitante ou integração
com provedores externos nesta etapa. Depois de configurar SMTP, pendências
anteriores devem ser notificadas explicitamente pelo endpoint administrativo.
SMTP não participa da transação MySQL: falha do processo ou do banco depois da
aceitação SMTP pode deixar o registro pendente e permitir duplicação em uma
tentativa futura. Não há garantia de envio exatamente uma vez entre sistemas.

## Configuração de e-mail (futura)

Sem `SMTP_HOST`, a aplicação inicia normalmente, registra um aviso sem dados
pessoais e salva novas mensagens com envio pendente e zero tentativas.
Não há destinatário nem serviço SMTP real configurado nesta entrega.

Quando o serviço for definido, preencher as variáveis em `.env` ou no ambiente
do backend e reiniciar a aplicação:

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=usuario-do-servico
SMTP_PASSWORD=segredo-do-servico
MAIL_FROM=portal@example.com
CONTACT_TO=contato@example.com
```

`MAIL_FROM` e `CONTACT_TO` devem ser endereços únicos, sem nome de exibição ou
listas. O remetente é fixo; o e-mail do visitante vai em `Reply-To`, e o texto é
enviado como texto simples. O cliente não pode escolher o destinatário. Se
`SMTP_HOST` estiver definido, configuração parcial ou inválida impede o startup.
Credenciais de autenticação podem ser omitidas em relays que não as exijam;
se uma estiver presente, usuário e senha são ambos obrigatórios.

Porta 587 normalmente usa `SMTP_SECURE=false` e STARTTLS obrigatório. Porta 465
usa `SMTP_SECURE=true`. `SMTP_REQUIRE_TLS=false` é reservado para testes locais
ou ambientes que deliberadamente não usem TLS. A validação de certificados não
é desativada. Transporte implementado com
[Nodemailer SMTP](https://nodemailer.com/smtp).

## Persistência e migrations

Tabela `contacts`, migration `1794322000000-CreateContacts`. O `down` remove
somente essa tabela. Em um banco novo, com `synchronize` desativado:

```sh
npm run migration:run
npm run build
npm run start:prod
```

O banco local existente usa sincronização automática e não possui histórico
das migrations anteriores. Ele foi preservado. Não executar toda a sequência
histórica nesse banco sem preparar uma baseline.

Erros: 400 (dados inválidos), 401/403 (acesso restrito), 404 (mensagem inexistente),
429 (limite público), 503 (notificação solicitada sem SMTP), 500 (erro inesperado
de persistência). Não há rota pública de consulta, edição ou exclusão de mensagens.

## Verificação

```sh
npm test -- --runInBand
npm run build
npm run test:contacts:docker
npm run test:reservations:docker
```

O teste Docker requer `semispe-db` e `semispe-back` iniciados e dependências
atualizadas no container. Cria um banco isolado `semispe_contacts_test_<sufixo>`,
executa as migrations sem sincronização, testa reversão/reaplicação de contatos,
HTTP, permissões, paginação, estados e limite de envio. Inicia um servidor SMTP
efêmero em loopback, testa o envio, uma rejeição, reenvios concorrentes e o envio
de pendências recebidas sem SMTP. Nenhuma mensagem sai para servidores externos.
Permissões temporárias e banco de teste são removidos ao finalizar.

Para outro MySQL, provisionar um banco vazio com nome
`semispe_contacts_test_<sufixo>`, configurar `DB_*` e executar
`NODE_ENV=production npm run test:contacts:mysql`. Esse comando não cria nem
remove o banco por conta própria.
