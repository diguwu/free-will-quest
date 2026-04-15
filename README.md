# Free Will Quest 🔥

A gamified daily challenge app that breaks apathy through real-world dares, photo verification, and streak-based motivation.

## Features

✅ **Daily Dares** - Pick one of two real-world quests each day  
✅ **Photo Proof** - Upload proof photos (admin verifies manually)  
✅ **Streak System** - Maintain your day streak or lose it all  
✅ **Shop & Currency** - Earn ₹, spend on power-ups  
✅ **Leaderboard** - Compete with others  
✅ **Admin Verification** - Manual approval system (no AI cost)  
✅ **PWA Ready** - Install as app on mobile/desktop  
✅ **Propeller Ads** - Free monetization  

## Quick Start

### Local Development
```bash
cd fwq
python -m http.server 3000
# Open http://localhost:3000
```

Or use Node:
```bash
npx -y http-server -p 3000
# Open http://localhost:3000
```

### Admin Login
- **Username:** `admin`
- **Password:** `500222`

## Deployment

### Deploy to Vercel (Recommended)
1. Push to GitHub
2. Go to https://vercel.com
3. Connect your repo
4. Deploy with 1 click

### Deploy to Netlify
1. Drag & drop `fwq` folder to netlify.com
2. Instant live URL

## Monetization

### Propeller Ads
- Sign up: https://propellerads.com
- Get your site ID
- Replace `YOUR_SITE_ID` in `index.html`
- Ads display automatically

### App Revenue
- **Banners** - Top of each tab
- **CPM:** ₹5-50 per 1000 impressions (India)
- **Est. Income:** ₹500-5000/month at 5000 daily users

## Admin Panel

Click 🔐 icon → Login with admin credentials

**Features:**
- View pending photo submissions
- Approve/reject with custom roasts
- Award XP and currency to users

## File Structure

```
fwq/
├── index.html          # Main app (PWA config + Propeller Ads)
├── app.jsx            # React components & logic
├── manifest.json      # PWA metadata
├── service-worker.js  # Offline support
├── README.md          # This file
└── package.json       # Dependencies (optional)
```

## Configuration

### Add Propeller Ads
1. Sign up at https://propellerads.com
2. Create a site, get Site ID
3. Replace in `index.html`:
```html
<!-- Replace with your site ID -->
<script async src="https://cdn.propellerads.com/js/pa.js?site=YOUR_SITE_ID"></script>
```

### Customize Admin Credentials
Edit `app.jsx`:
```javascript
const ADMIN_USERNAME = "admin";        // Change username
const ADMIN_PASSWORD = "500222";       // Change password
```

## Tech Stack

- **React 18** - UI framework
- **Babel** - JSX transpiler
- **Service Worker** - Offline support
- **LocalStorage** - Data persistence
- **Propeller Ads** - Monetization

## Browser Support

✅ Chrome/Edge  
✅ Firefox  
✅ Safari  
✅ Mobile browsers (iOS/Android)  

## License

MIT - Free to use, modify, deploy

## Support

Questions? Issues? Create a GitHub issue or reach out.

---

**Made with ❤️ for building discipline through dares.**
