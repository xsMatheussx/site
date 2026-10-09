# TZ Store V18 — Storage privado + entrega segura

## Objetivo
Substituir a exposição pública de arquivos digitais por armazenamento privado compatível com S3 e URLs temporárias assinadas para downloads.

## Implementado
- `StorageService` agora suporta `local`, `s3` e `r2`.
- AWS SDK S3 + presigner adicionados ao backend.
- Upload multipart existente passa a funcionar com storage remoto quando configurado.
- `GET /api/v1/files/:key` deixou de ser endpoint público de download.
- `GET /api/v1/delivery/:accessId/files/:fileId` valida usuário, cliente, acesso ACTIVE e vínculo do arquivo ao produto antes de entregar.
- Em S3/R2, a API gera uma presigned GET URL temporária e redireciona o cliente.
- Em local, a API entrega o buffer diretamente após autorização.
- TTL padrão da URL assinada: 300 segundos, limitado pelo código a no máximo 3600 segundos.
- Chaves de storage continuam restritas a um único segmento para reduzir risco de path traversal.
- Bucket remoto deve permanecer privado; a URL assinada funciona como bearer token temporário.

## Base técnica pesquisada
AWS S3 documenta presigned URLs para acesso temporário sem alterar a bucket policy. Cloudflare R2 documenta o mesmo modelo para `GET`/`PUT` e recomenda tratar URLs presigned como tokens de acesso, usando expiração curta para conteúdo sensível.

## Não considerado concluído ainda
- Upload direto browser → R2/S3 via presigned PUT.
- Multipart/resumable upload para arquivos muito grandes.
- Antivírus/malware scanning.
- DRM/watermarking.
- Limites de download por usuário/IP e auditoria detalhada de downloads.
- Configuração real de bucket/CORS/credenciais no ambiente de produção.
- Testes E2E contra S3/R2 real.

## Próximo bloco
1. Onboarding de recipient/KYC.
2. Tokenização de cartão.
3. Refund/chargeback/reconciliação.
4. Recuperação de senha e verificação de e-mail.
5. Redis distribuído.
6. Testes E2E/sandbox.
7. Observabilidade/deploy.
8. LGPD, termos e políticas.
9. Revisão de segurança e preparação para lançamento.

## ONDE PARAMOS — V18
Storage privado e entrega segura foram implementados na arquitetura, mantendo `local` para desenvolvimento e adicionando S3/R2 para produção. O acesso ao arquivo agora passa pela autorização do `Access` antes de gerar/entregar o conteúdo. A validação completa depende de instalar as dependências e executar build/typecheck/migrações/testes em ambiente configurado.
