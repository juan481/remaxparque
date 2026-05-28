-- Auth improvements: email/password system
-- password_changed: false = user must change password on first login (admin-created accounts)
-- DEFAULT true so existing Google-auth users are not forced to change
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed boolean DEFAULT true;

-- email: store user email in profile for admin display
-- (auth.users.email is not directly queryable via client SDK without admin API)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Existing rows: set password_changed = true (already authenticated via Google)
UPDATE profiles SET password_changed = true WHERE password_changed IS NULL;
