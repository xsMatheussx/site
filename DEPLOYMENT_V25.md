# V25 — Deployment baseline
Services: web, api, PostgreSQL, Redis, private S3/R2, reverse proxy/TLS.\n\nProduction requires secrets outside git, database backups, health checks, structured logs, alerting and rollback.\nEOF
cat > LGPD_V26.md <<'EOF'
# V26 — LGPD baseline
Define controller/processor roles, legal bases, privacy notice, cookie policy, retention schedule, deletion/anonymization workflow, data-subject request workflow, incident response and vendor agreements. Consent is versioned in the `Consent` model; consent must not be treated as the sole legal basis for every processing activity.\nEOF
# update README
cat >> README.md <<'EOF'

## V28
Cumulative release candidate. See `documento_mestre_marketplace_infoprodutos_v28.txt` and the V20-V27 implementation notes. Production readiness still requires dependency installation, builds, migrations and sandbox/E2E validation.
