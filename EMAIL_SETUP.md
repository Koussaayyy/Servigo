# Email Verification Setup Guide

## Problem
Your app needs to send verification codes via email. Gmail auth is failing (535 error).

## Solution: Use Brevo (Free, Easy)

Brevo is free, supports unlimited SMTP sends, and works worldwide.

### Step 1: Create Brevo Account
1. Go to https://www.brevo.com/
2. Click "Sign Up Free" 
3. Complete registration with your email
4. Verify your email
5. Log in

### Step 2: Get SMTP Credentials
1. In Brevo dashboard, click **Settings** (⚙️ icon)
2. Go to **SMTP & API** tab
3. In "SMTP" section, you'll see:
   - **SMTP Server**: smtp-relay.brevo.com
   - **Port**: 587 (or 465 for SSL)
   - **Login**: Your Brevo account email
   - **Password**: Generate by clicking "Generate new credentials" → copy the long password string

### Step 3: Verify Your Sender Email
1. In Brevo dashboard, go to **Senders**
2. Add a sender email (any email address you want to send from)
3. Brevo will send verification email - click the link to verify

### Step 4: Update .env File
Create or update `.env` in your backend folder with:

```
NODE_ENV=development

# SMTP Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-login-email@gmail.com
SMTP_PASS=your-long-generated-password

# Email sender details
MAIL_FROM_EMAIL=noreply@yourdomain.com
MAIL_FROM_NAME=Servigo

# Optional: Enable dev bypass for local testing (set to "true" to log codes to terminal in dev)
# ALLOW_DEV_EMAIL_BYPASS=false
```

**Replace:**
- `SMTP_USER`: Your Brevo login email
- `SMTP_PASS`: The long password from Step 2
- `MAIL_FROM_EMAIL`: Your verified sender email from Step 3
- `MAIL_FROM_NAME`: Your app name

### Step 5: Restart Backend
```bash
npm start
```

The server will log:
```
✅ Email system ready (SMTP)
Server running on http://localhost:5000
```

### Step 6: Test
1. Open http://localhost:3000
2. Try signing up as a client
3. Check your email inbox (and spam folder) for the code
4. Enter the code in the verification screen
5. Done!

---

## Alternative Providers

If Brevo doesn't work, you can use:

### SendGrid (Free tier: 100 emails/day)
- SMTP_HOST: smtp.sendgrid.net
- SMTP_PORT: 587
- SMTP_USER: apikey
- SMTP_PASS: SG.xxxxx... (your API key)

### Gmail (if 2FA available)
- SMTP_HOST: smtp.gmail.com
- SMTP_PORT: 587
- SMTP_USER: your-email@gmail.com
- SMTP_PASS: your-16-char-app-password
  - (Not your regular password—must be a Gmail app-specific password)

### Mailgun
- SMTP_HOST: smtp.mailgun.org
- SMTP_PORT: 587
- SMTP_USER: postmaster@your-domain.mailgun.org
- SMTP_PASS: Your Mailgun SMTP password

---

## Development/Testing

### Option A: Use Real Email (Recommended)
Set up Brevo or another provider above. Codes arrive via real email.

### Option B: Dev Bypass (Terminal Only)
To see codes printed in backend terminal (not exposed in UI):
```
ALLOW_DEV_EMAIL_BYPASS=true
```
Then when you sign up, check your backend terminal for the code. **This is for development only—don't use in production.**

---

## Troubleshooting

**Email not arriving:**
- Check spam/junk folder
- Verify sender email is confirmed in Brevo
- Confirm SMTP credentials in .env are correct
- Check backend logs for SMTP errors

**535 Error (Authentication failed):**
- Wrong credentials in .env
- Re-verify SMTP_USER and SMTP_PASS match Brevo

**Still stuck?**
Ask for help—include the error from backend logs.
