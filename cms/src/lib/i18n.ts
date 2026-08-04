/*
 * Front-end internationalisation for the bilingual Hub.
 *
 * URLs: English is the default and stays UNPREFIXED (`/`, `/articles/x`); Thai is
 * served under `/th` (`/th`, `/th/articles/x`). A middleware rewrites unprefixed
 * requests to the internal `/en/...` tree so the `[lang]` segment always resolves.
 *
 * The Payload locale codes ('en' | 'th') are reused as the URL locales.
 */

export const LOCALES = ['en', 'th'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** URL prefix for a locale: '' for the default (en), '/th' otherwise. */
export function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`
}

/**
 * Build an href for a path in a given locale. `path` is the locale-agnostic path
 * starting with '/' (e.g. '/articles/x', '/'). English keeps the bare path; Thai
 * gets the '/th' prefix.
 */
export function localeHref(locale: Locale, path: string): string {
  const clean = path === '/' ? '' : path
  const prefixed = `${localePrefix(locale)}${clean}`
  return prefixed === '' ? '/' : prefixed
}

/**
 * Given a full pathname (as seen in the browser), return the same page in the
 * target locale — used by the language switcher. Strips any current locale
 * prefix, then re-applies the target's.
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  let bare = pathname
  for (const l of LOCALES) {
    if (l === DEFAULT_LOCALE) continue
    const p = `/${l}`
    if (bare === p) bare = '/'
    else if (bare.startsWith(`${p}/`)) bare = bare.slice(p.length)
  }
  return localeHref(target, bare.startsWith('/') ? bare : `/${bare}`)
}

/* -------------------------------------------------------------------------- */
/* UI string dictionary                                                        */
/* -------------------------------------------------------------------------- */

export type Dictionary = {
  localeName: string // this locale's own name, for the switcher
  skipToContent: string
  nav: { resources: string; topics: string; subscribe: string; viewAll: string; menu: string; closeMenu: string }
  footer: {
    tagline: [string, string] // two lines
    blurb: string
    social: string
    explore: string
    topics: string
    resources: string
    rights: string // "All rights reserved."
  }
  cta: {
    eyebrow: string
    title: string
    lede: string
    button: string
    placeholder: string
    note: string
  }
  article: { related: string; onThisPage: string; references: string; writtenBy: string; minRead: string; share: string; copyLink: string; copied: string; shareVia: string }
  home: {
    heading: string
    heroLede: string
    topicsLabel: string
    allTopics: string
    recentArticle: string
    readArticle: string
    caseStudies: string
    insights: string
    previousArticles: string
    nextArticles: string
    exploreDesign: string
    seeAllInsights: string
    workflows: string
    workflowsBanner: string
    seeAllWorkflows: string
    topics: string
    resources: string
    seeAllResources: string
    videoPromoKicker: string
    videoPromoHeading: string
    videoPromoBody: string
    videoPromoFrequency: string
  }
  resources: { title: string; lede: string }
  listing: { home: string; articles: string; emptyForTag: string }
}

const en: Dictionary = {
  localeName: 'EN',
  skipToContent: 'Skip to content',
  nav: {
    resources: 'Resources',
    topics: 'Topics',
    subscribe: 'Subscribe',
    viewAll: 'View all',
    menu: 'Site menu',
    closeMenu: 'Close menu',
  },
  footer: {
    tagline: ['Stay curious.', 'Make thoughtful things.'],
    blurb: 'A library of design templates, articles and resources — your creative design ally.',
    social: 'Social',
    explore: 'Explore',
    topics: 'Topics',
    resources: 'Resources',
    rights: 'All rights reserved.',
  },
  cta: {
    eyebrow: 'Newsletter',
    title: 'Get the good stuff, first.',
    lede: 'Design templates, articles and resources — straight to your inbox. No noise.',
    button: 'Subscribe',
    placeholder: 'Enter your email',
    note: 'No spam. Unsubscribe at any time.',
  },
  article: {
    related: 'Related articles',
    onThisPage: 'On this page',
    references: 'References',
    writtenBy: 'Written By',
    minRead: 'min read',
    share: 'Share this article',
    copyLink: 'Copy link',
    copied: 'Link copied',
    shareVia: 'Share',
  },
  home: {
    heading: 'Learn how better brands are built.',
    heroLede: 'Design templates, articles and resources — your creative design ally.',
    topicsLabel: 'Explore creative topics',
    allTopics: 'See all topics',
    recentArticle: 'Recent Article',
    readArticle: 'Read article',
    caseStudies: 'Case Studies',
    insights: 'Insights',
    previousArticles: 'Previous articles',
    nextArticles: 'Next articles',
    exploreDesign: 'DESIGN IS BETTER WHEN IDEAS CONNECT.',
    seeAllInsights: 'See all insights',
    workflows: 'Workflows',
    workflowsBanner: 'Workflow',
    seeAllWorkflows: 'See all Design with AI',
    topics: 'Topics',
    resources: 'Resources',
    seeAllResources: 'See all resources',
    videoPromoKicker: 'Watch · Learn · Try',
    videoPromoHeading: 'Fresh design ideas, made simple.',
    videoPromoBody:
      'Follow Designally for short videos about branding, design, creative tools, AI, and new technology.',
    videoPromoFrequency: 'New videos every week.',
  },
  resources: {
    title: 'Resources',
    lede: 'Free, ready-to-use design templates and files.',
  },
  listing: {
    home: 'Home',
    articles: 'articles',
    emptyForTag: 'No articles with this tag yet.',
  },
}

const th: Dictionary = {
  localeName: 'ไทย',
  skipToContent: 'ข้ามไปยังเนื้อหา',
  nav: {
    resources: 'รีซอร์ส',
    topics: 'หัวข้อ',
    subscribe: 'ติดตาม',
    viewAll: 'ดูทั้งหมด',
    menu: 'เมนู',
    closeMenu: 'ปิดเมนู',
  },
  footer: {
    tagline: ['อยากรู้อยู่เสมอ', 'สร้างสิ่งที่ใส่ใจ'],
    blurb: 'คลังเทมเพลต บทความ และรีซอร์สด้านดีไซน์ — พันธมิตรด้านการออกแบบของคุณ',
    social: 'โซเชียล',
    explore: 'สำรวจ',
    topics: 'หัวข้อ',
    resources: 'รีซอร์ส',
    rights: 'สงวนลิขสิทธิ์',
  },
  cta: {
    eyebrow: 'จดหมายข่าว',
    title: 'รับของดีก่อนใคร',
    lede: 'เทมเพลต บทความ และรีซอร์สด้านดีไซน์ ส่งตรงถึงอีเมลคุณ ไม่มีสแปม',
    button: 'ติดตาม',
    placeholder: 'กรอกอีเมลของคุณ',
    note: 'ไม่มีสแปม ยกเลิกได้ทุกเมื่อ',
  },
  article: {
    related: 'บทความที่เกี่ยวข้อง',
    onThisPage: 'ในหน้านี้',
    references: 'แหล่งอ้างอิง',
    writtenBy: 'เขียนโดย',
    minRead: 'นาทีในการอ่าน',
    share: 'แชร์บทความนี้',
    copyLink: 'คัดลอกลิงก์',
    copied: 'คัดลอกลิงก์แล้ว',
    shareVia: 'แชร์',
  },
  home: {
    heading: 'เรียนรู้วิธีสร้างแบรนด์ที่ดีกว่า',
    heroLede: 'เทมเพลต บทความ และรีซอร์สด้านดีไซน์ — พันธมิตรด้านการออกแบบของคุณ',
    topicsLabel: 'สำรวจหัวข้องานสร้างสรรค์',
    allTopics: 'ดูหัวข้อทั้งหมด',
    recentArticle: 'บทความล่าสุด',
    readArticle: 'อ่านบทความ',
    caseStudies: 'กรณีศึกษา',
    insights: 'อินไซต์',
    previousArticles: 'บทความก่อนหน้า',
    nextArticles: 'บทความถัดไป',
    exploreDesign: 'DESIGN IS BETTER WHEN IDEAS CONNECT.',
    seeAllInsights: 'ดูอินไซต์ทั้งหมด',
    workflows: 'เวิร์กโฟลว์',
    workflowsBanner: 'เวิร์กโฟลว์',
    seeAllWorkflows: 'ดูดีไซน์ด้วย AI ทั้งหมด',
    topics: 'หัวข้อ',
    resources: 'รีซอร์ส',
    seeAllResources: 'ดูรีซอร์สทั้งหมด',
    videoPromoKicker: 'ดู · เรียนรู้ · ลองทำ',
    videoPromoHeading: 'ไอเดียดีไซน์ใหม่ ๆ เข้าใจง่าย',
    videoPromoBody:
      'ติดตาม Designally สำหรับวิดีโอสั้นเกี่ยวกับแบรนดิ้ง การออกแบบ เครื่องมือสร้างสรรค์ AI และเทคโนโลยีใหม่ ๆ',
    videoPromoFrequency: 'วิดีโอใหม่ทุกสัปดาห์',
  },
  resources: {
    title: 'รีซอร์ส',
    lede: 'เทมเพลตและไฟล์ดีไซน์พร้อมใช้งาน ฟรี',
  },
  listing: {
    home: 'หน้าแรก',
    articles: 'บทความ',
    emptyForTag: 'ยังไม่มีบทความในแท็กนี้',
  },
}

const DICTIONARIES: Record<Locale, Dictionary> = { en, th }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? en
}

/* -------------------------------------------------------------------------- */
/* Taxonomy labels                                                             */
/* -------------------------------------------------------------------------- */

/*
 * Thai display labels for the four categories. Tags are intentionally kept in
 * English on Thai pages too — they're design terms (UX/UI, Typography, Figma,
 * Grid Systems…) that Thai designers use in English, matching how the article
 * translator leaves them. Adjust here if Thai tag labels are wanted later.
 */
const CATEGORY_LABELS_TH: Record<string, string> = {
  Design: 'ดีไซน์',
  'New Update': 'อัปเดตใหม่',
  'Creative Things': 'งานสร้างสรรค์',
  'Design with AI': 'ดีไซน์ด้วย AI',
}

/** Localised label for a category (identity in English). */
export function categoryLabel(category: string, locale: Locale): string {
  if (locale === 'en') return category
  return CATEGORY_LABELS_TH[category] ?? category
}

/** Localised label for a tag (kept in English for both locales — see note above). */
export function tagLabel(tag: string, _locale: Locale): string {
  return tag
}
