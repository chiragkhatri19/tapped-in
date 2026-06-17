# Science Library Authoring Template

Goal: grow `data/evidence.ts` toward 200 cards without lowering citation quality.

## Card template

```ts
{
  id: 'unique_slug',
  claim: 'User-facing claim',
  shortExplanation: '2-3 sentence summary.',
  detailedExplanation: 'Longer explanation with practical caveats.',
  confidence: 'high' | 'moderate' | 'emerging',
  category: 'calorie_estimation' | 'protein' | 'fat' | 'carbs' | 'neat' |
    'deficit' | 'surplus' | 'fiber' | 'hydration' | 'training' |
    'micronutrients' | 'supplements' | 'sleep' | 'recovery' | 'body_composition',
  citations: [{ title, authors, year, journal, doi }]
}
```

## Citation checklist

- Prefer meta-analyses, systematic reviews, Cochrane reviews, and major consensus statements.
- DOI must be real and copied from the journal/Crossref page.
- Include journal and year.
- Do not add a nutrition/training claim unless it maps to an `EvidenceCard`.
- If evidence is mixed, mark confidence `moderate` or `emerging` and state caveats.

## Growth tracker

- Current code pool: see `EVIDENCE_CARDS.length`.
- Next target: 80 verified cards.
- Long target: 200 verified cards.

Batch topics: protein, energy balance, resistance training, sleep/recovery, micronutrients, supplements, body composition.
