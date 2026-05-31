#!/usr/bin/env bash
set -euo pipefail

# Configures Supabase Auth to send email via Resend SMTP.
# Requires in .env.local (or exported in shell):
#   RESEND_API_KEY=re_...
#   SUPABASE_ACCESS_TOKEN=sbp_...
# Optional:
#   SUPABASE_PROJECT_REF=sxghzvwqopwzzksgmrmu
#   SMTP_SENDER_EMAIL=onboarding@resend.dev  (testing only — must match Resend account rules)
#   SMTP_SENDER_NAME=Etin Finance
#   RATE_LIMIT_EMAIL_SENT=100

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-sxghzvwqopwzzksgmrmu}"
RESEND_API_KEY="${RESEND_API_KEY:-}"
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
SMTP_SENDER_EMAIL="${SMTP_SENDER_EMAIL:-onboarding@resend.dev}"
SMTP_SENDER_NAME="${SMTP_SENDER_NAME:-Etin Finance}"
RATE_LIMIT_EMAIL_SENT="${RATE_LIMIT_EMAIL_SENT:-100}"

if [[ -z "$RESEND_API_KEY" ]]; then
  echo "Missing RESEND_API_KEY."
  echo "1. Sign up at https://resend.com"
  echo "2. Create an API key at https://resend.com/api-keys"
  echo "3. Add to .env.local: RESEND_API_KEY=re_..."
  exit 1
fi

if [[ -z "$SUPABASE_ACCESS_TOKEN" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN."
  echo "1. Open https://supabase.com/dashboard/account/tokens"
  echo "2. Generate a token"
  echo "3. Add to .env.local: SUPABASE_ACCESS_TOKEN=sbp_..."
  exit 1
fi

echo "Configuring Supabase project: $PROJECT_REF"
echo "Sender: $SMTP_SENDER_NAME <$SMTP_SENDER_EMAIL>"

RESPONSE="$(curl -sS -w "\n%{http_code}" -X PATCH \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg host "smtp.resend.com" \
    --arg port "465" \
    --arg user "resend" \
    --arg pass "$RESEND_API_KEY" \
    --arg email "$SMTP_SENDER_EMAIL" \
    --arg name "$SMTP_SENDER_NAME" \
    --argjson rate "$RATE_LIMIT_EMAIL_SENT" \
    '{
      external_email_enabled: true,
      smtp_host: $host,
      smtp_port: $port,
      smtp_user: $user,
      smtp_pass: $pass,
      smtp_admin_email: $email,
      smtp_sender_name: $name,
      rate_limit_email_sent: $rate
    }')")"

HTTP_CODE="$(echo "$RESPONSE" | tail -n1)"
BODY="$(echo "$RESPONSE" | sed '$d')"

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Supabase API error (HTTP $HTTP_CODE):"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  exit 1
fi

echo "Done. Custom SMTP enabled via Resend."
echo "Email rate limit set to ${RATE_LIMIT_EMAIL_SENT}/hour."
echo ""
if [[ "$SMTP_SENDER_EMAIL" == "onboarding@resend.dev" ]]; then
  echo "Note: onboarding@resend.dev only delivers to the email you used to sign up for Resend."
  echo "Use that same email to sign in to Etin Finance, or verify a domain in Resend and re-run with:"
  echo "  SMTP_SENDER_EMAIL=noreply@yourdomain.com"
fi
echo ""
echo "Try signing in from your app in 1–2 minutes."
