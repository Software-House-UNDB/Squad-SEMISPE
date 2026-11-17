# Conta e Meus dados

## Interface

O cabeçalho público do portal oferece **Entrar**. Após autenticar, mostra
`Olá, primeiro nome` e um menu com apenas **Meus dados** e **Sair**. O login e o
cadastro reutilizam o modal e a sessão já existentes. O menu fecha ao escolher
uma ação, clicar fora ou pressionar Escape.

Após um login bem-sucedido, contas com papel `admin` são direcionadas para
`/admin`. O papel considerado é o perfil confirmado pela API. Usuários comuns
continuam na página de origem, incluindo o fluxo de reservas. Apenas restaurar
uma sessão já existente não força o administrador a sair de uma página pública.

`/meus-dados` apresenta o perfil autenticado. Nome completo e CPF aparecem
bloqueados, com indicação de cadeado. Campos editáveis nesta etapa: e-mail,
telefone, instituição e CNPJ da instituição. Não foi acrescentada data de
nascimento, pois esse campo não existe no cadastro atual.

O telefone e o CNPJ recebem máscara; a API armazena somente os dígitos.
E-mail é obrigatório e normalizado; campos opcionais vazios são enviados como
`null`. O formulário valida os dados, mostra erros de duplicidade, mantém as
edições em falhas de envio e só confirma sucesso depois da resposta da API.
Alterar o e-mail também altera o identificador usado no próximo login. Não há
fluxo de verificação por e-mail ou notificação automática nesta entrega.

O perfil salvo atualiza a sessão em memória e será usado nas próximas reservas.
Pedidos já enviados preservam os dados registrados no momento da solicitação.
Dados pessoais não são gravados no localStorage; permanecem apenas token e ID,
conforme o mecanismo de sessão existente. Sair limpa a sessão e as consultas em
memória. Sessão expirada exige novo login.

## API

| Método | Rota | Acesso | Comportamento |
| --- | --- | --- | --- |
| GET | `/api/users/me` | Autenticado | Retorna o perfil do titular identificado pelo JWT |
| PATCH | `/api/users/me` | Autenticado | Atualiza apenas e-mail, telefone, instituição e CNPJ |

`UpdateProfileDto` permite apenas `email`, `phone`, `institution` e `cnpj`.
Nome, CPF, papel, senha e ID no corpo recebem 400. O titular é obtido do token;
não há ID de outra conta na URL. Respostas usam `Cache-Control: no-store` e o
serializer existente impede exposição de senha e versão de token.

A rota existente `PATCH /api/users/:id` continua protegida por proprietário/admin,
mas também rejeita nome e CPF na edição da própria conta, inclusive por admin.
Assim, não é possível contornar os campos bloqueados usando a rota anterior.
Um admin ainda pode corrigir a identificação de outra conta pela API administrativa
existente. Mudança de senha e revogação de tokens mantêm as regras anteriores.

Sem nova tabela ou migration. Persistência e conflitos de e-mail/CNPJ reutilizam
`UsersService.update` e sua transação. O backend em Docker deve ser reiniciado
se o watcher do volume Windows não detectar as alterações.

## Verificação

Frontend: `npm test`, `npm run lint`, `npm run build`.
Backend: `npm test -- --runInBand`, `npm run build`,
`npm run test:integrity:docker` (MySQL isolado e descartável).

Os testes cobrem menu, campos bloqueados, atualização do telefone, validação,
duplicidade, sessão expirada, permissões HTTP, bloqueio pela rota antiga e
persistência das alterações no MySQL, incluindo login pelo e-mail atualizado.

Validação em 17/11/2026: 436 testes de backend e 37 de frontend passaram; builds,
lint dos arquivos de backend alterados e integração de integridade com MySQL
aprovados. O frontend mantém apenas os avisos anteriores de lint e tamanho do
bundle. No navegador foram conferidos login pelo cabeçalho, menu com duas ações,
campos bloqueados, atualização real do telefone, persistência após recarregar,
uso do telefone atualizado em nova reserva e logout. A conta de teste foi removida.
