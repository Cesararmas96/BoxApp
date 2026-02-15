# Mandatory Internationalization (i18n)

## CRITICAL RULE — Zero Tolerance for Missing Translations

Every time an agent creates, modifies, or deletes UI-facing text in any `.tsx` or `.ts` component, it **MUST** also update the translation files. This is NOT optional.

### Translation Files

- **English:** `src/locales/en.json`
- **Spanish:** `src/locales/es.json`

### Rules

1. **No hardcoded strings in JSX.** Every user-visible string must use the `t()` function from `useLanguage()` hook.
   ```tsx
   // ❌ FORBIDDEN
   <Button>Save Changes</Button>

   // ✅ REQUIRED
   <Button>{t('section.save_changes')}</Button>
   ```

2. **Both files must be updated simultaneously.** If you add a key to `en.json`, you MUST add the equivalent key to `es.json` in the same operation. No exceptions.

3. **Key naming convention:** Use dot-notation namespacing matching the section/page:
   - `common.*` — shared across multiple pages (buttons, labels, statuses)
   - `schedule.*` — Schedule page keys
   - `competitions.*` — Competitions page keys
   - `billing.*` — Billing page keys
   - `members.*` — Members page keys
   - `wods.*` — WODs/programming keys
   - `settings.*` — Settings page keys
   - `auth.*` — Authentication keys
   - `analytics.*` — Analytics/dashboard keys
   - `movements.*` — Movements library keys
   - `roles.*` — Roles and permissions keys
   - `audit.*` — Audit log keys
   - `leads.*` — Leads page keys
   - `logistics.*` — Logistics keys

4. **Parity check before committing.** Before any git commit that touches UI components, verify:
   - Every `t('key')` used in the code exists in BOTH `en.json` and `es.json`
   - Both files have the same number of keys (perfect parity)
   - No orphaned keys were left behind from deleted UI

5. **Dynamic keys** (e.g., `t('competitions.no_' + status)`) must have ALL possible resolved values added to both files.

6. **Nested objects are NOT string values.** Never use `t('common.gender')` if `common.gender` is an object with children. Use a specific child key like `t('common.gender.male')` or a label key like `t('common.gender_label')`.

### Verification Command

Run this before committing to check for missing translations:

```bash
grep -rhoP "t\(['\"]([^'\"]+)['\"]" src/ --include=*.tsx --include=*.ts | sort -u
```

Then compare against the keys in both JSON files.

### Consequences of Violation

If an agent adds UI text without translations, the feature is considered **incomplete** and must NOT be committed until translations are added to both locale files.
