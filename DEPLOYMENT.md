# Funded Cobra Support Portal - Deployment Guide

This guide covers deploying the Funded Cobra Support Portal to production.

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure you have:

- [ ] Completed local development and testing
- [ ] Set up Supabase project with production database
- [ ] Created Discord application for production OAuth
- [ ] Purchased and configured custom domain (optional)
- [ ] Set up Discord webhook for production notifications
- [ ] Prepared environment variables for production
- [ ] Tested all major user flows locally
- [ ] Reviewed security settings and RLS policies

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides the easiest deployment for Next.js applications with automatic CI/CD.

#### Step 1: Prepare Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Funded Cobra Support Portal"

# Create GitHub repository and push
git remote add origin https://github.com/your-org/funded-cobra-support.git
git push -u origin main
```

#### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

#### Step 3: Add Environment Variables

In Vercel project settings, add all environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Discord OAuth
DISCORD_CLIENT_ID=your-production-client-id
DISCORD_CLIENT_SECRET=your-production-client-secret
NEXT_PUBLIC_DISCORD_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback/discord

# Discord Webhook
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-production-webhook

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

#### Step 4: Deploy

Click "Deploy" and wait for build to complete.

#### Step 5: Update Discord OAuth

1. Go to Discord Developer Portal
2. Navigate to your application
3. OAuth2 > Redirects
4. Add: `https://your-domain.vercel.app/api/auth/callback/discord`
5. Save changes

#### Step 6: Configure Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` and Discord redirect URI

---

### Option 2: Railway

Railway is another excellent platform for deploying Next.js apps.

#### Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables
6. Deploy

---

### Option 3: Self-Hosted (Docker)

For full control, deploy using Docker on your own server.

#### Step 1: Create Dockerfile

The project should include a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Step 2: Build and Run

```bash
# Build image
docker build -t funded-cobra-support .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  # ... other env vars
  funded-cobra-support
```

#### Step 3: Set Up Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name support.fundedcobra.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Step 4: SSL with Let's Encrypt

```bash
sudo certbot --nginx -d support.fundedcobra.com
```

---

## 🔒 Production Security Checklist

### Environment Variables

- [ ] All secrets use production values (not development/test)
- [ ] Service role key is kept secure and not exposed to client
- [ ] Environment variables are not committed to git
- [ ] Vercel/hosting platform environment variables are encrypted

### Supabase Security

- [ ] Row Level Security (RLS) enabled on all tables
- [ ] RLS policies tested and verified
- [ ] Service role key used only in API routes (server-side)
- [ ] Anon key has appropriate permissions
- [ ] Database backups configured
- [ ] API rate limiting enabled

### Discord OAuth

- [ ] Production OAuth app uses separate credentials from development
- [ ] Redirect URIs match production domain exactly
- [ ] OAuth scopes limited to minimum required (identify, email)
- [ ] Client secret stored securely

### Application Security

- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS configured properly
- [ ] Rate limiting implemented for API routes
- [ ] Input validation on all forms
- [ ] File upload restrictions (size, type)
- [ ] XSS protection enabled
- [ ] CSRF protection enabled

---

## 📊 Post-Deployment Monitoring

### Set Up Monitoring

1. **Vercel Analytics** (if using Vercel)
   - Enable in project settings
   - Monitor page views, performance

2. **Supabase Monitoring**
   - Check database usage
   - Monitor API requests
   - Review logs regularly

3. **Error Tracking (Optional)**
   - Set up Sentry or similar
   - Track production errors
   - Get alerts for critical issues

### Health Checks

Create a health check endpoint:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString() 
  });
}
```

Monitor this endpoint for uptime.

---

## 🔄 Continuous Deployment

### Automatic Deployments (Vercel/Railway)

Once connected to GitHub:

1. Push to `main` branch → auto-deploy to production
2. Push to `dev` branch → auto-deploy to preview
3. Pull requests → generate preview URLs

### Manual Deployment

```bash
# Build locally
npm run build

# Test production build
npm start

# Deploy
vercel --prod
```

---

## 📧 Email Configuration (Future)

When ready to add email notifications:

1. Set up email service (SendGrid, Postmark, Resend)
2. Add API keys to environment variables
3. Create email templates
4. Implement email sending in API routes

---

## 🎯 Performance Optimization

### Before Launch

- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Optimize images (use Next.js Image component)
- [ ] Enable caching headers
- [ ] Minimize JavaScript bundle size
- [ ] Test on slow 3G connections
- [ ] Verify mobile performance

### CDN Configuration

Vercel automatically provides CDN. For self-hosted:

- Use Cloudflare for CDN and DDoS protection
- Enable caching for static assets
- Configure proper cache headers

---

## 🚨 Disaster Recovery

### Database Backups

Supabase provides automatic backups, but also:

1. Set up manual backup schedule
2. Test restore procedures
3. Document recovery steps

### Application Backup

1. Keep code in version control (GitHub)
2. Tag releases: `git tag v1.0.0`
3. Document deployment process
4. Keep environment variables backed up securely

---

## 📈 Scaling Considerations

### When Traffic Grows

1. **Supabase**: Upgrade plan for more connections
2. **Vercel**: Automatically scales, monitor usage
3. **Database**: Add indexes for slow queries
4. **API Routes**: Implement caching where appropriate
5. **Real-time**: Monitor Supabase Realtime connections

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
```

---

## ✅ Launch Checklist

### Final Pre-Launch Steps

- [ ] Test complete user journey (register → create ticket → receive response)
- [ ] Test staff workflow (view tickets → respond → close)
- [ ] Test Discord OAuth flow
- [ ] Verify all email addresses in footer/about
- [ ] Test mobile responsiveness
- [ ] Run security audit
- [ ] Test file uploads
- [ ] Verify Discord webhook notifications
- [ ] Test all user roles (customer, staff, admin)
- [ ] Spell check all content
- [ ] Review privacy policy and terms
- [ ] Set up analytics tracking
- [ ] Prepare customer announcement
- [ ] Train support staff
- [ ] Have rollback plan ready

### Launch Day

1. Deploy to production
2. Monitor error logs closely
3. Test critical paths immediately
4. Announce to customers
5. Be ready for quick fixes

---

## 🆘 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

**Environment Variables Not Loading**
- Verify they're set in hosting platform
- Redeploy after adding variables
- Check for typos in variable names

**Discord OAuth Fails**
- Verify redirect URI exactly matches
- Check client ID and secret
- Ensure OAuth app is not in development mode

**Database Connection Issues**
- Verify Supabase URL and keys
- Check Supabase project status
- Review connection pool limits

---

## 📞 Support

For deployment help:

- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Discord**: [discord.com/developers/docs](https://discord.com/developers/docs)

---

**Congratulations on deploying the Funded Cobra Support Portal!** 🎉

Your customers now have a professional support experience.
