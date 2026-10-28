# Dependências e auditoria

Na atualização de segurança de 28/10/2026:

- Mantido NestJS 11, com `@nestjs/platform-express` a partir de 11.2.6 para impedir o rebaixamento observado no `npm audit fix`.
- Atualizado bcrypt para 6.0.0, removendo `node-pre-gyp` e a dependência transitiva vulnerável de `tar`. Os hashes de senha existentes continuam sendo verificados, com teste de regressão usando hash gerado pelo bcrypt 5.1.1.
- Fixado `multer` 2.5.0 por override restrito ao adaptador Express do Nest, pois a versão do adaptador ainda fixa Multer 2.4.0. Reavaliar o override quando o adaptador incorporar a correção.
- Atualizados `body-parser`, `qs`, `fast-uri` e `handlebars` dentro de suas faixas compatíveis.

`npm audit --omit=dev` não aponta vulnerabilidades conhecidas nesta revisão.
A auditoria completa ainda registra nove alertas de baixa severidade na cadeia
de `deepmerge`, usada pelo Nest CLI/Jest. O aviso não tem versão corrigida
publicada; não rebaixar o Nest CLI para 7 para tentar zerar o relatório.

O contador representa também pacotes dependentes afetados, não nove falhas
independentes. Reavaliar os alertas após atualizações dessas ferramentas.

Referências:

- https://github.com/kelektiv/node.bcrypt.js/releases/tag/v6.0.0
- https://github.com/advisories/GHSA-q7qp-rjg7-q26m
- https://github.com/advisories/GHSA-gcqx-w48m-w2h4

Para verificar novamente:

```sh
npm ci
npm run build
npm test -- --runInBand
npm audit --omit=dev
npm audit
```

Em produção, instalar apenas as dependências de execução na imagem final.
O Dockerfile atual é de desenvolvimento e também instala ferramentas de build/teste.
