// Sample editorial content for the Branding Explained MVP.
//
// PLACEHOLDER IMAGERY. Every cover below is a hotlinked Unsplash photograph
// standing in for artwork this project does not have yet. They were chosen to
// read as creative-agency content — studios, colour work, sketching, print,
// motion — but none of them depict the agencies or people the headlines name,
// and the headlines themselves are invented. Swap all of it for real assets
// before anything ships publicly.
//
// `ratio` is the cover's own aspect ratio, and each URL is cropped to match.
// The carousel keeps every card the same height and derives its width from
// this, so covers of different shapes sit side by side without letterboxing.
// A CMS should set it from the real asset's dimensions; it falls back to
// 3 / 4 when absent.
//
// `tint` is retained as the paint-in colour behind each image: it shows while
// the photo loads and remains the fallback when a cover is missing.

/** Unsplash delivery: auto-format (webp/avif where supported), cropped to the
    declared ratio. Requested at ~2x the largest CSS size the card reaches. */
const cover = (id, w, h) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;

export const BE_DATA = {
  // Creative-agency articles — the top carousel loops through all 12.
  topInspiration: [
    { title: "Inside Wolff Olins' bet that a brand should behave, not just look", date: "6 July 2026", tags: ["Case Study", "Branding Systems"], tint: "#1f3a63", ratio: "3 / 2", image: cover("photo-1561070791-2526d30994b5", 1200, 800) },
    { title: "How Pentagram keeps 25 independent partners pulling in one direction", date: "2 July 2026", tags: ["Case Study", "Creative Direction"], tint: "#e7ded2", ratio: "16 / 9", image: cover("photo-1519389950473-47ba0277781c", 1280, 720) },
    { title: "DixonBaxi on designing motion systems that make brands feel alive", date: "28 June 2026", tags: ["Case Study", "Motion"], tint: "#7a2417", ratio: "16 / 9", image: cover("photo-1618556450991-2f1af64e8191", 1280, 720) },
    { title: "Koto's remote-first studio and the rise of the distributed agency", date: "24 June 2026", tags: ["Case Study", "Creative Direction"], tint: "#2aa3a0", ratio: "16 / 9", image: cover("photo-1524758631624-e2822e304c36", 1280, 720) },
    { title: "Why Collins turns brand strategy into full-blown spectacle", date: "20 June 2026", tags: ["Case Study", "Creative Direction"], tint: "#6a4a86", ratio: "4 / 3", image: cover("photo-1541701494587-cb58502866ab", 1200, 900) },
    { title: "Mother London still writes the ad the room is afraid to pitch", date: "17 June 2026", tags: ["Case Study", "Campaign Breakdown"], tint: "#a5341c", ratio: "3 / 2", image: cover("photo-1550745165-9bc0b252726f", 1200, 800) },
    { title: "Multistudio's research-led approach to naming and verbal identity", date: "13 June 2026", tags: ["Case Study", "Research"], tint: "#dcd7cd", ratio: "3 / 2", image: cover("photo-1493421419110-74f4e85ba126", 1200, 800) },
    { title: "Instrument builds the digital products other agencies only pitch", date: "9 June 2026", tags: ["Case Study", "UX/UI"], tint: "#243447", ratio: "4 / 3", image: cover("photo-1567443024551-f3e3cc2be870", 1200, 900) },
    { title: "How &Walsh made a solo founder's studio feel like a movement", date: "5 June 2026", tags: ["Case Study", "Branding Systems"], tint: "#c98a3a", ratio: "3 / 4", image: cover("photo-1503602642458-232111445657", 900, 1200) },
    { title: "R/GA's shift from one-off campaigns to always-on brand platforms", date: "1 June 2026", tags: ["Case Study", "Campaign Breakdown"], tint: "#2b6f8c", ratio: "16 / 9", image: cover("photo-1524169358666-79f22534bc6e", 1280, 720) },
    { title: "Base Design on running five cities as a single creative studio", date: "27 May 2026", tags: ["Case Study", "Creative Direction"], tint: "#4f8a3d", ratio: "4 / 3", image: cover("photo-1497215728101-856f4ea42174", 1200, 900) },
    { title: "MadeThought and the quiet luxury of restraint in identity design", date: "22 May 2026", tags: ["Case Study", "Visual Identity"], tint: "#cfc3b0", ratio: "1 / 1", image: cover("photo-1558591710-4b4a1ae0f04d", 1000, 1000) },
  ],
  hero: {
    title: "There's a spirit in everything and Maki Yamaguchi is vividly bringing them to life",
    date: "16 July 2026", tags: ["Creative Review", "Visual Identity"], tint: "#1c2733",
    image: cover("photo-1513364776144-60967b0f800f", 1800, 771),
  },
  caseStudies: [
    { title: "Pedro Nekoi makes surreal, saturated worlds from traffic cones and Tokyo backstreets", date: "17 June 2026", tags: ["Case Study"], tint: "#2b6f8c", image: cover("photo-1620641788421-7a1c342ea42e", 1000, 750) },
    { title: "Granola rebrands around a single, honest idea: eat the whole day well", date: "14 June 2026", tags: ["Brand Launch"], tint: "#a7c34a", image: cover("photo-1572044162444-ad60f128bdea", 1000, 750) },
    { title: "How a museum turned its archive into a living identity system", date: "11 June 2026", tags: ["Case Study"], tint: "#c98a3a", image: cover("photo-1542744173-8e7e53415bb0", 1000, 750) },
    { title: "Why Simon Vergély gets suspicious when things look too perfect", date: "9 June 2026", tags: ["Creative Direction"], tint: "#6a4a86", image: cover("photo-1531403009284-440f080d1e12", 1000, 750) },
  ],
  insight: [
    { title: "Apple's new Sports app shows us exactly what good data visualisation looks like", date: "17 June 2026", tags: ["Design Critique"], tint: "#dcd7cd", ratio: "16 / 10", image: cover("photo-1487014679447-9f8336841d58", 1280, 800) },
    { title: "Pedro Nekoi makes surreal, saturated worlds from traffic cones, vintage magazines and Tokyo backstreets", date: "17 June 2026", tags: ["Creative Review", "Visual Identity"], tint: "#243447", ratio: "16 / 10", image: cover("photo-1626785774573-4b799315345d", 1280, 800) },
    { title: "From train stations to hospital gardens, Lucy Grainge makes art everywhere for everyone", date: "17 June 2026", tags: ["Creative Review", "Visual Identity"], tint: "#4f8a3d", ratio: "4 / 3", image: cover("photo-1454165804606-c3d57bc86b40", 1000, 750) },
    { title: "Christie Jarvis's 3D worlds turn hand-reads and tinged with darkness", date: "15 June 2026", tags: ["Photography"], tint: "#2aa3a0", ratio: "4 / 3", image: cover("photo-1558655146-9f40138edfeb", 1000, 750) },
    { title: "Met Gala 2026: celebrities shine in avant-garde fashion", date: "12 June 2026", tags: ["Photography"], tint: "#a5341c", ratio: "4 / 3", image: cover("photo-1522202176988-66273c2fd55f", 1000, 750) },
  ],
  // Used by the Workflows feature card on the homepage.
  workflow: {
    title: "The act of 'making' is at the heart of APFEL's exhibition graphics for V&A East Museum",
    date: "10 June 2026", tags: ["Design Process"], tint: "#c94a1e", ratio: "16 / 9",
    image: cover("photo-1558618666-fcd25c85cd64", 1280, 720),
  },
  // The article reading view's lead image.
  article: {
    tint: "#1c2733",
    image: cover("photo-1513364776144-60967b0f800f", 1600, 800),
  },
  resources: [
    { title: "The Practical Brand Strategy Starter Kit", date: "12 July 2026", tags: ["Brand Audit", "Design Tools"], color: "var(--be-gold)" },
    { title: "A Simple Checklist for Better Logo Reviews", date: "8 July 2026", tags: ["Design Critique", "Design Tools"], color: "var(--be-cobalt)" },
    { title: "The UX Research Planning Worksheet", date: "24 June 2026", tags: ["UX/UI", "Design Tools"], color: "var(--be-brick)" },
    { title: "24 Free Fonts for Modern Editorial Design", date: "1 July 2026", tags: ["Typography", "Design Tools"], color: "var(--be-green)" },
    { title: "The Rebrand Project Creative Brief", date: "20 June 2026", tags: ["Branding Systems", "Design Tools"], color: "var(--be-rust)" },
    { title: "The AI Image Prompt Building Cheat Sheet", date: "15 June 2026", tags: ["AI Design", "Design Tools"], color: "var(--be-indigo)" },
  ],
  // The full topic taxonomy — every allowed article tag. Drives the "See all
  // topics" grid and the index-page filter row.
  topics: ["Branding Systems", "Visual Identity", "UX/UI", "Design Process", "Grid Systems", "Typography", "Design Psychology", "Case Study", "Design Critique", "Before / After", "Industry Trends", "New Technology", "Marketing Shift", "Consumer Behavior", "Brand Launch", "Product Update", "Design Tools", "Industry Report", "Campaign Breakdown", "Packaging", "Motion", "Creative Direction", "Photography", "Brand Film", "Storytelling", "Creative Review", "AI Workflow", "Strategy + AI", "Research", "Brand Audit", "Productivity", "Automation", "AI Design", "Future of Design"],
  // Curated subset spotlighted as chips in the homepage hero. Independent of
  // `topics` so featured picks can change without reshuffling the taxonomy.
  // Keep to the ~8 broadest, best-populated topics.
  featuredTopics: ["Case Study", "Branding Systems", "Visual Identity", "UX/UI", "Typography", "Motion", "AI Design"],
  nav: ["Case Studies", "Insights", "Workflows", "Resources"],
};
