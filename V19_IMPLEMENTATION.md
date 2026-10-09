# TZ Store V19 — Recipient/KYC onboarding

## Objetivo
Preparar o onboarding financeiro de produtores e afiliados no Pagar.me V5 sem armazenar no TZ Store dados bancários desnecessariamente.

## Implementado
- Adapter Pagar.me ganhou criação de recipient em `POST /core/v5/recipients`.
- Consulta de recipient em `GET /core/v5/recipients/{recipient_id}`.
- Criação de link KYC em `POST /core/v5/recipients/{recipient_id}/kyc_link`.
- Endpoint protegido `POST /api/v1/users/me/payment-account/onboard` para PRODUCER/AFFILIATE.
- Endpoint protegido `GET /api/v1/users/me/payment-account/status`.
- Endpoint protegido `POST /api/v1/users/me/payment-account/kyc-link`.
- `PaymentAccount` continua guardando somente o identificador externo e status/metadados; os dados bancários recebidos no onboarding são enviados ao gateway e não persistidos como conta bancária no TZ Store.
- Se o usuário já possuir recipient, o onboarding consulta e sincroniza o status em vez de criar outro.
- Webhook `recipient.updated` passa a sincronizar `status`, `kycStatus` e `kycStatusReason` no `PaymentAccount`.
- O fluxo suporta tanto produtor quanto afiliado, preparando os dois lados do split.

## Fluxo
1. Usuário habilita PRODUCER ou AFFILIATE.
2. Frontend envia os dados cadastrais e bancários exigidos pelo contrato atual do Pagar.me.
3. TZ Store cria um único recipient externo.
4. O recipient começa em `registration` conforme o fluxo documentado pelo Pagar.me.
5. Quando o gateway indicar que o KYC está disponível, o TZ Store gera um link temporário.
6. O usuário conclui a prova de vida no webapp do gateway.
7. O webhook `recipient.updated` atualiza o estado local.
8. `active` representa credenciamento concluído para movimentação do saldo; `refused` bloqueia o fluxo de credenciamento.

## Segurança
- Nenhuma chave Pagar.me é enviada ao frontend.
- Dados bancários não são persistidos pelo TZ Store neste módulo.
- O endpoint de onboarding exige autenticação e papel PRODUCER/AFFILIATE.
- O código não cria recipient duplicado para a mesma conta local.
- Antes de produção, validar o contrato exato de `register_information` e `default_bank_account` da conta Pagar.me utilizada.

## Base oficial pesquisada
A documentação atual do Pagar.me exige `register_information` e `default_bank_account` na criação de recipients. O fluxo de KYC utiliza `POST /recipients/{id}/kyc_link`; o link expira em 20 minutos. O fluxo assíncrono utiliza `recipient.updated`, com estados como `registration`, `affiliation`, `active` e `refused`.

## Não considerado concluído
- KYC real validado ponta a ponta em sandbox.
- Tela frontend completa de onboarding/KYC.
- Tratamento de todos os campos PF/PJ específicos exigidos pelo contrato da conta.
- Reconciliação financeira.
- Política definitiva de saque/antecipação.
- Testes automatizados/E2E após instalação das dependências.
- Tokenização de cartão.

## ONDE PARAMOS — V19
Recipient/KYC onboarding foi estruturado no backend e conectado ao adapter Pagar.me. O próximo bloco é **tokenização de cartão no checkout**, seguido por refund/chargeback/reconciliação.
