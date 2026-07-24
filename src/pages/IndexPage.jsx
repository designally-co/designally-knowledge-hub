import React from "react";
import { useParams } from "react-router-dom";
import { TopicPill, ArticleCard } from "../design-system/index.js";
import { BE_DATA } from "../data.js";
import { useNav } from "../useNav.js";

/* IndexPage — the browse/listing view.

   Adapted: the topic filter becomes a horizontally scrollable, snapping rail
   below 64em. Wrapping eight pills pushed the first card three rows down on a
   phone; a rail keeps the results in the first viewport and reads as a filter
   rather than as navigation.

   Still outstanding (not a responsive issue, so not fixed here): this page
   renders the same twelve items for every topic — see /impeccable harden. */
export function IndexPage() {
  const onNavigate = useNav();
  const params = useParams();
  const topic = params.topic ? decodeURIComponent(params.topic) : "Insights";
  const D = BE_DATA;
  const all = [...D.caseStudies, ...D.insight, ...D.topInspiration];

  return (
    <div className="browse">
      <div className="browse-head">
        <div className="shell">
          <p className="browse-head__kicker">Browsing</p>
          <h1 className="browse-head__title">{topic}</h1>
          <p className="browse-head__blurb">
            Case studies, interviews and practical ideas on {topic.toLowerCase()} — updated
            as we publish.
          </p>
        </div>
      </div>

      <div className="shell browse__body">
        <div className="filter-rail" role="group" aria-label="Filter by topic">
          {D.topics.slice(0, 8).map((t) => (
            <TopicPill
              key={t}
              size="sm"
              active={t === topic}
              onClick={() => onNavigate("index", t)}
            >
              {t}
            </TopicPill>
          ))}
        </div>

        <div className="card-grid card-grid--3">
          {all.slice(0, 12).map((a) => (
            <ArticleCard
              key={a.title}
              title={a.title}
              date={a.date}
              tags={a.tags}
              image={a.image}
              imageTint={a.tint}
              ratio="4 / 3"
              titleSize="md"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("article");
              }}
              href="#"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
