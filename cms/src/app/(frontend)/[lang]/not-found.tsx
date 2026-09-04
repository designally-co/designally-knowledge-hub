import { ArticleCard, Button } from '@/components/ds'
import { getRecentArticles } from '@/lib/resources'
import { DEFAULT_LOCALE, localeHref } from '@/lib/i18n'

/**
 * The page that is not there — which, on this site, is a page like any other.
 *
 * WHY IT IS NOT A SENTENCE ON AN EMPTY SCREEN. The Hub is search-led: most
 * arrivals are cold, deep and from Google, so the most likely visitor here
 * followed a link to an article that has since been renamed or unpublished.
 * They came for something specific and they are one bounce from leaving. A
 * dead end tells them the site is broken; a way onward tells them it is not.
 *
 * So it offers the two doors that answer "then what" — the library, and the
 * homepage — and then the four newest articles, because the person who wanted
 * an article will more often take another one than a navigation menu.
 *
 * ENGLISH ONLY, AND THAT IS A LIMITATION RATHER THAN A DECISION. Next renders
 * `not-found` without route params, so this file cannot know whether the URL
 * that failed was Thai. Every string here comes from the default locale's
 * dictionary; a Thai visitor meeting a dead link gets English copy and Thai
 * articles underneath it, which is the lesser of the two wrongs available.
 */

export default async function NotFound() {
  const articles = await getRecentArticles(4, DEFAULT_LOCALE)

  return (
    <div className="notfound">
      <section className="notfound__hero">
        <div className="shell notfound__inner">
          <p className="notfound__code">404</p>
          <h1 className="notfound__title">This page has moved on.</h1>
          <p className="notfound__lede">
            The link you followed points at something that has been renamed, unpublished, or never
            existed. Nothing you did — the address is simply out of date.
          </p>
          <div className="notfound__ways">
            <Button href={localeHref(DEFAULT_LOCALE, '/resources')}>Browse the library</Button>
            <Button href={localeHref(DEFAULT_LOCALE, '/')} variant="secondary">
              Home
            </Button>
          </div>
        </div>
      </section>

      {articles.length > 0 ? (
        <section className="notfound__recent">
          <div className="shell">
            <h2 className="notfound__recent-title">Lately on the Hub</h2>
            <div className="notfound__grid">
              {articles.map((article) => (
                <ArticleCard
                  key={article.href}
                  date={article.date}
                  href={article.href}
                  image={article.image}
                  tags={article.tags}
                  title={article.title}
                  titleSize="sm"
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
