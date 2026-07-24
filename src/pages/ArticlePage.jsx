import React from "react";
import { Tag, Icon, ArticleCard, SectionHeading } from "../design-system/index.js";
import { BE_DATA } from "../data.js";
import { useNav } from "../useNav.js";

/* ArticlePage — the reading view.

   Adapted: the measure moved from a fixed 820px (~100ch of 19px body copy) to
   68ch, which holds the 65-75ch reading band at every width. The hero drops
   from a 16:8 letterbox to 4:3 on phones, where a letterbox is a stripe.
   The pull-quote's 3px left stripe is gone — it's the single most
   recognisable AI-UI tell and a craft-floor refusal — replaced by rules above
   and below, which is also what survives a print stylesheet. */
export function ArticlePage() {
  const onNavigate = useNav();
  const D = BE_DATA;

  return (
    <article className="article">
      <div className="shell shell--reading">
        <button className="article__back" type="button" onClick={() => onNavigate("home")}>
          <span className="icon-btn icon-btn--outline icon-btn--sm" aria-hidden="true">
            <Icon name="arrow-left" size={16} />
          </span>
          Back to home
        </button>

        <div className="article__tags">
          <Tag>Inspiration</Tag>
          <Tag>Graphic Design</Tag>
        </div>

        <h1 className="article__title">
          There&rsquo;s a spirit in everything and Maki Yamaguchi is vividly bringing them
          to life
        </h1>

        <div className="article__byline">
          <span className="article__avatar" aria-hidden="true" />
          <p className="article__meta">By Naomi Reeves · 16 July 2026 · 6 min read</p>
        </div>
      </div>

      <div className="shell">
        <img
          className="article__hero"
          style={{ "--card-tint": D.article.tint }}
          src={D.article.image}
          alt=""
          decoding="async"
        />
      </div>

      <div className="shell shell--reading article-body">
        <p>
          Maki Yamaguchi paints the interior lives of ordinary objects — a desk lamp
          mid-thought, a kettle holding its breath. The work is warm, a little uncanny,
          and entirely sincere.
        </p>
        <p>
          We spoke to Yamaguchi about animism as a design tool, why restraint reads as
          confidence, and how a personal illustration practice quietly reshaped an entire
          brand system.
        </p>

        <figure className="article-figure">
          <blockquote className="article-figure__quote">
            &ldquo;If you treat every object as if it has a spirit, you stop designing at
            things and start designing with them.&rdquo;
          </blockquote>
        </figure>

        <p>
          That principle runs through the identity work: soft grotesque type, a warm paper
          palette, and spot colours borrowed straight from the illustrations rather than a
          brand deck.
        </p>
      </div>

      <div className="shell article__related">
        <SectionHeading
          action="arrow"
          onArrow={() => onNavigate("index", "Insights")}
          className="grid-head"
        >
          More like this
        </SectionHeading>
        <div className="card-grid card-grid--4">
          {D.caseStudies.map((a) => (
            <ArticleCard
              key={a.title}
              title={a.title}
              date={a.date}
              tags={a.tags}
              image={a.image}
              imageTint={a.tint}
              ratio="4 / 3"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("article");
              }}
              href="#"
            />
          ))}
        </div>
      </div>
    </article>
  );
}
