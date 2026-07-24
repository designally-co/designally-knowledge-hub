/**
 * Dev-only: fill existing resources with placeholder editorial content so the
 * article pages render fully (dek, rich-text body, references) before real
 * content exists. Idempotent-ish: only fills ARTICLES whose body is still
 * empty, so it won't clobber anything authored in the admin.
 *
 * The body copy is GENERIC placeholder design prose — it deliberately makes no
 * factual claims about the real agencies named in the seeded titles.
 *
 * Run:  node --env-file=.env --import tsx ./src/scripts/fillMockContent.ts
 */
import { getPayload } from 'payload'

import config from './../payload.config'
import { countWords } from '../lib/readingTime'

// ---- Lexical node builders --------------------------------------------------
const text = (t: string, bold = false) => ({
  type: 'text',
  text: t,
  format: bold ? 1 : 0,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
})

const para = (...children: ReturnType<typeof text>[]) => ({
  type: 'paragraph',
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  textFormat: 0,
  textStyle: '',
})

const p = (t: string) => para(text(t))

const h2 = (t: string) => ({
  type: 'heading',
  tag: 'h2',
  children: [text(t)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const ul = (items: string[]) => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  children: items.map((it, i) => ({
    type: 'listitem',
    value: i + 1,
    children: [text(it)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  })),
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const doc = (children: unknown[]) => ({
  root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 },
})

// ---- Placeholder content pools ---------------------------------------------
const DEKS = [
  'A closer look at the decisions that separate a brand people remember from one they scroll past.',
  'Practical lessons on building identity systems that hold up long after the launch deck is closed.',
  'How strong studios turn a fuzzy brief into a system a whole team can build against.',
  'What it really takes to make craft legible to clients who buy on instinct, not theory.',
  'The unglamorous, repeatable work behind identities that feel effortless.',
  'Notes on process, restraint, and the difference between decoration and design.',
]

const INTROS = [
  'Great identity work rarely announces itself. It shows up as a hundred small, consistent decisions that add up to something a stranger trusts on sight. This piece pulls a few of those decisions into the open.',
  'Most of the value in a brand system is invisible by design. When it works, nobody notices the scaffolding — they just feel that everything belongs together. Here is a look at how that feeling gets built.',
  'The gap between a good idea and a working system is mostly craft and repetition. This article walks through the parts of that work that tend to get skipped, and why they matter more than the hero shot.',
]

type Section = { heading: string; paras: string[]; list?: string[] }

const SECTIONS: Section[] = [
  {
    heading: 'Start with the problem, not the logo',
    paras: [
      'The temptation is to reach for a mark on day one. The stronger move is to name the problem the brand is actually solving, in plain language, before a single shape is drawn.',
      'A clear problem statement becomes the thing every later decision is measured against. It turns taste debates into design decisions, because there is finally a standard to point at.',
    ],
  },
  {
    heading: 'Systems beat one-off assets',
    paras: [
      'A single beautiful artboard is easy. A system that stays coherent across a hundred surfaces, built by people who were not in the room, is the real deliverable.',
    ],
    list: [
      'Define the smallest set of rules that still feels rich.',
      'Make the defaults good, so the easy path is the right one.',
      'Document the why, not just the what — rules without reasons get broken.',
    ],
  },
  {
    heading: 'Make the invisible decisions visible',
    paras: [
      'Spacing, rhythm, and restraint are the decisions clients rarely see and always feel. Surfacing them — showing the grid, naming the intervals — is how you turn instinct into something a team can repeat.',
      'When the quiet decisions are legible, review stops being about opinion and starts being about whether the work meets its own stated intent.',
    ],
  },
  {
    heading: 'Craft is the argument',
    paras: [
      'You can talk about quality, or you can demonstrate it. The finish of the work is the most persuasive thing in the room, because it is the one part a competitor cannot copy from a slide.',
    ],
  },
  {
    heading: 'Ship, then refine',
    paras: [
      'No system survives first contact with a real product untouched. The goal is not a perfect launch — it is a launch honest enough that the first round of fixes is small and obvious.',
    ],
  },
  {
    heading: 'What to take into your own work',
    paras: [
      'You do not need a large team or a famous client to apply any of this. Most of it is a posture: solve the problem first, build the system second, and let the craft carry the argument.',
    ],
    list: [
      'Write the problem down before you open the design tool.',
      'Ship the smallest coherent system, then grow it.',
      'Treat finish as strategy, not decoration.',
    ],
  },
]

const REFS = [
  { label: 'Further reading — Principles of durable brand systems', url: 'https://example.com/brand-systems' },
  { label: 'Related resource — The identity design checklist', url: 'https://example.com/identity-checklist' },
  { label: 'Background — On craft, consistency and restraint', url: 'https://example.com/craft' },
]

const FILE_SIZES = ['1.2 MB', '2.4 MB', '680 KB', '4.1 MB', '3.3 MB', '920 KB']
const LICENCE = 'Free for personal and commercial use. Attribution appreciated but not required.'

// Rotate a slice out of a pool so consecutive items differ.
const rotate = <T,>(pool: T[], start: number, n: number): T[] =>
  Array.from({ length: n }, (_, k) => pool[(start + k) % pool.length])

const run = async () => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'resources',
    where: {},
    limit: 1000,
    pagination: false,
    depth: 0,
  })

  let filledArticles = 0
  let filledFiles = 0

  for (let i = 0; i < docs.length; i++) {
    const r = docs[i] as { id: number | string; type: string; body?: unknown }

    if (r.type === 'article') {
      if (countWords(r.body) > 0) continue // already has a body — leave it

      const sections = rotate(SECTIONS, i, 4)
      const children: unknown[] = [p(INTROS[i % INTROS.length])]
      for (const s of sections) {
        children.push(h2(s.heading))
        for (const pp of s.paras) children.push(p(pp))
        if (s.list) children.push(ul(s.list))
      }

      await payload.update({
        collection: 'resources',
        id: r.id,
        data: {
          summary: DEKS[i % DEKS.length],
          body: doc(children),
          references: rotate(REFS, i, 2).map(({ label, url }) => ({ label, url })),
        },
      })
      filledArticles++
    } else if (r.type === 'template') {
      await payload.update({
        collection: 'resources',
        id: r.id,
        data: {
          summary: DEKS[(i + 2) % DEKS.length],
          fileSize: FILE_SIZES[i % FILE_SIZES.length],
          licence: LICENCE,
        },
      })
      filledFiles++
    }
  }

  payload.logger.info(`✅ Filled ${filledArticles} articles and ${filledFiles} files with placeholder content.`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
