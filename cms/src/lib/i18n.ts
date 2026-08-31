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
    about: string
    contact: string
    newsletter: string
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
  resources: {
    title: string
    lede: string
    download: string
    downloads: string
    aboutThis: string
    fileSize: string
    licence: string
    format: string
    backToResources: string
    notFound: string
    /** Heading above the file list. */
    filesHeading: string
    /** Shown when an admin has published a resource with nothing attached. */
    noFiles: string
    /** Sub-line for the empty state. */
    noFilesNote: string
    /** Related row heading. */
    moreLikeThis: string
  }
  about: {
    eyebrow: string
    title: string
    lede: string
    whyLabel: string
    whyStatement: string
    /** Two columns of body copy under the statement. */
    whyBody: [string, string]
    findEyebrow: string
    findTitle: string
    findLede: string
    principlesLabel: string
    /** The heading, broken where the design breaks it. */
    principlesTitle: [string, string]
    /** Four numbered principles. */
    principles: { title: string; body: string }[]
    studioLabel: string
    studioTitle: string
    studioBody: string
    studioLink: string
  }
  contact: {
    eyebrow: string
    title: string
    lede: string
    formLabel: string
    formTitle: string
    formLede: string
    formCaution: string
    social: string
    cardTitle: string
    cardLede: string
    name: string
    namePlaceholder: string
    email: string
    emailPlaceholder: string
    subject: string
    subjectPlaceholder: string
    subjects: string[]
    message: string
    messagePlaceholder: string
    messageHelp: string
    consent: string
    send: string
    /** Shown when the browser has no mail client to hand the message to. */
    sendFallback: string
    whereLabel: string
    whereTitle: string
    phoneLabel: string
    emailRowLabel: string
    lineLabel: string
    addressLabel: string
    mapLink: string
    /** Accessible name for the embedded map. */
    mapTitle: string
  }
  newsletter: {
    eyebrow: string
    title: string
    lede: string
    whyLabel: string
    whyStatement: string
    /** Three reasons, each a problem and the answer to it. */
    reasons: { index: string; label: string; problem: string; title: string; answer: string }[]
  }
  listing: {
    home: string
    articles: string
    /** Unit noun for the resource count. */
    resourceUnit: string
    emptyForTag: string
    all: string
    searchPlaceholder: string
    searchLabel: string
    /** "Showing {from}–{to} of {total} {unit}". */
    showing: string
    /** "No results for “{q}”." */
    noResults: string
    previous: string
    next: string
    /** aria label prefix for a page number, e.g. "Page 3". */
    page: string
    /**
     * Per-category hero intro copy, keyed by category name (Design, Insights,
     * Design with AI). EDITORIAL COPY — fill these in; an empty or missing string
     * hides the hero description line.
     */
    categoryIntro: Partial<Record<string, string>>
    /** Hero intro copy for the Resources listing. Empty hides the line. */
    resourcesIntro: string
  }
  search: {
    title: string
    /** Placeholder + label for the search field. */
    placeholder: string
    label: string
    /** Shown before anything has been searched for. */
    prompt: string
    /** "Nothing found for “{q}”." */
    empty: string
    articles: string
    resources: string
  }
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
    about: 'About',
    contact: 'Contact',
    newsletter: 'Newsletter',
    rights: 'All rights reserved.',
  },
  cta: {
    /* The letter's own name. `.cta__eyebrow` sets it in caps, so it is written
       here as it reads. */
    eyebrow: 'Spec Sheet \u00b7 Newsletter',
    title: 'Better design thinking, twice a month.',
    lede: 'One case study, one practical workflow, and useful ideas about branding, design and AI.',
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
    seeAllWorkflows: 'See all workflows',
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
    download: 'Download',
    downloads: 'Files',
    aboutThis: 'About this resource',
    fileSize: 'Size',
    licence: 'Licence',
    format: 'Format',
    backToResources: 'All resources',
    notFound: 'Resource not found',
    filesHeading: 'In this download',
    noFiles: 'No files attached yet',
    noFilesNote: 'This resource is published but nothing has been uploaded to it. Check back shortly.',
    moreLikeThis: 'More like this',
  },
  about: {
    eyebrow: 'About the Knowledge Hub',
    title: 'The thinking behind the work',
    lede: 'A practical publication about how brands, interfaces, and creative systems are researched, designed, built, and changed.',
    whyLabel: 'Why we exist',
    whyStatement: 'Good design becomes more useful when the process is made visible.',
    whyBody: [
      'The Knowledge Hub looks past the finished image. We share the decisions, questions, tools and working methods that shape the result.',
      'Our aim is simple: help designers, founders and creative teams understand the work clearly — and apply what they learn to real projects.',
    ],
    findEyebrow: 'What you will find',
    findTitle: 'Four ways to learn.',
    findLede: 'Every section has a different purpose, from studying real decisions to using a practical resource today.',
    principlesLabel: 'Editorial principles',
    principlesTitle: ['Clear. Useful.', 'Honest.'],
    principles: [
      {
        title: 'Explain the decisions',
        body: 'We explain how decisions are made, not only how the final work looks.',
      },
      {
        title: 'Make it practical',
        body: 'Each piece should leave readers with an idea, method or resource they can use.',
      },
      {
        title: 'Use real evidence',
        body: 'We separate client work, independent analysis, opinion and sample content clearly.',
      },
      {
        title: 'Stay curious',
        body: 'We explore new tools and ideas without treating every new trend as the answer.',
      },
    ],
    studioLabel: 'A publication by Designally',
    studioTitle: 'Created from inside a working design studio.',
    studioBody:
      'The Knowledge Hub is published by Designally, a Bangkok-based creative agency. The publication gives us a place to share useful knowledge, study the industry, and document what we learn through the work.',
    studioLink: 'Visit Designally',
  },
  contact: {
    eyebrow: 'Contact the Knowledge Hub',
    title: 'Let\u2019s start a conversation.',
    lede: 'Have a question, an idea, or useful work to share? Tell us what is on your mind.',
    formLabel: 'Send a message',
    formTitle: 'What would you like to talk about?',
    formLede:
      'Choose the subject that best matches your message. It helps your enquiry reach the right person.',
    formCaution: 'Please do not send confidential client information through this form.',
    social: 'Social',
    cardTitle: 'Contact details',
    cardLede: 'We read everything that arrives here and reply to what we can, usually within two working days.',
    name: 'Your name',
    namePlaceholder: 'Full name',
    email: 'Email address',
    emailPlaceholder: 'you@company.com',
    subject: 'What is this about?',
    subjectPlaceholder: 'Choose a subject',
    subjects: [
      'A question about an article',
      'Pitch or contribute a piece',
      'Working with Designally',
      'A correction or a problem',
      'Something else',
    ],
    message: 'Your message',
    messagePlaceholder: 'Tell us what you would like to talk about.',
    messageHelp: 'Please include relevant links when they are useful.',
    consent: 'Sending this form opens your email app with the message ready. Nothing is stored here.',
    send: 'Start communication',
    sendFallback: 'Write to clients@designally.co',
    whereLabel: 'Where we are',
    whereTitle: 'Made in Bangkok. Read everywhere.',
    phoneLabel: 'Talk with us',
    emailRowLabel: 'Drop us a line',
    lineLabel: 'Add on LINE',
    addressLabel: 'Address',
    mapLink: 'Open in Google Maps',
    mapTitle: 'Map showing Designally in Chan Kasem, Chatuchak, Bangkok',
  },
  newsletter: {
    eyebrow: 'The Spec Sheet \u00b7 Newsletter',
    title: 'Better design thinking, twice a month.',
    lede: 'One case study, one practical workflow, and three useful ideas about branding, design and AI.',
    whyLabel: 'Why subscribe?',
    whyStatement: 'Because keeping up should not become another full-time job.',
    reasons: [
      {
        index: '01',
        label: 'Too much noise',
        problem:
          'Design news, new tools and trend reports arrive every day. Most of them do not help you make better work.',
        title: 'Notice what is actually useful.',
        answer: 'We select a small number of ideas and explain why each one matters.',
      },
      {
        index: '02',
        label: 'Not enough process',
        problem:
          'Finished projects show the result, but they often hide the questions, decisions and mistakes behind it.',
        title: 'Learn from the work behind the work.',
        answer: 'We make the process visible so you can apply the thinking to your own projects.',
      },
      {
        index: '03',
        label: 'Limited time',
        problem:
          'You want to stay current, but you do not have hours to search for reliable articles, tools and examples.',
        title: 'Get a focused update twice a month.',
        answer: 'One useful email gives you a clear place to start, with no daily inbox pressure.',
      },
    ],
  },
  listing: {
    home: 'Home',
    articles: 'articles',
    resourceUnit: 'resources',
    emptyForTag: 'No articles with this tag yet.',
    all: 'All',
    searchPlaceholder: 'Search {section}…',
    searchLabel: 'Search',
    showing: 'Showing {from}–{to} of {total} {unit}',
    noResults: 'No results for “{q}”.',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    categoryIntro: {
      Design:
        'Honest insight, opinion and analysis on the business of being creative – from industry trends and hot takes to the conversations that matter.',
      Insights:
        'Fresh thinking on where design is heading – from industry shifts and new tools to the campaigns and craft worth a closer look.',
      'Design with AI':
        'Practical ways to design with AI – the workflows, prompts and systems for doing sharper work in less time, without losing the craft.',
    },
    resourcesIntro:
      'Practical templates, guides, tools, and references to help you build better brands. Created and selected by Designally.',
  },
  search: {
    title: 'Search',
    placeholder: 'Search articles and resources…',
    label: 'Search',
    prompt: 'Search across every article and resource on the hub.',
    empty: 'Nothing found for “{q}”.',
    articles: 'Articles',
    resources: 'Resources',
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
    about: 'เกี่ยวกับเรา',
    contact: 'ติดต่อเรา',
    newsletter: 'จดหมายข่าว',
    rights: 'สงวนลิขสิทธิ์',
  },
  cta: {
    eyebrow: 'Spec Sheet \u00b7 จดหมายข่าว',
    title: 'คิดงานออกแบบให้คมขึ้น เดือนละสองครั้ง',
    lede: 'หนึ่งกรณีศึกษา หนึ่งเวิร์กโฟลว์ที่ใช้ได้จริง และไอเดียดี ๆ เรื่องแบรนด์ ดีไซน์ และ AI',
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
    seeAllWorkflows: 'ดูเวิร์กโฟลว์ทั้งหมด',
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
    download: 'ดาวน์โหลด',
    downloads: 'ไฟล์',
    aboutThis: 'เกี่ยวกับรีซอร์สนี้',
    fileSize: 'ขนาด',
    licence: 'สัญญาอนุญาต',
    format: 'รูปแบบไฟล์',
    backToResources: 'รีซอร์สทั้งหมด',
    notFound: 'ไม่พบรีซอร์ส',
    filesHeading: 'ไฟล์ในชุดนี้',
    noFiles: 'ยังไม่มีไฟล์แนบ',
    noFilesNote: 'รีซอร์สนี้เผยแพร่แล้วแต่ยังไม่ได้อัปโหลดไฟล์ กรุณากลับมาตรวจสอบอีกครั้ง',
    moreLikeThis: 'รีซอร์สที่คล้ายกัน',
  },
  about: {
    eyebrow: 'เกี่ยวกับ Knowledge Hub',
    title: 'ความคิดที่อยู่เบื้องหลังงาน',
    lede: 'คลังความรู้เชิงปฏิบัติว่าด้วยการค้นคว้า ออกแบบ สร้าง และปรับเปลี่ยนแบรนด์ อินเทอร์เฟซ และระบบงานสร้างสรรค์',
    whyLabel: 'ทำไมเราถึงมีอยู่',
    whyStatement: 'งานออกแบบที่ดีจะมีประโยชน์มากขึ้น เมื่อกระบวนการถูกทำให้มองเห็นได้',
    whyBody: [
      'Knowledge Hub มองข้ามภาพผลงานที่เสร็จแล้ว เราแบ่งปันการตัดสินใจ คำถาม เครื่องมือ และวิธีทำงานที่หล่อหลอมผลลัพธ์นั้นขึ้นมา',
      'เป้าหมายของเราเรียบง่าย คือช่วยให้นักออกแบบ ผู้ก่อตั้ง และทีมครีเอทีฟเข้าใจงานได้อย่างชัดเจน แล้วนำสิ่งที่ได้เรียนรู้ไปใช้กับงานจริง',
    ],
    findEyebrow: 'สิ่งที่คุณจะได้พบ',
    findTitle: 'สี่เส้นทางของการเรียนรู้',
    findLede: 'แต่ละส่วนมีจุดประสงค์ต่างกัน ตั้งแต่การศึกษาการตัดสินใจจริง ไปจนถึงการหยิบทรัพยากรไปใช้ได้ทันที',
    principlesLabel: 'หลักการทางบรรณาธิการ',
    principlesTitle: ['ชัดเจน มีประโยชน์', 'และตรงไปตรงมา'],
    principles: [
      {
        title: 'อธิบายการตัดสินใจ',
        body: 'เราอธิบายว่าการตัดสินใจเกิดขึ้นอย่างไร ไม่ใช่แค่ว่างานสุดท้ายหน้าตาเป็นอย่างไร',
      },
      {
        title: 'ใช้ได้จริง',
        body: 'ทุกชิ้นควรทิ้งไอเดีย วิธีการ หรือทรัพยากรที่ผู้อ่านนำไปใช้ต่อได้',
      },
      {
        title: 'อ้างอิงจากของจริง',
        body: 'เราแยกงานลูกค้า การวิเคราะห์อิสระ ความเห็น และเนื้อหาตัวอย่างออกจากกันอย่างชัดเจน',
      },
      {
        title: 'อยากรู้อยู่เสมอ',
        body: 'เราสำรวจเครื่องมือและแนวคิดใหม่ โดยไม่ถือว่าทุกเทรนด์ใหม่คือคำตอบ',
      },
    ],
    studioLabel: 'เผยแพร่โดย Designally',
    studioTitle: 'สร้างขึ้นจากภายในสตูดิโอออกแบบที่ทำงานจริง',
    studioBody:
      'Knowledge Hub เผยแพร่โดย Designally เอเจนซีสร้างสรรค์ในกรุงเทพฯ คลังความรู้นี้เป็นพื้นที่ให้เราแบ่งปันความรู้ที่ใช้ได้จริง ศึกษาอุตสาหกรรม และบันทึกสิ่งที่เราเรียนรู้จากการทำงาน',
    studioLink: 'ไปที่ Designally',
  },
  contact: {
    eyebrow: 'ติดต่อ Knowledge Hub',
    title: 'มาเริ่มบทสนทนากัน',
    lede: 'มีคำถาม มีไอเดีย หรือมีงานดี ๆ อยากแบ่งปัน บอกเราได้เลยว่าคุณคิดอะไรอยู่',
    formLabel: 'ส่งข้อความ',
    formTitle: 'คุณอยากคุยเรื่องอะไร',
    formLede: 'เลือกหัวข้อที่ตรงกับเรื่องของคุณมากที่สุด จะช่วยให้เรื่องถึงคนที่ดูแลได้เร็วขึ้น',
    formCaution: 'กรุณาอย่าส่งข้อมูลลับของลูกค้าผ่านแบบฟอร์มนี้',
    social: 'โซเชียล',
    cardTitle: 'รายละเอียดการติดต่อ',
    cardLede: 'เราอ่านทุกข้อความที่ส่งเข้ามา และจะตอบกลับเท่าที่ทำได้ โดยปกติภายในสองวันทำการ',
    name: 'ชื่อของคุณ',
    namePlaceholder: 'ชื่อ-นามสกุล',
    email: 'อีเมล',
    emailPlaceholder: 'you@company.com',
    subject: 'เรื่องอะไร',
    subjectPlaceholder: 'เลือกหัวข้อ',
    subjects: [
      'คำถามเกี่ยวกับบทความ',
      'เสนอหรือร่วมเขียนบทความ',
      'ร่วมงานกับ Designally',
      'แจ้งข้อผิดพลาดหรือปัญหา',
      'เรื่องอื่น ๆ',
    ],
    message: 'ข้อความของคุณ',
    messagePlaceholder: 'เล่าให้เราฟังว่าคุณอยากคุยเรื่องอะไร',
    messageHelp: 'ใส่ลิงก์ที่เกี่ยวข้องมาด้วยได้ ถ้ามี',
    consent: 'การส่งฟอร์มนี้จะเปิดแอปอีเมลของคุณพร้อมข้อความที่เตรียมไว้ เราไม่ได้เก็บข้อมูลไว้ที่นี่',
    send: 'เริ่มการสนทนา',
    sendFallback: 'เขียนถึง clients@designally.co',
    whereLabel: 'เราอยู่ที่ไหน',
    whereTitle: 'สร้างที่กรุงเทพฯ อ่านได้ทุกที่',
    phoneLabel: 'โทรหาเรา',
    emailRowLabel: 'ส่งอีเมล',
    lineLabel: 'เพิ่มเพื่อนใน LINE',
    addressLabel: 'ที่อยู่',
    mapLink: 'เปิดใน Google Maps',
    mapTitle: 'แผนที่แสดงที่ตั้งของ Designally ย่านจันทรเกษม จตุจักร กรุงเทพฯ',
  },
  newsletter: {
    eyebrow: 'The Spec Sheet \u00b7 จดหมายข่าว',
    title: 'คิดงานออกแบบให้คมขึ้น เดือนละสองครั้ง',
    lede: 'หนึ่งกรณีศึกษา หนึ่งเวิร์กโฟลว์ที่ใช้ได้จริง และสามไอเดียดี ๆ เรื่องแบรนด์ ดีไซน์ และ AI',
    whyLabel: 'ทำไมต้องสมัคร',
    whyStatement: 'เพราะการตามให้ทันไม่ควรกลายเป็นงานประจำอีกงานหนึ่ง',
    reasons: [
      {
        index: '01',
        label: 'ข้อมูลล้นเกินไป',
        problem:
          'ข่าวสารด้านดีไซน์ เครื่องมือใหม่ และรายงานเทรนด์มาถึงทุกวัน แต่ส่วนใหญ่ไม่ได้ช่วยให้คุณทำงานได้ดีขึ้น',
        title: 'เห็นว่าอะไรมีประโยชน์จริง',
        answer: 'เราคัดมาไม่กี่เรื่อง และอธิบายว่าทำไมแต่ละเรื่องถึงสำคัญ',
      },
      {
        index: '02',
        label: 'เห็นแต่ผลลัพธ์ ไม่เห็นกระบวนการ',
        problem:
          'งานที่เสร็จแล้วแสดงผลลัพธ์ แต่มักซ่อนคำถาม การตัดสินใจ และความผิดพลาดที่อยู่เบื้องหลังไว้',
        title: 'เรียนรู้จากงานที่อยู่เบื้องหลังงาน',
        answer: 'เราทำให้กระบวนการมองเห็นได้ เพื่อให้คุณนำวิธีคิดไปใช้กับงานของตัวเองได้',
      },
      {
        index: '03',
        label: 'เวลามีจำกัด',
        problem: 'คุณอยากตามให้ทัน แต่ไม่มีเวลาเป็นชั่วโมงไปค้นหาบทความ เครื่องมือ และตัวอย่างที่เชื่อถือได้',
        title: 'รับอัปเดตที่คัดมาแล้ว เดือนละสองครั้ง',
        answer: 'อีเมลฉบับเดียวที่ให้จุดเริ่มต้นชัดเจน โดยไม่ต้องกดดันกับกล่องจดหมายทุกวัน',
      },
    ],
  },
  listing: {
    home: 'หน้าแรก',
    articles: 'บทความ',
    resourceUnit: 'รีซอร์ส',
    emptyForTag: 'ยังไม่มีบทความในแท็กนี้',
    all: 'ทั้งหมด',
    searchPlaceholder: 'ค้นหาใน{section}…',
    searchLabel: 'ค้นหา',
    showing: 'แสดง {from}–{to} จาก {total} {unit}',
    noResults: 'ไม่พบผลลัพธ์สำหรับ “{q}”',
    previous: 'ก่อนหน้า',
    next: 'ถัดไป',
    page: 'หน้า',
    categoryIntro: {
      Design:
        'อินไซต์ ความคิดเห็น และบทวิเคราะห์อย่างตรงไปตรงมาเกี่ยวกับธุรกิจของงานสร้างสรรค์ – ตั้งแต่เทรนด์ในวงการและมุมมองร้อนแรง ไปจนถึงบทสนทนาที่มีความหมาย',
      Insights:
        'มุมมองใหม่ต่อทิศทางของงานออกแบบ – ตั้งแต่ความเปลี่ยนแปลงในวงการและเครื่องมือใหม่ ๆ ไปจนถึงแคมเปญและงานฝีมือที่ควรค่าแก่การพิจารณา',
      'Design with AI':
        'วิธีออกแบบด้วย AI อย่างเป็นรูปธรรม – เวิร์กโฟลว์ พรอมป์ และระบบที่ช่วยให้ทำงานได้คมชัดขึ้นในเวลาที่น้อยลง โดยไม่ละทิ้งงานฝีมือ',
    },
    resourcesIntro:
      'เทมเพลต คู่มือ เครื่องมือ และแหล่งอ้างอิงที่ใช้งานได้จริง เพื่อช่วยให้คุณสร้างแบรนด์ได้ดียิ่งขึ้น สร้างและคัดสรรโดย Designally',
  },
  search: {
    title: 'ค้นหา',
    placeholder: 'ค้นหาบทความและรีซอร์ส…',
    label: 'ค้นหา',
    prompt: 'ค้นหาจากบทความและรีซอร์สทั้งหมดในฮับ',
    empty: 'ไม่พบผลลัพธ์สำหรับ “{q}”',
    articles: 'บทความ',
    resources: 'รีซอร์ส',
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
/*
 * Public display names for the categories. The internal category keys stay
 * 'Design' / 'Insights' / 'Design with AI' (they key the tag taxonomy and the
 * URL slugs), but the site presents friendlier names: Design → Case Studies and
 * Design with AI → Workflows. Insights uses its own name. Change a name here and
 * it updates the header, footer, and category pages in one place.
 */
const CATEGORY_LABELS_EN: Record<string, string> = {
  Design: 'Case Studies',
  'Design with AI': 'Workflows',
  // Insights keeps its own name (identity).
}

const CATEGORY_LABELS_TH: Record<string, string> = {
  Design: 'กรณีศึกษา',
  Insights: 'อินไซต์',
  'Design with AI': 'เวิร์กโฟลว์',
}

/** Public display label for a category, per locale. */
export function categoryLabel(category: string, locale: Locale): string {
  if (locale === 'en') return CATEGORY_LABELS_EN[category] ?? category
  return CATEGORY_LABELS_TH[category] ?? category
}

/** Localised label for a tag (kept in English for both locales — see note above). */
export function tagLabel(tag: string, _locale: Locale): string {
  return tag
}
