# Google Scraper & LeadGen Dashboard (Frontend)

Next.js 14 SaaS dashboard for Lead Generation and Business Intelligence using Google Maps Places API.

## Features
- Real-time job tracker using Server-Sent Events (SSE)
- Multi-step scraping job wizard
- TanStack Table with filtering, pagination, and sorting
- CSV & XLSX data exports
- Clean modern light SaaS UI

## Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-backend-api-url.com
```

## Running Locally
```bash
npm install
npm run dev
```

Dashboard will be live at `http://localhost:3000`.

## Deployment on Vercel
1. Import this repository in Vercel.
2. Set `NEXT_PUBLIC_API_URL` in Environment Variables.
3. Deploy!
