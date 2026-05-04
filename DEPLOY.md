# Deployment Guide — npb-property.com

## Recommended: Vercel + Vercel Blob + Neon Postgres

### Prerequisites
- GitHub account
- Vercel account (free)
- Domain `npb-property.com` registered somewhere
- Existing Neon Postgres database (already configured)

---

## Step 1 — Push code to GitHub

```bash
# In project root
git add .
git commit -m "Prepare for production deploy"
git remote add origin https://github.com/YOUR_USERNAME/npb-property.git
git push -u origin main
```

If repo already exists, just `git push`.

---

## Step 2 — Create Vercel Project

1. Go to https://vercel.com/new
2. Import the GitHub repo
3. Vercel auto-detects Next.js → click **Deploy**
4. First deploy will fail without env vars — that's fine, continue to Step 3

---

## Step 3 — Set up Vercel Blob (file storage)

1. In Vercel project → **Storage** tab → **Create Database** → **Blob**
2. Name it `npb-uploads` (or anything)
3. Click **Connect to Project** → Vercel auto-adds `BLOB_READ_WRITE_TOKEN` env var

---

## Step 4 — Add Environment Variables

In Vercel project → **Settings** → **Environment Variables**, add:

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | From Neon dashboard (use **pooled** connection string) |
| `NEXTAUTH_SECRET` | random 32+ char string | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://npb-property.com` | Your final domain (no trailing slash) |
| `OPENROUTER_API_KEY` | `sk-or-...` | From your local `.env` |
| `GOOGLE_MAPS_API_KEY` | `AIza...` | Optional, from your local `.env` |
| `BLOB_READ_WRITE_TOKEN` | (auto-added by Step 3) | Don't set manually |

Apply to: **Production**, **Preview**, **Development**

---

## Step 5 — Redeploy

In Vercel → **Deployments** → latest → **⋯** → **Redeploy**

After ~1-2 minutes, your app will be live at `https://YOUR-PROJECT.vercel.app`.

---

## Step 6 — Connect Custom Domain

In Vercel project → **Settings** → **Domains**:

1. Add `npb-property.com` → Vercel will show DNS instructions
2. Add `www.npb-property.com` → set as redirect to apex (or vice versa)

### DNS records to add (at your domain registrar):

**Apex domain (`npb-property.com`):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21`

**WWW subdomain:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

⚠️ **If you currently have other A/CNAME records for the domain, remove or replace them.**

3. Wait 5-30 minutes for DNS to propagate
4. Vercel auto-issues SSL cert (free, via Let's Encrypt)

---

## Step 7 — Verify

- Visit `https://npb-property.com` → should load home page
- Login as admin → upload a logo → check it works (uses Vercel Blob)
- Test creating a property/article

---

## Migrating Existing Site Data

**If `npb-property.com` has existing content (old site):**

- Take a backup before changing DNS
- Old site goes offline once DNS points to Vercel
- Plan a migration window (5-30 min downtime during DNS propagation)

**If domain isn't pointed anywhere yet:**
- Just add DNS records → no downtime concern

---

## Local Development (still works)

Locally, `BLOB_READ_WRITE_TOKEN` is empty → uploads still go to `public/uploads/` (local filesystem). Nothing changes for dev.

---

## Cost Estimate (typical small site)

| Service | Tier | Cost |
|---|---|---|
| Vercel | Hobby | **Free** |
| Vercel Blob | Free 5GB / 5K requests/mo | **Free** for small usage |
| Neon Postgres | Free 0.5GB | **Free** |
| Domain | varies | ~฿400/year |

Upgrade when needed: Vercel Pro $20/mo, Blob $0.15/GB/mo over 5GB.

---

## Troubleshooting

**Build fails with `prisma generate` error:**
- Ensure `package.json` has `"postinstall": "prisma generate"` (already configured)

**Image uploads fail in production:**
- Check `BLOB_READ_WRITE_TOKEN` is set in Vercel env vars
- Check Vercel Storage tab — Blob should be connected

**Old uploaded images (in `public/uploads/`) don't show after deploy:**
- These files exist only on your local machine, not on Vercel
- Either: re-upload via admin, or migrate them manually to Blob

**Login doesn't work:**
- Verify `NEXTAUTH_URL` matches exact domain (https, no trailing slash)
- Verify `NEXTAUTH_SECRET` is set (any 32+ char string)
