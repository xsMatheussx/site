# TZ Store — Auditoria e consolidação final

Data: 15/09/2026

## Diagnóstico principal

O problema visual do produtor não era apenas CSS. Havia uma combinação de arquitetura e implementação:

1. `/producer` usava markup antigo com classes globais (`stat-grid`, `grid-2`, `card`) enquanto o novo CSS tentava estilizar seletores diferentes.
2. O CSS premium anterior usava `.dashboard-page` e `.dashboard-page-head`, mas o shell atual renderiza `.dashboard-content` e classes de item de navegação diferentes.
3. `/producer/products` é atendido por `app/producer/[section]/page.tsx`, e esse arquivo tinha recebido uma substituição parcial que deixou a seção `products` duplicada dentro do contador da toolbar.
4. As atualizações pós-criação/upload/publicação usavam `queueMicrotask` e não aguardavam o refresh da API.
5. O cadastro visual de categoria existia no frontend, mas `Product` não possuía `category` no Prisma e o service não persistia o campo.
6. O projeto tinha um `globals.css` extremamente acumulado, com múltiplas camadas de overrides e trechos de codificação corrompida.
7. O shell usava `<a>` para a navegação interna e calculava a rota atual diretamente de `window.location`, reduzindo a integração com o roteador do Next.

## Correções desta versão

- Novo dashboard `/producer` com layout premium, formulário funcional, catálogo, gestão de arquivo e publicação.
- `ProducerVisual` integrado ao dashboard e alimentado pelos dados reais do catálogo.
- Novo `/producer/[section]` sem duplicação de markup para Produtos.
- Estados de loading, vazio, erro e sucesso revisados.
- Refresh de dados agora é aguardado após mutações.
- Slug automático baseado no nome, com possibilidade de edição manual.
- Navegação interna do shell migrada para `next/link`.
- `usePathname()` utilizado para estado ativo da navegação.
- Navegação mobile horizontal adicionada ao shell.
- Marca TZ padronizada pelo asset `/public/tz-master-mark.svg` nas telas novas.
- Efeito lateral persistente do `page-transition` removido sem desativar o scroll vertical.
- Campo `category` adicionado ao modelo `Product`, DTOs, service e listagem pública.
- Migration `20260915070000_add_product_category` adicionada.
- `shortDescription` removido dos DTOs porque não existe no modelo Prisma atual.
- Versões do frontend fixadas em relação às versões presentes no lockfile.

## Validações executadas

- Verificação de imports locais: nenhum import local ausente.
- Verificação sintática TypeScript/TSX via transpile do TypeScript: sem erros de sintaxe nos arquivos da aplicação; somente `next-env.d.ts` provocou uma limitação do transpiler isolado.
- Balanceamento de chaves CSS: sem arquivos CSS com chaves desbalanceadas.
- Verificação de rotas referenciadas pelo `SiteShell`: sem links internos ausentes.
- Verificação de arquivos `.env`/segredos no pacote: nenhum encontrado.

## Limitação

O ambiente desta auditoria não conseguiu acessar o registro npm, portanto não foi possível reinstalar as dependências e executar `pnpm build`/`pnpm typecheck` sobre a versão final aqui. A validação final de build deve ser feita no Windows do projeto depois de aplicar a migration e instalar as dependências.

## Aplicação local

1. Faça backup da pasta atual.
2. Extraia esta versão por cima do projeto, preservando seus `.env` locais.
3. Rode a migration do Prisma.
4. Gere o Prisma Client.
5. Rode typecheck/build.
6. Suba API e web e teste `/producer` e `/producer/products`.
