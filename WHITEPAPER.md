# Wilder Seasons Edition Generator

## A Multi-Agent AI System for Automated Local Discovery and 52-Week Family Adventure Planning

**Version 1.0 | February 2026**

---

## Abstract

Wilder Seasons is a family nature brand that publishes city-specific 52-week adventure guides for families with young children (ages 0-5). Each "edition" requires identifying, validating, scoring, and scheduling dozens of local places across seven categories — a process that previously required months of manual research per city.

This paper presents the Wilder Seasons Edition Generator, a web-based system that reduces city expansion from months of manual work to minutes of automated processing. The system employs a multi-agent AI architecture combining real-time web search (Brave Search API, Gemini with Google Search grounding), large language model curation (Claude Sonnet 4, GPT-4o fallback), Google Places validation, algorithmic brand scoring, and server-side anti-repeat enforcement to produce publication-ready 52-week plans with verified local places.

The key architectural insight is that **AI should review and curate human-generated web content, not generate places from memory**. Early iterations that relied on LLMs to generate place listings from parametric knowledge produced inferior results — hallucinated businesses, missing real landmarks, and inconsistent coverage. The current system inverts this: web search discovers real places first, then AI reviews, filters, and enriches them.

---

## 1. Problem Statement

### 1.1 The Manual Process

Publishing a new Wilder Seasons city edition requires:

- **Discovery**: Finding 80-150 family-friendly places across nature spots, farms, libraries, museums, indoor play spaces, gardens, and seasonal attractions
- **Validation**: Confirming each place actually exists, is currently operating, and is appropriate for young children
- **Evaluation**: Scoring each place against brand criteria (accessibility, nature connection, family-friendliness, local authenticity)
- **Scheduling**: Assigning places to 52 themed weeks while respecting seasonality, variety, and repeat constraints
- **Documentation**: Compiling addresses, hours, pricing, age ranges, and editorial descriptions

This process was conducted manually using ChatGPT conversations, Google searches, and spreadsheets. A single city edition required an estimated 40-60 hours of research, with quality varying significantly based on researcher familiarity with the target city.

### 1.2 Limitations of Pure LLM Generation

An initial approach attempted to have Claude generate place listings directly from its training data. This produced measurably worse results than web search:

- **Hallucination**: LLMs confidently named businesses that had closed, never existed, or were located in different cities
- **Recency gap**: Training data cutoffs meant new openings, seasonal venues, and recently renamed locations were missed entirely
- **Coverage bias**: Well-known chains and tourist attractions dominated; local gems with minimal web presence were systematically underrepresented
- **Category imbalance**: Some categories (museums, zoos) were over-served while others (seasonal events, community gardens) had sparse coverage

These findings led to the architectural principle that **web search must precede AI involvement**, with LLMs restricted to curation, enrichment, and scheduling roles.

---

## 2. System Architecture

### 2.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.x |
| Runtime | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| Hosting | Vercel (Hobby Plan) | Edge Runtime |
| Export | SheetJS (xlsx) | 0.18.5 |
| Icons | Lucide React | 0.563.0 |

### 2.2 External Services

| Service | Role | Model/Version |
|---------|------|--------------|
| Brave Search API | Web discovery (keyword-based) | Web Search API v1 |
| Google Gemini | Web discovery (grounded search) | gemini-2.5-flash |
| Anthropic Claude | AI curation, week matching | claude-sonnet-4-20250514 |
| OpenAI GPT-4o | Fallback for Claude | gpt-4o |
| Google Places API | Place validation and enrichment | Places API v1 |

### 2.3 Deployment Constraints

The system operates within Vercel Hobby Plan limits:

- **Serverless functions**: 10-second timeout
- **Edge functions**: 30-second timeout
- **No persistent storage**: All state is client-side during generation

To accommodate these constraints, all AI-intensive operations use Edge Runtime (`export const runtime = "edge"`), and the pipeline is decomposed into discrete API endpoints that the client orchestrates sequentially.

---

## 3. Pipeline Architecture

The system implements a seven-stage pipeline, orchestrated client-side with real-time progress reporting:

```
1. Template Selection
   └── Matches city to best-fit edition template
         ↓
2. Multi-Source Discovery (7 categories, parallel)
   ├── Gemini 2.5 Flash + Google Search grounding
   └── Brave Search API (2 queries per category)
   → Merge + deduplicate by normalized name
         ↓
3. AI Curation (Claude reviews ALL discovered places)
   └── Filters junk, writes descriptions, assigns metadata
   → Claude is REVIEWER only — never invents places
         ↓
4. Google Places Validation (batches of 3)
   └── Confirms existence, retrieves addresses/ratings/reviews
         ↓
5. Brand Scoring + Icon Application
   └── 4-axis weighted scoring, status assignment, icon strings
         ↓
6. AI Week Matching + Anti-Repeat Enforcement
   ├── Claude suggests matches for 52 themed weeks
   └── Server-side code enforces max 2 uses per place
         ↓
7. Compilation
   └── Final dataset ready for review and export
```

### 3.1 Stage 1: Template Selection

Four edition templates define the character of different city types:

| Template | Base City | Population Range | Key Weights |
|----------|-----------|-----------------|-------------|
| Lincoln (B) | Lincoln, NE | 50K - 300K | Nature 1.3x, Farm 1.2x |
| Omaha (A) | Omaha, NE | 300K - 1M | Museum 1.2x, Indoor Play 1.1x |
| Des Moines (C) | Des Moines, IA | 150K - 500K | Farm 1.3x, Nature/Library 1.1x |
| USA Generic | — | Any | All categories 1.0x |

Template selection uses population, state region, and city characteristics to find the best match. Each template carries 52 weekly themes with reference places that guide the week-matching stage.

### 3.2 Stage 2: Multi-Source Discovery

Discovery is the system's most critical stage. Seven categories are searched in parallel:

1. **Nature** — Parks, trails, nature preserves, wildlife areas
2. **Farm** — Farms, orchards, petting zoos, agricultural experiences
3. **Library** — Public libraries with children's programs
4. **Museum** — Children's museums, science centers, cultural institutions
5. **Indoor Play** — Play spaces, activity centers, creative studios
6. **Garden** — Botanical gardens, community gardens, arboretums
7. **Seasonal** — Seasonal events, holiday attractions, festivals

Each category triggers two discovery sources running in parallel:

#### Brave Search Discovery

Two keyword queries per category (e.g., "best family farms near Wichita KS for toddlers" and "Wichita KS petting zoo children activities"). Results are parsed to extract place names, snippets, and source URLs from search result titles and descriptions.

#### Gemini with Google Search Grounding

Gemini 2.5 Flash is called with Google Search grounding enabled (`tools: [{ google_search: {} }]`), which causes the model to perform real-time Google searches before responding. The prompt requests a JSON array of real, currently-operating places with names, descriptions, outdoor/indoor status, and price tiers. Grounding metadata provides source URLs for attribution.

**Merge Strategy**: Gemini results are prioritized (higher confidence due to grounding verification), followed by Brave results, with deduplication by normalized place name (lowercased, non-alphabetic characters removed).

**Resilience**: Either source can fail independently without blocking the pipeline. If both fail for a category, that category returns empty results and the pipeline continues with other categories.

### 3.3 Stage 3: AI Curation

All raw discovery results (typically 80-120 places across all categories) are submitted to Claude Sonnet 4 for review. The system prompt defines a "Wilder Seasons Brand Specialist" role with strict instructions:

- **Accept** places that are real, family-appropriate, and align with brand values
- **Reject** chains, adult venues, permanently closed locations, and duplicates
- For accepted places: write a 100-character description in "Wilder voice," assign a category, estimate price tier, and flag age appropriateness and seasonality

Claude returns a structured JSON response with `accepted` and `rejected` arrays, including rejection reasons for audit purposes.

**Fallback chain**: If Claude fails, the system attempts OpenAI GPT-4o with the same prompt. If both fail, raw places pass through with minimal metadata and an editorial note flagging the need for manual review.

### 3.4 Stage 4: Google Places Validation

Curated places are validated against the Google Places API in batches of three. For each place, the system:

- Confirms the place exists in Google's database
- Retrieves the verified address, phone number, and website
- Collects the Google rating and review count
- Updates the place record with authoritative data

Places that cannot be found in Google Places retain their web-sourced data but are flagged for human review.

### 3.5 Stage 5: Brand Scoring

Each place receives a composite score from 0-100 based on four weighted axes:

| Axis | Weight | Evaluation Criteria |
|------|--------|-------------------|
| Accessibility | 30% | Price tier (FREE=100, $5-$10=80, $10-$15=60, $15+=20) |
| Nature Connection | 25% | Presence of nature keywords in name/description, outdoor classification |
| Family Friendliness | 25% | Age-appropriate indicators, family-oriented keywords, safety signals |
| Local Authenticity | 20% | Absence from chain lists, local ownership indicators, community ties |

**Hard Filters** reject places regardless of score:
- Price exceeds $15 per person
- Identified as a chain establishment (McDonald's, Walmart, Chuck E. Cheese, etc.)
- Adult-only venue (bars, breweries, casinos, etc.)
- Not family-appropriate

**Status Assignment**:
- **RECOMMENDED** (80+): Ready for publication
- **CONSIDER** (60-79): Likely suitable, merits brief review
- **REVIEW** (40-59): Needs human evaluation
- **REJECT** (<40 or hard filter triggered): Excluded from output

An icon string is generated for each place encoding pricing, age suitability, and seasonality information for at-a-glance reference in the final publication.

### 3.6 Stage 6: AI Week Matching with Anti-Repeat Enforcement

This stage assigns places to 52 themed weeks. It operates in two phases:

**Phase 1 — AI Suggestion**: Claude receives the full place library (excluding rejected places) and all 52 weekly themes. The prompt instructs Claude to match by understanding the *intent and spirit* of each theme, considering seasonality (outdoor places for spring/summer weeks, indoor for winter), preferring higher-scored places, and providing both a primary and alternate match per week.

**Phase 2 — Server-Side Anti-Repeat Enforcement**: Claude's suggestions pass through a deterministic enforcement algorithm:

```
For each week 1-52 (processed sequentially):
  1. Check if AI's primary suggestion has been used < 2 times
     - If yes: accept, increment usage counter
     - If no: find best available replacement via keyword scoring
  2. Check if AI's alternate suggestion has been used < 2 times
     AND differs from primary
     - If yes: accept, increment usage counter
     - If no: find best available replacement via keyword scoring
  3. Record final primary and alternate assignments
```

The `findBestAvailable` function scores all eligible places (not rejected, under usage limit, not the excluded name) against the week's theme using keyword matching and brand score, returning the highest-scoring candidate.

This two-phase approach combines AI's semantic understanding of theme-to-place matching with guaranteed constraint enforcement that no prompting strategy can achieve.

**Fallback**: If AI matching fails entirely, the system falls back to pure keyword scoring across all 52 weeks, still with anti-repeat enforcement.

### 3.7 Stage 7: Compilation

The final dataset is assembled and presented to the user with:
- Summary statistics (total places, recommended/consider/review/reject counts)
- Template selection details
- Full results table with all place metadata
- 52-week plan with primary and alternate assignments
- Export capability

---

## 4. Export System

The system generates a multi-sheet Excel workbook (`.xlsx`) containing six sheets:

| Sheet | Contents | Purpose |
|-------|----------|---------|
| Places Master List | All places with 20 columns of metadata | Complete database |
| Category Summary | Aggregated statistics per category | Coverage analysis |
| Human Review Queue | CONSIDER and REVIEW status places | Editorial workflow |
| Rejection Log | Rejected places with reasons | Audit trail |
| Weekly Plan | 52 weeks with themes, matches, alternates, and reasons | Publication planning |
| Icon Key Reference | Icon meanings and example combinations | Staff reference |

The Weekly Plan sheet includes both AI-generated match reasons and alternate place suggestions, enabling editors to make informed substitutions when needed.

---

## 5. Resilience and Fallback Strategy

Every external dependency has a defined fallback:

| Failure | Impact | Fallback |
|---------|--------|----------|
| Gemini API down | Reduced discovery coverage | Brave-only discovery continues |
| Brave Search API down | Reduced discovery coverage | Gemini-only discovery continues |
| Both discovery sources down | Empty results for affected category | Other categories continue; pipeline proceeds |
| Claude API down | No AI curation | OpenAI GPT-4o attempts same task |
| Both LLMs down (curation) | No AI filtering | Raw places pass through with review flags |
| Both LLMs down (matching) | No semantic matching | Keyword-based matching with anti-repeat |
| Google Places API down | No address verification | Unvalidated places retained with flags |

The system is designed to degrade gracefully — a complete failure of all AI services still produces a usable (if less refined) output through keyword matching and pass-through of web search results.

---

## 6. Design Principles

### 6.1 AI as Reviewer, Not Generator

The most significant architectural decision is restricting AI to a review role. LLMs excel at evaluating, filtering, and enriching structured data but produce unreliable results when asked to generate factual listings from memory. Web search provides the factual foundation; AI provides the editorial judgment.

### 6.2 Enforcement in Code, Not in Prompts

Constraints that must be guaranteed (anti-repeat limits, primary/alternate distinctness) are enforced algorithmically, not through prompt engineering. AI suggestions are treated as recommendations subject to deterministic post-processing.

### 6.3 Parallel Where Possible, Sequential Where Necessary

The seven discovery categories run in parallel (14 concurrent API calls: 7 Brave + 7 Gemini). Subsequent stages that depend on aggregated results run sequentially. Google Places validation uses batches of three to balance throughput against rate limits.

### 6.4 Transparent Progress

Each pipeline stage reports real-time progress to the user, including category completion counts, batch progress, and place counts at each stage. This transparency builds trust in the automated process and helps identify failures quickly.

### 6.5 Graceful Degradation

No single external service failure should halt the pipeline. The system is designed so that partial results are always preferable to no results, with clear flags indicating where human review is needed.

---

## 7. Weekly Theme System

Each template edition defines 52 weekly themes organized by season:

| Season | Weeks | Example Themes |
|--------|-------|---------------|
| Winter | 1-9, 49-52 | Cozy Beginnings, Arctic Animals, Warm Cocoa Walks |
| Spring | 10-22 | Signs of Spring, Garden Planting, Butterfly Watch |
| Summer | 23-35 | Zoo Adventures, Splash Days, Berry Picking |
| Fall | 36-48 | Apple Orchards, Pumpkin Week, Leaf Art |

Each theme includes:
- **Title**: The week's activity theme
- **Reference place note**: An example place from the base city showing the theme's intent (e.g., "Lauritzen Gardens" for a botanical theme in Omaha)
- **Season classification**: Guides the matcher toward weather-appropriate places

The reference place notes are critical for AI matching — they communicate the *type* of experience intended, not a specific required venue. The matcher finds the closest local equivalent in the target city.

---

## 8. Demo Mode

A demo mode provides instant results using pre-built sample data, requiring no API keys. This enables:
- Stakeholder demonstrations without API costs
- UI/UX testing and iteration
- Onboarding new team members to the system

Demo data mirrors the structure of live results, including all metadata fields, brand scores, and icon strings.

---

## 9. Results and Observations

### 9.1 Discovery Coverage

Multi-source discovery (Brave + Gemini) consistently outperforms single-source approaches:

- Gemini with Google Search grounding provides high-confidence, well-described results with source attribution
- Brave Search provides broader keyword coverage, capturing places that Gemini's grounding may organize differently
- Combined deduplication typically yields 80-120 unique places per city across all categories

### 9.2 Curation Quality

AI curation typically accepts 60-75% of discovered places, rejecting:
- Chain establishments misidentified as local
- Adult-oriented venues appearing in family search results
- Duplicate listings with slightly different names
- Places that have closed or relocated

### 9.3 Anti-Repeat Effectiveness

Server-side enforcement guarantees no place appears more than twice across 52 weeks. In practice:
- Flagship venues (major zoos, central parks) typically use both allowed slots
- Most places appear once
- The alternate assignment ensures editorial flexibility without requiring re-runs

---

## 10. Future Directions

Several enhancements are under consideration:

- **Additional city templates** for regions beyond the Midwest (Southeast, West Coast, Mountain)
- **Photo integration** via Google Places photos for visual verification
- **Historical data** tracking previously published editions to avoid staleness across annual updates
- **User feedback loops** allowing editors to flag quality issues that refine future runs
- **Batch city processing** for simultaneous multi-city expansion campaigns
- **Custom theme authoring** enabling editors to modify weekly themes per edition

---

## 11. Conclusion

The Wilder Seasons Edition Generator demonstrates that complex editorial workflows — requiring factual accuracy, brand alignment, creative judgment, and constraint satisfaction — can be effectively automated through a multi-agent architecture that combines web search, AI curation, API validation, and algorithmic enforcement.

The key insight is architectural: AI works best as a reviewer of real-world data, not as a generator of factual claims. By grounding every place in web search results and validating against Google's database, the system achieves reliability that pure LLM generation cannot. By enforcing constraints in code rather than prompts, it achieves guarantees that probabilistic models cannot.

The result is a system that transforms months of manual research into minutes of automated processing, producing publication-ready datasets that editorial teams can review, refine, and publish with confidence.

---

## Appendix A: API Route Reference

| Endpoint | Runtime | Purpose |
|----------|---------|---------|
| `POST /api/generate` | Serverless | Demo mode generation |
| `POST /api/generate/template` | Serverless | Template selection |
| `POST /api/generate/discover` | Edge | Multi-source discovery (per category) |
| `POST /api/generate/curate` | Edge | AI curation |
| `POST /api/generate/enrich` | Edge | Google Places validation (per batch) |
| `POST /api/generate/finalize` | Serverless | Brand scoring + icons |
| `POST /api/generate/match-weeks` | Edge | AI week matching + anti-repeat |
| `POST /api/export` | Serverless | Excel workbook generation |

## Appendix B: Environment Variables

| Variable | Service | Required |
|----------|---------|----------|
| `BRAVE_API_KEY` | Brave Search API | One of Brave/Gemini required |
| `GEMINI_API_KEY` | Google Gemini API | One of Brave/Gemini required |
| `ANTHROPIC_API_KEY` | Anthropic Claude API | Recommended |
| `OPENAI_API_KEY` | OpenAI GPT-4o API | Fallback for Claude |
| `GOOGLE_PLACES_API_KEY` | Google Places API | Recommended |

## Appendix C: Brand Scoring Formula

```
score = (accessibility * 0.30) + (nature * 0.25) + (family * 0.25) + (local * 0.20)

Where:
  accessibility = f(price_tier)  →  FREE=100, $5-$10=80, $10-$15=60, $15+=20
  nature        = f(nature_keywords, outdoor_flag, category)
  family        = f(family_keywords, age_flags, safety_signals)
  local         = f(NOT chain, NOT adult_venue, community_indicators)

Status:
  score >= 80  →  RECOMMENDED
  score >= 60  →  CONSIDER
  score >= 40  →  REVIEW
  score <  40  →  REJECT
```

## Appendix D: Repository

- **Source**: https://github.com/dallyp22/wilder-edition-generator
- **Deployment**: https://wilder-edition-generator-web.vercel.app
- **Stack**: Next.js 16 / TypeScript / Tailwind CSS 4 / Vercel Edge Runtime
