# Correções da revisão do backend — 12/11/2026

Esta entrega corrige falhas reproduzidas diretamente nas APIs e no MySQL.
Não altera frontend nem define horários de funcionamento do parque.

## Regras corrigidas

1. **Preservação de ideias:** FK `ideas.authorId` usa `ON DELETE RESTRICT`.
   Excluir conta com qualquer ideia vinculada retorna 409, inclusive para
   administradores. Conta sem ideias continua podendo ser excluída. Não houve
   exclusão lógica, anonimização ou remoção automática de ideias; uma política
   de exclusão/anonimização mais ampla pode ser definida em tarefa própria.
2. **Espaços reservados:** PATCH bloqueia a linha do espaço antes de consultar
   reservas aprovadas futuras ou em andamento. Reduzir a capacidade abaixo da
   quantidade de participantes, ou retirar equipamento necessário, retorna 409
   e não grava a alteração. Aumento compatível e alterações de descrição seguem
   permitidos. Reservas canceladas, rejeitadas, pendentes ou encerradas não
   bloqueiam o cadastro. A verificação usa horário local de São Luís (UTC-03)
   para identificar reservas encerradas; não introduz regra de expediente.
3. **Revogação de sessões:** `users.tokenVersion`, inteiro com padrão zero,
   é incluído no JWT. A validação confere a versão atual da conta. Troca de senha
   incrementa a versão em transação com bloqueio de linha, incluindo alterações
   concorrentes. Tokens anteriores recebem 401; novo login emite versão atual.
   O campo não é exposto nas respostas de usuários nem aceito nos DTOs.
4. **Validações:** descrições de espaços e parceiros limitadas a 5.000 caracteres
   no POST/PATCH. Parceiros têm textos aparados e e-mail normalizado para
   minúsculas. Nome, descrição e resumo não aceitam somente espaços. Entradas
   anteriormente causadoras de erro 500 são rejeitadas com 400 antes do banco.
5. **Limite de reservas:** POST público limita cinco tentativas por IP por minuto,
   incluindo tentativas inválidas. ThrottlerGuard executa antes do interceptor
   multipart, impedindo processamento de upload após o limite. A sexta tentativa
   recebe 429 e Retry-After. Alterar X-Forwarded-For não contorna o limite na
   configuração atual. Auth, Contatos e Reservas usam um RateLimitModule comum;
   os contadores permanecem separados por rota.

## Migration e atualização

`1794496000000-FixBackendIntegrity` adiciona `users.tokenVersion` e troca a FK
de ideias para RESTRICT. Não remove registros existentes. Foi testada com conta
e ideia implementada criadas no schema anterior; os dois registros permaneceram
intactos após upgrade, reversão e reaplicação.

Em ambiente com histórico de migrations regularizado, aplicar a migration antes
de iniciar o código atualizado. Em seguida, reiniciar todas as instâncias da API.
**Tokens emitidos antes desta entrega não possuem a nova claim e exigem login
novamente**, mesmo que o usuário ainda não tenha trocado a senha.

O banco local de desenvolvimento usa synchronize e não tem baseline histórica.
Não executar todas as migrations antigas sobre ele sem planejar a baseline.
O teste desta entrega usa banco vazio isolado; não cria registros no banco real.

O `down` remove a coluna e restaura CASCADE para permitir rollback técnico.
Isso reintroduz a regra anterior de exclusão e só deve acompanhar retorno ao
código anterior. Não reverter essa migration mantendo o código novo em execução.

## Dependências e lint

TypeORM permanece em 0.3.x, sem downgrade de Nest/Jest. Overrides restritos aos
pacotes pais atualizam glob para 14.0.2 e minimatch para 11.0.1 nas cadeias
afetadas. `npm ci --ignore-scripts` foi validado no container Node 20 e o
`npm audit --omit=dev` não reporta vulnerabilidades após a correção.

A auditoria completa ainda aponta nove entradas de severidade baixa na cadeia
de deepmerge de ferramentas de desenvolvimento. Não são nove falhas independentes.
O caminho sugerido pelo npm envolve downgrade incompatível do Nest CLI; não foi
aplicado. Esses alertas permanecem documentados para atualização compatível futura.

`.gitattributes` fixa LF para arquivos versionados do backend. Prettier aceita
o final de linha do checkout atual (`endOfLine: auto`), evitando falhas artificiais
em cópias Windows. A tipagem de testes HTTP/E2E foi corrigida, assim como o aviso
da promessa de bootstrap. Lint global agora pode ser executado sem ignorar regras.

## Testes

```sh
npx eslint "src/**/*.ts" "test/**/*.ts"
npm test -- --runInBand
npm run build
npm run test:integrity:docker
npm run test:reservations:docker
npm run test:contacts:docker
npm run test:ecosystem:docker
npm run test:news:docker
npm audit --omit=dev
```

O teste de integridade requer `semispe-db` e `semispe-back` iniciados, cria banco
`semispe_integrity_test_<sufixo>` e remove banco e permissões ao finalizar.
Testa upgrade com dados antigos, schema completo, FK, JWT anterior e novo,
trocas concorrentes de senha, alteração de capacidade/equipamentos, reservas
em andamento, histórico, cancelamento, cinco disputas reais entre mudança de
capacidade e aprovação, validações e bloqueio da sexta requisição pública.

Para MySQL externo, criar banco vazio com esse prefixo, configurar `DB_*` e
executar `NODE_ENV=production npm run test:integrity:mysql`. Nesse modo a criação
e remoção do banco são responsabilidade do executor.

Os testes de persistência de reservas reiniciam o orçamento do rate limit entre
cenários independentes. O comportamento real do limite é verificado separadamente
no teste HTTP e no teste de integridade; não foi desabilitado no código da API.

## Fora desta correção

Regra de horários do parque, integração com frontend, APIs ainda pendentes,
paginação das listagens antigas, worker de e-mail, infraestrutura de produção
e política completa de anonimização permanecem em tarefas próprias. Nenhum
campo ou regra foi adicionado ao frontend nesta entrega.
