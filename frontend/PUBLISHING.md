# Publicação no GitHub Pages

A publicação usa a branch `gh-pages`; atualizar a `developer` não publica automaticamente.

Com as alterações já integradas na `developer`, execute na raiz do repositório:

```powershell
git switch developer
git pull --ff-only origin developer
cd frontend
npm ci
npm run build:pages
npx gh-pages -d dist
```

Encerre um `npm run dev` local antes de executar `npm ci` para evitar arquivos bloqueados no Windows.
Na aba Actions do GitHub, aguarde `pages build and deployment` terminar com sucesso.

Endereços publicados:

- Home: https://software-house-undb.github.io/Squad-SEMISPE/
- Parceiros: https://software-house-undb.github.io/Squad-SEMISPE/#/parceiros
- Banco de Ideias: https://software-house-undb.github.io/Squad-SEMISPE/#/banco-de-ideias

O build do Pages usa rotas com `#`, permitindo abrir e recarregar páginas internas sem um servidor de rotas.
Os links de seção preservam a rota, por exemplo `/#/quem-somos#atuacao` após o prefixo do repositório.
O desenvolvimento local (`npm run dev`) e o build comum (`npm run build`) continuam com rotas normais.

Para conferir o build antes de publicar:

```powershell
npm run build:pages
npm run preview:pages -- --host 127.0.0.1 --port 4173
```

Abra http://127.0.0.1:4173/Squad-SEMISPE/ e teste a navegação e o recarregamento de Parceiros.

Somente os arquivos de `dist` são publicados. O Pages não hospeda a API nem o MySQL.
O frontend mantém `VITE_API_URL` (ou o padrão `http://localhost:3000/api`); funções que usam a API dependem de um backend acessível e com CORS configurado para o endereço publicado.
Variáveis `VITE_*` são públicas e não devem conter senhas ou segredos.
