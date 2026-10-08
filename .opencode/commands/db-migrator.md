---
description: Asegura que existan las migraciones de Supabase y las aplica al proyecto remoto. Deriva SQL de specs de DB y del esquema de referencia. Uso: /db-migrator o /db-migrator <spec>.
agent: db-migrator
model: opencode-go/mimo-v2.5
---

# /db-migrator — Ensure and apply Supabase migrations

You are invoking the `db-migrator` agent.

Input: `$ARGUMENTS`

- If empty: audit all DB-related specs and the full `supabase/migrations/` set; create missing migrations; apply pending ones; report drift.
- If it names a spec (number, slug, or path): focus on that spec's data model and required migrations.

Follow the `db-migrator` agent instructions end-to-end:

1. Load Supabase skills (`.agents/skills/supabase` + `supabase-postgres-best-practices`).
2. Inventory local files vs remote migrations (`supabase_list_migrations`), matching by descriptive name.
3. Derive required migrations from the given spec(s) and the `db-schema` reference.
4. Create missing files in `supabase/migrations/` when justified.
5. Apply pending files via `supabase_apply_migration`.
6. Report drift without destructive action.
7. Verify with `supabase_list_migrations` and advisors.
8. Output the final report in Spanish.
