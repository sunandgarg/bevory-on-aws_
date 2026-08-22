# Private Supabase Data Import Format

Private exports must never be committed to this repository. Place the file in a secure temporary directory, preview it, and then apply it:

```bash
pnpm data:import-private -- /secure/path/bevory-private-export.json
pnpm data:import-private -- /secure/path/bevory-private-export.json --apply
```

The accepted JSON structure is:

```json
{
  "users": [
    {
      "id": "existing-user-uuid",
      "email": "user@example.com",
      "phone": "+919999999999",
      "encrypted_password": "$2a$...",
      "raw_user_meta_data": { "full_name": "Example User" }
    }
  ],
  "tables": {
    "profiles": [],
    "user_roles": [],
    "user_preferences": [],
    "user_favorites": [],
    "notifications": [],
    "saved_locations": [],
    "comparisons": [],
    "recent_searches": [],
    "preferred_brands": [],
    "user_permissions": []
  }
}
```

A sanitized structural example is available at `docs/private-export.example.json`.

Supabase bcrypt hashes are retained when they use a supported `$2a$`, `$2b$`, or `$2y$` format. Accounts with an absent or unsupported hash are imported with `password_reset_required: true`; they can use configured Google/phone authentication until a password-reset email provider is connected.
