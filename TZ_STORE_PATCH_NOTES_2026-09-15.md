# TZ Store — pacote atualizado

Base: tz-store-v28-release-COMPLETO.zip enviado na conversa.

Principais ajustes incorporados:
- Navegação interna agora possui rotas dinâmicas para áreas de conta, afiliado e administração, evitando links mortos no SiteShell.
- Novos endpoints administrativos para usuários, pedidos, pagamentos, reembolsos, webhooks e logs.
- Novos endpoints de vendas e comissões do afiliado.
- Área de afiliados com ativação, candidatura e geração de link usando a API existente.
- Biblioteca do comprador mantém arquivos e expõe estrutura de cursos/módulos/aulas quando existente.
- Painel administrativo mantém indicadores e catálogo de produtos.
- Correções de textos com encoding quebrado nas áreas auditadas.
- Producer/Marketplace/Checkout preservados sem reiniciar a arquitetura.

Limitações preservadas de forma explícita:
- Não existe modelo/endpoints de cliques ou payouts no backend atual; a navegação não inventa esses dados.
- Configurações/perfil do comprador ainda não possuem endpoints de edição no backend atual.
- O pagamento segue a arquitetura de provider existente (mock ou Pagar.me conforme configuração).

## Auditoria e consolidação — 15/09/2026

### Correções aplicadas
- Refeito o fluxo `/producer` com interface premium, responsiva e orientada à operação real.
- Integrado `ProducerVisual` ao dashboard do produtor.
- Corrigido o refresh após criação de produto, upload e publicação: as operações agora aguardam a atualização real da lista.
- Eliminado o uso de `queueMicrotask` como mecanismo de refresh de dados.
- Criado slug automático a partir do nome, mantendo edição manual quando o produtor altera o slug.
- Refeito `/producer/[section]` para evitar a duplicação de catálogo que existia na seção Produtos.
- Paralelizado o carregamento de ofertas/detalhes de produtos nas seções do produtor.
- Adicionados estados de loading, vazio, erro e sucesso consistentes.
- Navegação do `SiteShell` passou a usar `next/link` e `usePathname`, com navegação mobile horizontal.
- Removido o efeito lateral persistente do `page-transition` sem bloquear o scroll.
- Padronizada a marca usando `/public/tz-master-mark.svg` nas áreas novas.
- Corrigido o campo `category` no backend: ele agora existe no modelo `Product`, é persistido no cadastro e retornado na listagem pública.
- Criada a migration `20260915070000_add_product_category`.
- Removido `shortDescription` dos DTOs porque o modelo Prisma atual não possui esse campo.
- Dependências do frontend foram fixadas nas versões presentes no lockfile para evitar instalação não determinística.

### Observação de validação
O pacote foi auditado estaticamente. A execução de `pnpm install` no ambiente de auditoria não foi possível por indisponibilidade de rede do registro npm; portanto o build final precisa ser confirmado no ambiente local após instalar as dependências e aplicar a migration.
