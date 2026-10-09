# TZ Store — Guia Final Passo a Passo (V28)

> Este é o roteiro operacional consolidado. O código ainda deve ser validado em ambiente limpo antes de produção; as versões de dependências estão como `latest` no pacote legado e devem ser fixadas após a primeira instalação bem-sucedida.

## 1. Pré-requisitos
- Windows 10/11 ou Linux/macOS.
- Node.js 22 LTS.
- Git.
- Docker Desktop.
- pnpm 10.15.x.

Verifique:
```bash
node -v
npm -v
git --version
docker --version
```

Ative pnpm:
```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
pnpm -v
```

## 2. Baixar o projeto
Extraia o ZIP e abra o terminal na pasta que contém `package.json` e `pnpm-workspace.yaml`.

```bash
pnpm install
```
Depois da instalação, gere o lockfile e fixe versões. Não use `--frozen-lockfile` até existir um `pnpm-lock.yaml` revisado.

## 3. Subir infraestrutura local
```bash
docker compose up -d postgres redis
docker compose ps
```
PostgreSQL: `localhost:5432`. Redis: `localhost:6379`.

## 4. Configurar ambiente
Copie `.env.example` para `.env` dentro de `apps/api` se essa for a convenção escolhida pelo runtime.

Valores locais:
```env
DATABASE_URL=postgresql://tz:tz@localhost:5432/tz_store
REDIS_URL=redis://localhost:6379
API_PORT=3001
WEB_ORIGIN=http://localhost:3000
STORAGE_PROVIDER=local
PAYMENT_PROVIDER=mock
NODE_ENV=development
```
Gere um segredo forte para `JWT_ACCESS_SECRET`.

## 5. Prisma
```bash
pnpm --filter @tz/api prisma:generate
pnpm --filter @tz/api prisma:migrate
```
Se for a primeira migration, crie um nome apropriado, por exemplo:
```bash
pnpm --filter @tz/api exec prisma migrate dev --name v28_release_candidate
```

## 6. Rodar API e web
Em dois terminais:
```bash
pnpm --filter @tz/api dev
```
```bash
pnpm --filter @tz/web dev
```
API: `http://localhost:3001`. Web: `http://localhost:3000`.

Teste:
```bash
curl http://localhost:3001/api/v1/health
```

## 7. Validar qualidade antes de avançar
```bash
pnpm typecheck
pnpm build
pnpm --filter @tz/api test:e2e
```
Não prossiga para produção se algum desses comandos falhar.

## 8. Storage de produção — R2/S3
Crie bucket privado. Configure:
```env
STORAGE_PROVIDER=r2
STORAGE_S3_ENDPOINT=https://SEU_ACCOUNT_ID.r2.cloudflarestorage.com
STORAGE_S3_REGION=auto
STORAGE_S3_BUCKET=tz-store-private
STORAGE_S3_ACCESS_KEY_ID=...
STORAGE_S3_SECRET_ACCESS_KEY=...
STORAGE_SIGNED_URL_TTL_SECONDS=300
```
Nunca publique o bucket de produtos digitais. O backend autoriza o acesso e gera URL temporária.

## 9. Pagar.me — modo de teste
Cadastre domínio e obtenha public/secret keys de teste. Configure:
```env
PAYMENT_PROVIDER=pagarme
PAGARME_PUBLIC_KEY=...
PAGARME_SECRET_KEY=...
PAGARME_WEBHOOK_SECRET=...
```
O navegador tokeniza cartão usando a public key; o backend recebe apenas o token.

## 10. Webhooks
Cadastre a URL pública:
`https://SEU_DOMINIO/api/v1/webhooks/pagarme`
Configure eventos de pagamento, recipient e chargeback. Valide assinatura no servidor. Use HTTPS.

## 11. Recipient/KYC
Produtor/afiliado entra na área financeira, envia os dados exigidos pelo provedor e conclui KYC. O TZ guarda apenas o identificador externo e estado operacional necessários; não trate o banco do TZ como repositório dos dados bancários do provedor.

## 12. Checkout
Fluxo obrigatório:
1. catálogo;
2. página do produto;
3. quote/oferta;
4. criação do pedido;
5. tokenização do cartão ou PIX;
6. criação do pagamento;
7. webhook do provedor;
8. venda aprovada;
9. comissão registrada;
10. acesso liberado;
11. download por URL assinada.

A confirmação pública antiga foi removida. A fonte de verdade do pagamento é o provedor/webhook.

## 13. Reembolso e chargeback
Admin usa os endpoints financeiros. O sistema registra refund/dispute, atualiza pedido/pagamento, revoga acesso quando aplicável e grava `FinancialEntry`.

## 14. E-mail
Configure SMTP antes de produção:
```env
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM=no-reply@seudominio.com
```
Implemente/valide o envio real dos tokens de recuperação e verificação antes de ativar o fluxo em produção.

## 15. Redis distribuído
Configure `REDIS_URL` apontando para Redis gerenciado em produção. O guard distribuído usa Redis para contagem por IP/rota. Teste comportamento quando Redis estiver indisponível antes do lançamento.

## 16. Deploy
Recomendação:
- servidor/cluster para API;
- serviço para Next.js;
- PostgreSQL gerenciado;
- Redis gerenciado;
- R2/S3 privado;
- Nginx ou load balancer;
- TLS;
- secrets manager;
- backups automatizados.

CI executa install, typecheck e build. Produção deve exigir aprovação e migration controlada.

## 17. Backups
Configure backup diário do PostgreSQL, retenção definida e teste periódico de restauração. Backup que nunca foi restaurado não deve ser considerado validado.

## 18. LGPD
Publicar Termos, Política de Privacidade e Cookies. Documentar bases legais, retenção, direitos dos titulares, subprocessadores e resposta a incidentes. O texto jurídico final deve ser revisado antes do lançamento.

## 19. Segurança final
Executar:
- auditoria de dependências;
- SAST;
- DAST;
- teste de autorização por papel;
- teste de IDOR em produtos/pedidos/downloads;
- teste de replay de webhook;
- teste de URL assinada expirada;
- teste de rate limit;
- teste de secrets expostos;
- pentest.

## 20. Checklist de lançamento
- [ ] build limpo
- [ ] migrations aplicadas
- [ ] E2E aprovado
- [ ] Pagar.me sandbox aprovado
- [ ] webhook aprovado
- [ ] KYC aprovado
- [ ] R2/S3 privado aprovado
- [ ] checkout PIX aprovado
- [ ] checkout cartão tokenizado aprovado
- [ ] refund aprovado
- [ ] chargeback aprovado
- [ ] comissão/split conciliados
- [ ] recuperação de conta aprovada
- [ ] e-mail verificado
- [ ] Redis distribuído aprovado
- [ ] backups/restauração aprovados
- [ ] TLS/monitoramento aprovados
- [ ] LGPD/termos aprovados
- [ ] pentest aprovado
- [ ] plano de rollback aprovado

## 21. Regra de ouro
Se o fluxo funcionar localmente mas não tiver sido validado com as credenciais, webhooks, storage e ambiente reais de teste, ele ainda não está pronto para produção.
