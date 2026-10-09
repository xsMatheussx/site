# TZ Store V17 — Gateway real + Split + Webhooks

## O que entrou
- Abstração `PaymentProvider` para não acoplar checkout ao gateway.
- Adapter Pagar.me API V5 usando `POST /core/v5/orders`.
- Suporte a PIX no adapter real.
- Cartão bloqueado no backend quando não houver tokenização: a TZ não trafega PAN/CVV abertos.
- `PaymentAccount` para vincular usuário a `externalRecipientId` do gateway.
- Split em valores (`flat`) entre produtor e afiliado quando ambos possuem recebedor.
- Webhook Pagar.me com validação HMAC-SHA1 e `timingSafeEqual`.
- Idempotência por `provider + externalEventId`.
- Webhook pago atualiza Payment/Order, cria Sale/Commission e libera Access de forma transacional.
- `.env.example` com configuração do Pagar.me.

## Importante
A criação de recebedores reais exige cadastro/KYC e dados bancários do seller no Pagar.me. O código prepara o vínculo, mas não inventa nem cria credenciais/contas externas.

## Próxima etapa
- endpoint administrativo/producer para onboarding de recipient;
- S3/R2 privado + URLs presigned;
- tokenização de cartão no frontend;
- refund/chargeback/reconciliation;
- testes E2E e validação contra sandbox Pagar.me.

## Validação
Esta versão não declara `npm install`, build, typecheck, Prisma generate/migrate ou testes como aprovados sem executar as dependências no ambiente.
