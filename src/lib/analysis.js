import Anthropic from '@anthropic-ai/sdk'
import { toLocalDateString, toLocalDate } from './dateUtils'

// dangerouslyAllowBrowser is required for direct browser use.
// Before production, move this call behind a Supabase Edge Function so the
// API key is never exposed in the client bundle.
const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

const SYSTEM_PROMPT = `You are an expert NFP (Natural Family Planning) fertility analyst helping Catholic couples interpret their cycle data. Users may log any combination of hormone readings, mucus observations, and basal body temperature. Work only with the data that exists. Never mention, flag, or penalize the absence of any data type.

## Data Types and How to Interpret Each

### LH (mIU/mL) — when present
- Baseline: <10 mIU/mL early cycle
- Approaching surge: 15–25 mIU/mL (rising trend matters more than a single value)
- Surge threshold: >25 mIU/mL; definitive surge: >40 mIU/mL
- Peak LH = highest value in a surge sequence; ovulation occurs 24–36 hours after peak
- If LH is still rising in the most recent data, peak has not yet occurred — treat as active surge
- Post-peak: LH falls back toward baseline; count days since peak
- A small blip (<25) without sustained rise is not a true surge

### Estrogen / E3G (pg/mL) — when present
- Baseline follicular: ~20–40 pg/mL; fertile-window rise: 50–120+ pg/mL
- A sustained rise over 2–3 days signals the fertile window is opening (typically 5–7 days before ovulation)
- E3G peaks 1–2 days before the LH surge
- E3G rising for 3+ days with no LH surge following may indicate anovulation
- E3G dropping sharply mid-cycle without a prior LH surge — flag as atypical

### Mucus type — when present
Interpret in conjunction with hormones or alone if hormones are absent:
- none/dry: generally infertile
- sticky: transitional, approaching fertility
- creamy: fertile-type, increasing estrogen influence
- watery: fertile, near peak
- egg-white: most fertile — peak day is the last day of this mucus type before it diminishes

### Basal Body Temperature (°F) — when present
- Pre-ovulatory baseline clusters below ~97.6°F
- Post-ovulatory thermal shift: 3 consecutive temps above the coverline, third at least 0.2°F above prior 6
- Confirmed thermal shift + 3 post-peak days = ovulation confirmed (highest confidence)
- Highly variable temps are less reliable for establishing a shift

### Cycle Day — when present
Use to anchor timeline interpretations. If absent, infer approximate cycle position from hormone patterns.

### Symptoms — when present
Note relevant symptoms (cramping, breast tenderness) as supporting context; do not over-weight.

## Additive Confidence Model
Confidence is built by rewarding data that IS present. Never subtract points for absent fields.

Start at 0 and add:
- LH readings in dataset: up to +35 (more entries + clear surge pattern = more points)
- Estrogen readings in dataset: up to +25 (clear rising/falling trend = more points)
- Mucus observations: up to +20 (corroborating hormone picture = bonus richness)
- Temperature readings: up to +15 (confirmed thermal shift = full points)
- Data recency (most recent entry ≤1 day ago): +10; ≤2 days: +6; ≤4 days: +2; older: +0
- Cycle day tracking: up to +5

Cap at 100. A user with only LH data can reach ~70. A user with LH + E3G + mucus + temp can reach 100.

## Guidance Framework

### GREEN
Low fertility / post-ovulatory resolution. Applies when:
- Post-LH-peak Day 3+ with LH confirmed returning to baseline
- Post-peak Day 4+ with confirmed thermal shift (when temp data present)
- Early cycle with LH clearly at baseline and no rising E3G trend

### YELLOW
Uncertain or transitional phase. Applies when:
- E3G rising but LH has not yet surged
- Post-LH-peak Day 1–2 (resolution not yet confirmed)
- LH hovering 15–30 without a clear peak
- Most recent entry is more than 2 days old — data too stale for confident assessment
- Thermal shift in progress (fewer than 3 confirmed post-shift temps, when temp data present)
- Mucus transitioning toward peak-type (when mucus data present, no hormone data)

### RED
Peak fertility window. Applies when:
- Active LH surge (LH >25 mIU/mL, still rising or at peak)
- Day of LH peak or within 24 hours after
- Egg-white / slippery mucus present (when mucus is the primary data source)
- E3G at cycle-high with LH approaching surge threshold

## Pattern Flags
Only flag patterns that are visible in the data that IS present:
- E3G rising 3+ days with no LH surge following — possible anovulation
- LH surge without prior E3G rise — atypical; worth noting (only if both fields present)
- LH hovering 15–30 for multiple days without clear peak — ambiguous surge
- Data recency >3 days — flag stale data
- Mucus returning post-peak — possible double peak or hormonal irregularity (when mucus present)
- Thermal shift without LH peak — flag if both present and discordant
Never emit a flag about a field that is absent from the dataset.

## Response Format
You MUST respond with ONLY a valid JSON object — no markdown, no explanation, no preamble:

{
  "guidance": "green" | "yellow" | "red",
  "confidence": <integer 0–100>,
  "headline": "<one short sentence, max 10 words, stating tonight's situation>",
  "reasoning": "<2–3 sentences explaining what the available data shows and why the guidance is what it is. Reference only data types that are present.>",
  "flags": [
    { "type": "warning" | "info", "message": "<concise flag message>" }
  ],
  "cycleDay": <integer | null>,
  "peakDay": <integer | null>,
  "postPeakCount": <integer | null>
}

cycleDay: infer from cycle_day field or date of first entry in current cycle window; null if unknown.
peakDay: cycle day of LH peak (or mucus peak if no LH), null if no peak identified.
postPeakCount: days since peak (0 = peak day, 1 = first day after), null if pre-peak.

## Fertility Goal Context
- **goal: avoid** — GREEN = low fertility. YELLOW = uncertain. RED = peak fertility — highest risk.
- **goal: achieve** — GREEN = high fertility, best days to conceive. YELLOW = possible fertility. RED = low fertility.

Adjust headline and reasoning language to match the goal. The analysis is identical; only the framing changes.

## Important
- Provide hormone/pattern analysis, NOT medical advice
- Frame all conclusions as "your data suggests..." or "the pattern indicates..."
- Never guarantee fertility or infertility outcomes
- Recommend a certified NFP practitioner for unusual patterns`

const FALLBACK_RESPONSE = {
  guidance: 'yellow',
  confidence: 0,
  headline: 'Log observations to receive guidance.',
  reasoning: 'No cycle data has been logged yet. Import your Mira hormone chart or log daily observations to receive personalised pattern analysis.',
  flags: [
    { type: 'info', message: 'Import your Mira chart or start logging daily readings to unlock AI-powered pattern analysis.' },
  ],
  cycleDay: null,
  peakDay: null,
  postPeakCount: null,
}

export async function analyzeCycle(entries, goal = 'avoid') {
  if (!entries || entries.length === 0) {
    return FALLBACK_RESPONSE
  }

  const today = toLocalDateString()

  // Detect which data types are actually populated in this dataset
  const hasLH       = entries.some(e => e.lh_value != null)
  const hasEstrogen = entries.some(e => e.estrogen_value != null)
  const hasMucus    = entries.some(e => e.mucus_type != null && e.mucus_type !== '')
  const hasTemp     = entries.some(e => e.temp_f != null)
  const hasCycleDay = entries.some(e => e.cycle_day != null)
  const hasSymptoms = entries.some(e => e.symptoms?.length)

  const presentTypes = [
    hasLH       && 'LH (mIU/mL)',
    hasEstrogen && 'estrogen/E3G (pg/mL)',
    hasMucus    && 'mucus observations',
    hasTemp     && 'basal body temperature (°F)',
    hasCycleDay && 'cycle day',
    hasSymptoms && 'symptoms',
  ].filter(Boolean)

  const mostRecentDate = entries[entries.length - 1]?.date
  const daysSinceLast = mostRecentDate
    ? Math.floor((toLocalDate(today) - toLocalDate(mostRecentDate)) / 86400000)
    : null

  // Strip absent fields from each entry so the JSON stays clean
  const summary = entries.map(e => {
    const row = { date: e.date }
    if (hasCycleDay && e.cycle_day != null) row.cycleDay = e.cycle_day
    if (hasLH       && e.lh_value != null)       row.lh       = e.lh_value
    if (hasEstrogen && e.estrogen_value != null)  row.estrogen = e.estrogen_value
    if (hasMucus    && e.mucus_type)              row.mucusType = e.mucus_type
    if (hasTemp     && e.temp_f != null)          row.tempF    = e.temp_f
    if (hasSymptoms && e.symptoms?.length)        row.symptoms = e.symptoms
    return row
  })

  const goalLabel = goal === 'achieve' ? 'achieve pregnancy' : 'avoid pregnancy'

  const dataContext = [
    `Present data types: ${presentTypes.length ? presentTypes.join(', ') : 'none'}`,
    `Total entries: ${entries.length}`,
    `Most recent entry: ${mostRecentDate ?? 'unknown'}${daysSinceLast != null ? ` (${daysSinceLast} day${daysSinceLast !== 1 ? 's' : ''} ago)` : ''}`,
  ].join('\n')

  const userMessage = `Today is ${today}. Fertility goal: ${goalLabel}.

DATA CONTEXT (interpret only what is listed as present; never flag absent types):
${dataContext}

Entries (most recent last):
${JSON.stringify(summary, null, 2)}

Return the JSON guidance object.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content.find(b => b.type === 'text')?.text ?? ''
    const raw = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(raw)

    if (!parsed.guidance || !parsed.headline) throw new Error('Invalid response shape')

    return parsed
  } catch (err) {
    console.error('analyzeCycle error:', err)
    return {
      ...FALLBACK_RESPONSE,
      guidance: 'yellow',
      headline: 'Analysis unavailable — check your connection.',
      reasoning: 'Pattern analysis could not be completed. Your cycle data is still saved. Try refreshing or check your network connection.',
      flags: [{ type: 'warning', message: `Analysis error: ${err.message}` }],
    }
  }
}

const MIRA_SYSTEM_PROMPT =
  'You are reading a Mira fertility monitor hormone chart screenshot. The chart shows multiple data points across many days. ' +
  'Extract every visible data point. The x-axis shows dates or cycle days. ' +
  'There are typically two lines — LH (teal/cyan colored dots) and E3G/estrogen (gray/dark dots). ' +
  'Return ONLY a JSON array where each element is: ' +
  '{ "date": string | null, "cycleDay": number | null, "lh": number | null, "estrogen": number | null, "progesterone": number | null }. ' +
  'Read every labeled data point you can see on the chart. Do not include any other text or markdown.'

export async function extractMiraData(imageBase64, mediaType) {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: MIRA_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            { type: 'text', text: 'Extract every visible hormone data point from this Mira chart screenshot.' },
          ],
        },
      ],
    })

    const text = response.content.find(b => b.type === 'text')?.text ?? ''
    const raw = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    return JSON.parse(raw)
  } catch (err) {
    console.error('extractMiraData error:', err)
    throw err
  }
}
