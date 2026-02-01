# Wilder Seasons Edition Generator

AI-powered city research tool that generates family-friendly place databases for Wilder Seasons city editions. Transforms city expansion from months of manual research to minutes.

## Features

- **Template Selection** — Automatically matches cities to Lincoln, Omaha, Des Moines, or USA edition templates based on population, region, and climate
- **Place Discovery** — Searches 7 categories (Nature, Farms, Libraries, Museums, Indoor Play, Gardens, Seasonal) using Brave Search API
- **Data Enrichment** — Enriches places with Google Places API (ratings, addresses, hours, pricing)
- **Brand Validation** — Scores each place 0-100 against Wilder Seasons brand criteria (accessibility, nature connection, family friendliness, local authenticity)
- **Icon Key System** — Assigns pricing, age appropriateness, and seasonality icons
- **Excel Export** — Generates formatted XLSX with 5 sheets (Master List, Category Summary, Review Queue, Rejection Log, Icon Key)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Generate (Demo)** to see sample output without any API keys.

## API Keys (for Live Mode)

Copy `.env.example` to `.env.local` and add your keys:

```bash
cp .env.example .env.local
```

| Key | Required | Purpose |
|-----|----------|---------|
| `BRAVE_API_KEY` | For live mode | Place discovery via Brave Search |
| `GOOGLE_PLACES_API_KEY` | Optional | Enrichment (ratings, addresses, hours) |

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/wilder-edition-generator-web)

1. Push to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables (`BRAVE_API_KEY`, `GOOGLE_PLACES_API_KEY`) in project settings
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts   # Main pipeline endpoint
│   │   └── export/route.ts     # Excel export endpoint
│   ├── layout.tsx
│   ├── page.tsx                # Main UI
│   └── globals.css
├── components/
│   ├── CityInput.tsx           # City/state input form
│   ├── PipelineProgress.tsx    # Step-by-step progress
│   ├── TemplateCard.tsx        # Template selection display
│   ├── SummaryCards.tsx        # Status summary cards
│   ├── ResultsTable.tsx        # Sortable/filterable results
│   └── ExportButton.tsx        # Excel download button
└── lib/
    ├── agents/
    │   ├── template-selector.ts  # City-to-template matching
    │   ├── research-agent.ts     # Brave Search discovery
    │   ├── places-enricher.ts    # Google Places enrichment
    │   ├── brand-validator.ts    # Brand scoring (0-100)
    │   ├── icon-applicator.ts    # Icon key assignment
    │   └── sample-data.ts        # Demo data generator
    ├── config/
    │   ├── templates.ts          # Edition templates
    │   ├── categories.ts         # Place categories
    │   └── brand-criteria.ts     # Scoring rules + icon key
    ├── types/
    │   └── index.ts              # TypeScript interfaces
    └── utils/
        └── excel-export.ts       # XLSX generation
```

## Brand Scoring

Places are scored on 4 weighted criteria:

| Criteria | Weight | What it measures |
|----------|--------|-----------------|
| Accessibility | 30% | Price (FREE = 100, $15+ = 20) |
| Nature Connection | 25% | Outdoor focus, nature keywords |
| Family Friendliness | 25% | Age-appropriate, family programs |
| Local Authenticity | 20% | Locally owned, community rooted |

**Statuses:** RECOMMENDED (80+), CONSIDER (60-79), REVIEW (40-59), REJECT (<40)

## Icon Key

| Icon | Meaning |
|------|---------|
| 🔷 | FREE admission |
| 💲 | $5-$10/person |
| 💲💲 | $10-$15/person |
| 💲💲💲 | $15+/person |
| 👶 | Baby-friendly (0-12mo) |
| 🧒 | Toddler-safe (1-3yr) |
| 👦 | Preschool+ (3-5yr) |
| ☀️ | Warm weather |
| ❄️ | Winter spot |

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript**
- **Tailwind CSS**
- **SheetJS (xlsx)** for Excel generation
- **Lucide React** for icons
