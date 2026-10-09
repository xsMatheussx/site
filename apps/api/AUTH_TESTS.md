# Auth V13 — teste manual do fluxo

> Requer dependências instaladas, PostgreSQL ativo e migration aplicada.

1. `POST /api/v1/auth/register` com `{ "name": "Teste", "email": "teste@tz.local", "password": "Senha123!" }`
   - esperado: `201`, `accessToken`, usuário e cookie `tz_refresh` HttpOnly.
2. `GET /api/v1/auth/me` sem Bearer
   - esperado: `401`.
3. `GET /api/v1/auth/me` com `Authorization: Bearer <accessToken>`
   - esperado: `200` com usuário autenticado.
4. `POST /api/v1/auth/login` com credenciais válidas
   - esperado: `200`, novo access token e rotação do cookie refresh.
5. `POST /api/v1/auth/refresh` com cookie
   - esperado: `200`, novo access token e novo refresh cookie; sessão anterior revogada.
6. `POST /api/v1/auth/logout` com cookie
   - esperado: `200` e cookie removido.
7. Credencial inválida
   - esperado: `401`.
8. E-mail já cadastrado
   - esperado: `409`.
9. Usuário `SUSPENDED`
   - esperado: `401` no login e acesso protegido.
10. Endpoint com `@Roles(...)` deve retornar `403` quando o usuário não possuir o papel exigido.

## V14 — Produtor → Produto → Oferta

Pré-requisito: usuário autenticado com role `PRODUCER` no access token.

1. `POST /api/v1/products` cria produto em `DRAFT`.
2. `GET /api/v1/products/mine` lista apenas produtos do produtor autenticado.
3. `GET /api/v1/products/:id` impede acesso a produto de outro produtor.
4. `POST /api/v1/products/:productId/offers` cria oferta em centavos.
5. `PATCH /api/v1/products/:productId/offers/:id` altera oferta somente pelo proprietário.
6. `PATCH /api/v1/products/:id` publica produto e define `publishedAt`.
7. `GET /api/v1/products` retorna apenas produtos `PUBLISHED` e ofertas ativas.
8. `POST /api/v1/products/:id/files` registra metadados de arquivo após upload no storage.
9. `POST /api/v1/products/:id/archive` arquiva produto.
10. Slug duplicado retorna `409 Conflict`.

Observação: nesta versão o endpoint de arquivos registra o objeto já enviado ao storage; o upload binário para S3-compatible storage será conectado na etapa de infraestrutura de arquivos.
