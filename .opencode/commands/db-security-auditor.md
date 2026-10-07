---
description: Audita seguridad de BD Supabase y código de la app: RLS, roles, GRANTs, SECURITY DEFINER, service_role y fugas padre↔niño/staff. Solo reporta hallazgos; no crea migraciones ni corrige código. Uso: /db-security-auditor [tabla|spec|archivo].
agent: db-security-auditor
model: opencode-go/mimo-v2.5
---

# /db-security-auditor — Supabase + app security audit

You are invoking the `db-security-auditor` agent.

Input: `$ARGUMENTS`

- If empty: full audit — migrations, remote policies/grants/advisors, and app code (`utils/supabase/**`, `app/actions/**`).
- If it names a table (e.g. `children`): focus on that table's RLS, grants, and app usage.
- If it names a spec (number, slug, or path): focus on that spec's data model / RLS intent and related code.
- If it names an app path: focus on app-layer Supabase security for that code.

Follow the `db-security-auditor` agent instructions end-to-end (audit-only mode):

1. Load Supabase skills (`.agents/skills/supabase` + `supabase-postgres-best-practices`).
2. Inventory local migrations + remote state (tables, policies, grants, functions, advisors) with read-only SQL.
3. Audit RLS/GRANT/SECURITY DEFINER against the OpenDayCare isolation model (staff↔daycare, parent↔linked children, anon↔nothing sensitive).
4. Audit app code for service_role exposure, missing re-validation, and cross-tenant queries.
5. Report findings with severity, evidence, and recommendations — **do not create files, edit code, or apply anything**.
6. Output the final report in Spanish; recommend `/db-migrator` to create/apply fix migrations after human review.
