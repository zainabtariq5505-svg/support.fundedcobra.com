# Funded Cobra Support Portal

**Fast. Secure. Professional.**

A premium web-based customer support and ticket management platform for Funded Cobra. Move customer support away from messy Discord ticket channels into a professional, centralized web support portal.

## 🌟 Features

### Customer Features
- 🎫 **Professional Ticket Management** - Create and track support tickets in one organized place
- 💬 **Real-time Chat** - Live conversation with support team with file attachments
- 📊 **Dashboard Overview** - View all your tickets and their status at a glance
- ⭐ **Satisfaction Ratings** - Rate your support experience
- 🔔 **Notifications** - Stay updated on ticket status changes

### Staff Features
- 🎯 **Powerful Admin Dashboard** - Manage all tickets from one central location
- 🔍 **Advanced Filtering** - Search, filter, and sort tickets by status, category, priority
- 👥 **Customer Profiles** - View customer history, tags, and previous tickets
- 📝 **Internal Notes** - Private staff notes invisible to customers
- 💾 **Saved Replies** - Quick response templates for common questions
- 🤖 **AI Assistant** - AI-powered ticket summaries and suggested replies
- 📈 **Analytics Dashboard** - Track performance metrics and customer satisfaction

### Integration Features
- 🎮 **Discord Authentication** - Secure login using Discord OAuth
- 🔔 **Discord Notifications** - Optional webhook notifications to staff channels
- 🔐 **Role-Based Access Control** - Customer, Support Agent, Finance Team, Partnership Manager, Administrator

## 🎨 Design Philosophy

This platform follows a **premium luxury fintech aesthetic** inspired by:
- Linear
- Stripe Dashboard
- Intercom
- Modern trading platforms

**Design Principles:**
- Deep black/charcoal backgrounds
- Premium gradients and glowing effects
- Careful use of glassmorphism
- Smooth micro-animations
- Professional typography
- High-quality Lucide icons
- Clean spacing and hierarchy

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Discord OAuth + Supabase Auth
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Charts:** Recharts

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account
- A Discord application for OAuth

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd funded-cobra-support
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Go to SQL Editor and run the schema from `src/lib/supabase/schema.sql`

### 4. Set Up Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a New Application
3. Go to OAuth2 > Add Redirect URL: `http://localhost:3000/api/auth/callback/discord`
4. Copy your Client ID and Client Secret

### 5. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
NEXT_PUBLIC_DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/callback/discord

# Discord Webhook (Optional)
DISCORD_WEBHOOK_URL=your-discord-webhook-url

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
funded-cobra-support/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (customer)/        # Customer dashboard routes
│   │   ├── (staff)/           # Staff dashboard routes
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── landing/           # Landing page components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── tickets/           # Ticket components
│   │   ├── admin/             # Admin components
│   │   └── chat/              # Chat components
│   ├── lib/
│   │   ├── supabase/          # Supabase client and schema
│   │   └── utils.ts           # Utility functions
│   ├── types/                 # TypeScript type definitions
│   ├── hooks/                 # Custom React hooks
│   └── utils/                 # Helper utilities
├── public/                    # Static assets
│   ├── images/
│   └── logo/
└── package.json
```

## 🎫 Ticket Categories

1. **Payout Support** - Payment verification and payout status
2. **Trading Account** - Account issues, credentials, rules
3. **Billing & Payments** - Purchase and payment problems
4. **Account Access** - Login and access issues
5. **Partnerships** - Affiliate and influencer inquiries
6. **General Support** - Other support needs

## 👥 User Roles

- **Customer** - Can create and manage their own tickets
- **Support Agent** - Can view and respond to all tickets
- **Finance Team** - Specialized access for payout/payment tickets
- **Partnership Manager** - Handles partnership inquiries
- **Administrator** - Full access to all features

## 🔒 Security Features

- Row-level security (RLS) policies in Supabase
- Role-based access control
- Secure file uploads
- Input validation
- Rate limiting
- Protected admin routes
- Encrypted customer data

## 📊 Analytics Metrics

- Total tickets by status
- Average response time
- Average resolution time
- Customer satisfaction ratings
- Tickets by category
- Staff performance metrics
- Ticket volume trends

## 🎯 Development Roadmap

- [x] Project setup and structure
- [x] Premium UI components
- [x] Landing page
- [ ] Database schema deployment
- [ ] Discord OAuth authentication
- [ ] Customer dashboard
- [ ] Ticket creation flow
- [ ] Real-time chat system
- [ ] Staff dashboard
- [ ] Admin features
- [ ] Analytics dashboard
- [ ] AI assistant integration
- [ ] Discord webhooks
- [ ] Mobile responsive design

## 🤝 Contributing

This is a private project for Funded Cobra. For any questions or issues, please contact the development team.

## 📝 License

Proprietary - All rights reserved by Funded Cobra.

## 🆘 Support

For technical support or questions about the platform, please:
1. Open a ticket through the support portal (when live)
2. Contact the development team directly
3. Check the internal documentation

---

**Built with ❤️ for Funded Cobra**
