# TZ Store

Plataforma híbrida de produtos digitais para produtores, afiliados e compradores.

## Stack
- Next.js + React + TypeScript
- NestJS + TypeScript
- PostgreSQL + Prisma
- Redis
- Tailwind CSS + shadcn/ui
- Docker

## Estrutura
- `apps/web`: aplicação web mobile-first
- `apps/api`: API REST versionada
- `packages/ui`: componentes compartilhados
- `packages/config`: configurações compartilhadas
- `prisma`: evolução do schema/banco
- `infra`: infraestrutura local/deploy

## Primeiro objetivo técnico
Subir a fundação local, autenticação e o fluxo mínimo produtor → produto → checkout → pagamento → entrega.

## Referências técnicas
Next.js: https://nextjs.org/docs
NestJS: https://docs.nestjs.com/
Prisma: https://www.prisma.io/docs

## Auth V13
A API agora possui registro, login, JWT de acesso, refresh token rotativo/revogável, `/auth/me` e autorização por papéis. Rotas são protegidas por padrão; use `@Public()` somente quando uma rota realmente precisar ser pública.

## V14 — Primeiro fluxo de negócio

O backend agora possui o fluxo inicial de produtor:

`PRODUTOR → PRODUTO → OFERTA → PUBLICAÇÃO`

Principais endpoints:

- `POST /api/v1/users/me/producer`
- `POST /api/v1/products`
- `GET /api/v1/products/mine`
- `GET /api/v1/products/:id`
- `PATCH /api/v1/products/:id`
- `POST /api/v1/products/:id/archive`
- `POST /api/v1/products/:id/files`
- `GET /api/v1/products/:productId/offers`
- `POST /api/v1/products/:productId/offers`
- `PATCH /api/v1/products/:productId/offers/:id`

A rota web `/producer` existe para teste manual do fluxo.

### Estado de validação

As dependências não foram instaladas completamente neste ambiente, então build/typecheck/migration não foram declarados como executados com sucesso. Antes de desenvolvimento local, instale as dependências, gere o Prisma Client e execute a migration.

## V15 — MVP vertical completo
A V15 fecha o fluxo funcional de validação do MVP em modo local/teste:
`Marketplace → produto → checkout → pedido → pagamento mock → sale → comissão → acesso → biblioteca`, além de programa de afiliados e dashboard administrativo.

### Módulos adicionados
- Affiliates: programas, aplicações e links.
- Checkout: cotação, criação de pedido e confirmação de pagamento de teste.
- Payments: provider `mock` para desenvolvimento; nenhum cartão aberto trafega pelo backend.
- Delivery: concessão de acesso e biblioteca do comprador.
- Storage: endpoint de placeholder; S3-compatible continua obrigatório para produção.
- Admin: métricas básicas protegidas por ADMIN.

### Próximo hardening antes de produção
1. Configurar S3/R2/MinIO e URLs assinadas.
2. Trocar provider mock por Pagar.me/Mercado Pago e implementar webhooks idempotentes.
3. Persistir seller/recipient e KYC conforme contrato do PSP.
4. Adicionar testes unitários/e2e, rate limiting, observabilidade, e-mail e recuperação de senha.
5. Revisar LGPD, termos, antifraude, chargeback, saque e regras de comissão.
