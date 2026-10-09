# V20 — Tokenização de cartão
O navegador deve enviar os dados abertos do cartão diretamente ao endpoint de tokenização da Pagar.me usando a public key. O backend TZ recebe somente `cardToken` e billing address. Tokens são temporários e de uso único; nunca persistir PAN/CVV.
