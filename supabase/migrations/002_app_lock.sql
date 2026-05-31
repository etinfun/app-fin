alter table settings
  add column if not exists app_lock_enabled boolean not null default true,
  add column if not exists app_lock_credential_id text;
