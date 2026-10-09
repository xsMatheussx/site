TZ STORE — PATCH VISUAL + FUNCIONAL — 2026-09-15

APLICAR SOBRE:
C:\Users\motog\Downloads\tz-store-v28-release

EXTRAÇÃO:
Extraia este ZIP diretamente sobre a pasta do projeto, substituindo os arquivos quando solicitado.
Ele contém somente arquivos de apps/web/app, então não apaga package.json, lockfile ou configurações do root.

MUDANÇAS:
- visual premium consistente nas áreas internas;
- sidebar/topbar responsivos e com identidade TZ;
- áreas Admin/Afiliado/Conta com views reais em vez de uma tabela genérica;
- busca, estados de loading/erro/vazio e cards/tabelas por contexto;
- correção de textos corrompidos nos componentes principais;
- preservação das telas de checkout, marketplace, login, cadastro e biblioteca.

VALIDAÇÃO:
cd C:\Users\motog\Downloads\tz-store-v28-release\apps\web
pnpm install
npm run build
