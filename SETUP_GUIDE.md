# Funded Cobra Support Portal - Complete Setup Guide

This guide will walk you through setting up the Funded Cobra Support Portal from scratch.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- A **Supabase** account ([Sign up](https://supabase.com))
- A **Discord** application ([Discord Developer Portal](https://discord.com/developers/applications))
- A code editor (VS Code recommended)

## 🚀 Step 1: Project Setup

### Clone and Install

```bash
# Navigate to the project directory
cd funded-cobra-support

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

## 🗄️ Step 2: Supabase Configuration

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose an organization
4. Enter project details:
   - **Name:** Funded Cobra Support
   - **Database Password:** (create a strong password)
   - **Region:** Choose closest to your users
5. Click "Create new project" and wait for setup to complete

### 2.2 Get API Credentials

1. In your Supabase project, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`) ⚠️ Keep this secret!

### 2.3 Set Up Database Schema

1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Open the file `src/lib/supabase/schema.sql` in your code editor
4. Copy the entire contents
5. Paste into the Supabase SQL Editor
6. Click "Run" to execute the schema
7. Verify tables were created by going to **Table Editor**

You should see these tables:
- ✅ users
- ✅ tickets
- ✅ ticket_messages
- ✅ ticket_attachments
- ✅ internal_notes
- ✅ ticket_tags
- ✅ customer_tags
- ✅ saved_replies
- ✅ notifications
- ✅ notification_preferences
- ✅ analytics_events
- ✅ ticket_categories

### 2.4 Configure Storage

1. Go to **Storage** in Supabase
2. Create a new bucket called `ticket-attachments`
3. Set it to **Private** (not public)
4. Add policies for authenticated users:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

-- Allow users to read their own attachments
CREATE POLICY "Users can read own attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ticket-attachments');
```

## 🎮 Step 3: Discord OAuth Setup

### 3.1 Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Enter name: "Funded Cobra Support"
4. Accept Terms of Service
5. Click "Create"

### 3.2 Configure OAuth2

1. In your application, go to **OAuth2** > **General**
2. Copy your **Client ID** and **Client Secret**
3. Add redirect URL:
   - For development: `http://localhost:3000/api/auth/callback/discord`
   - For production: `https://your-domain.com/api/auth/callback/discord`
4. Save changes

### 3.3 Set Permissions

1. Go to **OAuth2** > **URL Generator**
2. Select scopes:
   - ✅ `identify` - Get user ID and username
   - ✅ `email` - Get user email (optional)
3. The generated URL is what users will use to login

## 🔧 Step 4: Environment Variables

Edit your `.env.local` file with all the credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Discord OAuth Configuration
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
NEXT_PUBLIC_DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/callback/discord

# Discord Webhook (Optional - for staff notifications)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Creating a Discord Webhook (Optional)

1. Go to your Discord server
2. Server Settings > Integrations > Webhooks
3. Click "New Webhook"
4. Name it "Support Notifications"
5. Choose the channel for notifications
6. Copy the webhook URL
7. Add to `.env.local`

## 🧪 Step 5: Test the Application

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verify Setup

1. **Landing Page** ✅
   - Should see the premium dark theme
   - Animated background particles
   - Funded Cobra branding

2. **Navigation** ✅
   - Click "Open a Support Ticket"
   - Should see category selection

3. **Database Connection** ✅
   - Open browser console (F12)
   - Check for any Supabase errors
   - Network tab should show successful API calls

## 👥 Step 6: Create Test Users

### 6.1 Create Admin User

1. Login with Discord (will create user automatically)
2. Go to Supabase **Table Editor** > **users**
3. Find your user record
4. Edit the `role` field to `administrator`
5. Save

### 6.2 Create Test Tickets

For testing, you can manually insert tickets in Supabase:

```sql
INSERT INTO tickets (
  ticket_id,
  user_id,
  category,
  subject,
  priority,
  status
) VALUES (
  'FC-10001',
  'your-user-id-here',
  'payout_support',
  'Test payout inquiry',
  'medium',
  'open'
);
```

## 🎨 Step 7: Customize Branding

### Add Your Logo

1. Add logo files to `public/logo/`
2. Update logo references in:
   - `src/components/landing/LandingPage.tsx`
   - `src/components/dashboard/Sidebar.tsx`

### Update Theme Colors

Edit `src/app/globals.css` to customize:

```css
:root {
  --brand-primary: #10b981; /* Your primary color */
  --brand-secondary: #06b6d4; /* Your secondary color */
  --brand-accent: #8b5cf6; /* Your accent color */
}
```

### Update Metadata

Edit `src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: "Your Company - Support Portal",
  description: "Your custom description",
};
```

## 🔐 Step 8: Security Configuration

### Enable Row Level Security

Verify RLS is enabled for all tables (done in schema):

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

### Test Permissions

1. Create a test customer account
2. Try to access another user's tickets (should fail)
3. Try to view internal notes (should fail)
4. Test staff account permissions

## 📱 Step 9: Mobile Testing

Test responsive design on:

- 📱 Mobile (375px - 768px)
- 📱 Tablet (768px - 1024px)
- 💻 Desktop (1024px+)

Use browser DevTools device emulation.

## 🚀 Step 10: Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy

### Update Discord OAuth Redirect

After deployment, update Discord application:

1. Go to Discord Developer Portal
2. OAuth2 > Redirects
3. Add: `https://your-domain.vercel.app/api/auth/callback/discord`

### Update Environment Variables

In Vercel:

1. Settings > Environment Variables
2. Add all variables from `.env.local`
3. Update `NEXT_PUBLIC_APP_URL` to your domain
4. Redeploy

## 🐛 Troubleshooting

### Supabase Connection Issues

```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/

# Should return: {"message":"Missing Authorization header"}
```

### Discord OAuth Not Working

- ✅ Check redirect URI matches exactly
- ✅ Verify Client ID and Secret are correct
- ✅ Check OAuth2 scopes are selected
- ✅ Clear browser cookies and try again

### Database Errors

- ✅ Verify schema was executed successfully
- ✅ Check RLS policies are created
- ✅ Ensure service role key is set
- ✅ Check table permissions

### Styling Issues

- ✅ Verify Tailwind CSS is compiling
- ✅ Check for conflicting class names
- ✅ Clear Next.js cache: `rm -rf .next`
- ✅ Restart dev server

## 📞 Getting Help

If you encounter issues:

1. Check browser console for errors
2. Check server logs
3. Review Supabase logs (Logs & Reports)
4. Check Discord OAuth settings
5. Verify environment variables

## 🎉 Next Steps

Once setup is complete:

1. ✅ Create ticket categories
2. ✅ Add staff members
3. ✅ Configure saved replies
4. ✅ Set up Discord webhooks
5. ✅ Test end-to-end ticket workflow
6. ✅ Train support team
7. ✅ Launch to customers

## 🔄 Maintenance

### Regular Tasks

- Monitor Supabase usage
- Review support metrics
- Update staff permissions
- Clean up old attachments
- Review and update saved replies
- Monitor Discord webhook health

### Backups

Supabase provides automatic backups, but also:

1. Export important data regularly
2. Back up environment variables
3. Document custom configurations

---

**Congratulations!** 🎉 Your Funded Cobra Support Portal is now set up and ready to use!

For additional help, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Discord OAuth Documentation](https://discord.com/developers/docs/topics/oauth2)
