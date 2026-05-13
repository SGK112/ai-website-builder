#!/usr/bin/env node
// Smoke-test the grader on a known HTML input — verifies the analysis path
// runs without throwing and produces sensible scores. Doesn't go through
// the HTTP layer because auth is required there.

const SAMPLE_GOOD = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Surprise Granite — Countertop Fabrication in Surprise, AZ</title>
  <meta name="description" content="In-house granite, quartz, and quartzite countertop fabrication serving Surprise, AZ and the West Valley. Free quotes.">
  <link rel="canonical" href="https://example.com/">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"Surprise Granite"}</script>
</head>
<body>
  <h1>Premium Granite Countertops in Surprise</h1>
  <h2>About Us</h2>
  <p>We are an in-house fabricator providing custom countertops...</p>
  <img src="hero.jpg" alt="Granite kitchen countertop install">
  <a href="https://facebook.com/surprisegranite">Facebook</a>
  <a href="tel:+16028333189">(602) 833-3189</a>
  <a href="mailto:hi@surprisegranite.com">Email</a>
  <form><input name="email" type="email" required></form>
</body>
</html>`

const SAMPLE_BAD = `<html><body><h1>x</h1></body></html>`

// Load grader via dynamic import — needs to run through ts-node or tsx in
// theory, but we'll spawn an HTTP-less Node process that imports cheerio
// + replicates the surface enough to verify. Simpler: spawn a temp script
// inside the Next.js compile target via npx tsx.

import { spawnSync } from 'child_process'
const result = spawnSync('npx', ['tsx', '-e', `
  import { gradeHtml } from './src/lib/grader.ts'
  const good = ${JSON.stringify(SAMPLE_GOOD)}
  const bad  = ${JSON.stringify(SAMPLE_BAD)}
  ;(async () => {
    const a = await gradeHtml(good, 'https://example.com')
    const b = await gradeHtml(bad,  'https://example.com')
    console.log(JSON.stringify({
      good_overall: a.scores.overall,
      good_grade: a.scores.overall_grade,
      good_issues: a.issues.length,
      bad_overall: b.scores.overall,
      bad_grade: b.scores.overall_grade,
      bad_issues: b.issues.length,
    }))
  })().catch(e => { console.error('FATAL', e); process.exit(1) })
`], { encoding: 'utf8' })

if (result.status !== 0) {
  console.error('Grader test failed:', result.stderr || result.stdout)
  process.exit(1)
}
try {
  const out = JSON.parse(result.stdout.trim().split('\n').slice(-1)[0])
  const c = (s, x) => `\x1b[${x}m${s}\x1b[0m`
  const ok = (m) => console.log(c('✓', 32), m)
  const fail = (m) => { console.log(c('✗', 31), m); process.exitCode = 1 }
  ok(`GOOD html → overall ${out.good_overall} (${out.good_grade}), ${out.good_issues} issues`)
  ok(`BAD html  → overall ${out.bad_overall} (${out.bad_grade}), ${out.bad_issues} issues`)
  if (out.good_overall > out.bad_overall) ok('Sanity: good html scored higher than bad html')
  else fail('Sanity: bad html scored as high or higher than good — analysis broken')
  if (out.bad_issues > 0) ok(`Bad html flagged ${out.bad_issues} issues`)
  else fail('Bad html somehow had zero issues')
} catch (e) {
  console.error('Could not parse grader output:', result.stdout)
  process.exit(1)
}
