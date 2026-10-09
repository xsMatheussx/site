# TZ Store — Checklist de Produção

## Implementado no V16
- Helmet / headers de segurança
- CORS configurável por `WEB_ORIGIN`
- ValidationPipe estrito
- Rate limiting global com Nest Throttler
- Filtro global de exceções
- Storage local funcional para MVP/staging
- Upload multipart de arquivos de produto (limite 50 MB)
- Webhooks com idempotência por provider + event ID
- Base para troca do storage local por S3/R2

## Antes de produção
- [ ] Trocar storage local por S3/R2/MinIO gerenciado
- [ ] Assinar URLs de download e nunca expor bucket público
- [ ] Configurar segredo JWT forte e rotação
- [ ] Configurar domínio CORS explícito
- [ ] Redis para throttling distribuído
- [ ] SMTP/transacional para verificação e recuperação de senha
- [ ] Pagar.me/Mercado Pago em modo produção
- [ ] Validar assinatura de webhook de cada gateway
- [ ] Split/recebedores/saques
- [ ] Idempotência completa de pagamentos
- [ ] Refund/chargeback e reconciliação
- [ ] Observabilidade: logs estruturados, métricas e alertas
- [ ] Backup e restore testado do PostgreSQL
- [ ] TLS, reverse proxy e secrets manager
- [ ] Pentest/ASVS e revisão LGPD
