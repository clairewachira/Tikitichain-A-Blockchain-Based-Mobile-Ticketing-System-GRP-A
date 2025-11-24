# Deployment Guide - Tikiti Chain Admin Dashboard

Complete guide for deploying your admin dashboard to production.

---

## 🚀 Quick Deploy (5 Minutes)

### Deploy to Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
cd admin-dashboard
vercel

# 4. Production deployment
vercel --prod
```

**Your dashboard will be live at:** `https://your-project.vercel.app`

---

## 📋 Pre-Deployment Checklist

- [ ] Supabase project is set up with correct schema
- [ ] Events table has data
- [ ] Environment variables are ready
- [ ] `.env.local` is configured locally
- [ ] App works in development (`bun dev`)
- [ ] Build succeeds (`bun run build`)
- [ ] Security measures planned (auth/IP whitelist)

---

## 🎯 Platform-Specific Deployment

### Option 1: Vercel (Best for Next.js)

#### Via CLI

```bash
vercel --prod
```

#### Via GitHub

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com/new)
3. **Import Repository**
4. Select your repo
5. **Configure Project**:
   - Framework Preset: Next.js
   - Build Command: `next build`
   - Output Directory: `.next`
6. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ADMIN_EMAIL=admin@tikiti-chain.com
   ```
7. **Deploy**

**Result:** Auto-deploys on every push to main branch

#### Custom Domain

1. Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your domain: `admin.tikiti-chain.com`
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

---

### Option 2: Netlify

#### Via CLI

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

#### Via GitHub

1. Push to GitHub
2. Go to [netlify.com](https://app.netlify.com/start)
3. **New site from Git**
4. Select your repository
5. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
7. **Deploy site**

---

### Option 3: Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=your_url
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Deploy
railway up
```

**Advantages:**
- Automatic HTTPS
- Custom domains included
- PostgreSQL if needed
- $5/month free credit

---

### Option 4: Self-Hosted (VPS/Server)

#### Using PM2

```bash
# Build the app
npm run build

# Install PM2
npm i -g pm2

# Start with PM2
pm2 start npm --name "tikiti-admin" -- start

# Save process list
pm2 save

# Auto-restart on reboot
pm2 startup
```

#### Using Docker

```bash
# Build image
docker build -t tikiti-admin .

# Run container
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  --name tikiti-admin \
  tikiti-admin
```

#### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name admin.tikiti-chain.com;

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

---

## 🔐 Adding Security

### Option 1: HTTP Basic Auth (Simplest)

Create `middleware.ts` in root:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get('authorization')
  const url = request.nextUrl

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    if (user === 'admin' && pwd === 'your-secure-password-here') {
      return NextResponse.next()
    }
  }

  url.pathname = '/api/auth'

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: '/:path*',
}
```

Create `app/api/auth/route.ts`:

```typescript
export async function GET() {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}
```

**Redeploy** and browser will prompt for password.

---

### Option 2: IP Whitelist (Vercel)

Create `vercel.json` in root:

```json
{
  "firewall": {
    "rules": [
      {
        "action": "deny",
        "condition": {
          "type": "ip_address",
          "value": "0.0.0.0/0"
        }
      },
      {
        "action": "allow",
        "condition": {
          "type": "ip_address",
          "value": "YOUR_OFFICE_IP"
        }
      }
    ]
  }
}
```

Only your IP can access the dashboard.

---

### Option 3: Supabase Auth (Most Secure)

1. **Create Auth Page**:

```typescript
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded-lg mb-4"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded-lg mb-6"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Sign In
        </button>
      </form>
    </div>
  )
}
```

2. **Protect Dashboard** in `app/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      router.push('/login')
    } else {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  // ... rest of dashboard code
}
```

3. **Create Admin User** in Supabase:
   - Go to Authentication → Users
   - Create new user with your email
   - Set password

---

## 🌐 Environment Variables

### Development (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_ADMIN_EMAIL=admin@tikiti-chain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production

**Vercel:**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_ADMIN_EMAIL
```

**Netlify:**
Site Settings → Environment Variables → Add

**Railway:**
```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL=xxx
```

---

## 📊 Performance Optimization

### Enable Caching

```typescript
// In fetchDashboardData()
const { data, error } = await supabase
  .from('events')
  .select('*')
  .order('created_at', { ascending: false })

// Add to options
{ cache: 'force-cache', next: { revalidate: 300 } } // 5 min cache
```

### Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image'

<Image
  src="/logo.png"
  width={200}
  height={50}
  alt="Tikiti Chain"
/>
```

### Enable Compression (Vercel)

Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

---

## 🔍 Monitoring

### Vercel Analytics

```bash
npm i @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Error Tracking (Sentry)

```bash
npm i @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "your-sentry-dsn",
  tracesSampleRate: 1.0,
})
```

---

## 🐛 Troubleshooting Deployment

### Build Fails

```bash
# Check build locally
npm run build

# Common issues:
# 1. TypeScript errors → Fix type issues
# 2. Missing env vars → Add to platform
# 3. Import errors → Check paths
```

### Runtime Errors

```bash
# Check logs
vercel logs         # Vercel
netlify logs        # Netlify
railway logs        # Railway

# Common fixes:
# 1. Add NEXT_PUBLIC_ prefix to client vars
# 2. Check Supabase URL/key
# 3. Verify RLS policies
```

### Can't Access Dashboard

1. Check deployment status
2. Verify DNS records (if custom domain)
3. Check firewall rules
4. Test without auth first

---

## ✅ Post-Deployment Checklist

- [ ] Dashboard loads successfully
- [ ] Data displays correctly
- [ ] All tabs work (Overview, Events, Tickets, etc.)
- [ ] Actions work (toggle blockchain, delete)
- [ ] Mobile responsive
- [ ] Security measures in place
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Environment variables set
- [ ] Error tracking enabled
- [ ] Performance is good (<3s load time)

---

## 🎉 You're Live!

Your admin dashboard is now deployed and ready for production use.

**Share the URL with your team** (with authentication credentials if applicable).

**Monitor regularly** for:
- Performance issues
- Error logs
- User feedback
- Security alerts

**Update frequently** by pushing to your main branch (auto-deploys on Vercel/Netlify).

---

## 📞 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Railway Docs**: https://docs.railway.app
- **Next.js Docs**: https://nextjs.org/docs

---

**Happy Deploying! 🚀**
