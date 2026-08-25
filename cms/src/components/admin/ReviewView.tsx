'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

import { readinessFor, hasBlockers, isPublished, type ReadinessIssue } from '@/lib/readiness'

import './ReviewView.css'

/**
 * The Review view — the article as a reader meets it, on its own tab.
 *
 * WHY IT EXISTS. Articles arrive from Content Studio already written,
 * translated and summarised, so a large part of the job is not authoring but
 * deciding: read it, check the Thai, publish. The CMS could not do that at all.
 * There was no preview, no view-on-site link, nothing — checking your work
 * meant copying the slug out of the rail and hand-building a URL, twice, once
 * per language.
 *
 * THE PAGE ITSELF, IN AN IFRAME, NOT A RECONSTRUCTION. The obvious alternative
 * is to import the site's article components and render them here. That still
 * drifts: the real page has a masthead band derived from the category, a cover
 * that overflows its frame to the midline, a table of contents, share and
 * related blocks, and Thai leading rules — and a copy of "most of that" would
 * quietly stop matching the first time the public template changed. Framing the
 * real route cannot drift, because it IS the route. It also gets the locale
 * switch for free: same page, different prefix.
 *
 * The trade-off, stated: the frame shows the SAVED article, not what is typed
 * in the form. That is correct for this screen — Review is read-only by design
 * and never becomes a second place to edit prose — but it does mean the Edit
 * tab is where changes happen and this is where they are checked.
 *
 * A SECOND TAB, NOT THE LANDING VIEW. This was briefly `views.edit.default`.
 * Payload stores `editViewType` as a per-collection preference and restores it,
 * so anyone who opened the editor once kept landing on the editor — a default
 * the framework reassigns is not a default. Living at its own path is honest
 * about that, and it removed the need to re-mount Payload's editor from
 * `DefaultEditView`, which was the one upgrade-fragile thing in the design.
 */

type ArticleShape = {
  id?: string | number
  title?: string | null
  summary?: string | null
  status?: string | null
  tag?: string | null
  slug?: string | null
  coverImage?: unknown
  coverUrl?: string | null
}

type Loaded = {
  article: ArticleShape
  /** `undefined` = the Thai state could not be read; `null`/'' = no Thai. */
  thaiTitle: string | null | undefined
}

type Preview = 'en' | 'th'

export function ReviewView() {
  const { id } = useDocumentInfo()
  const router = useRouter()

  const [loaded, setLoaded] = React.useState<Loaded | null>(null)
  const [failed, setFailed] = React.useState<string>('')
  const [preview, setPreview] = React.useState<Preview>('en')
  const [publishing, setPublishing] = React.useState(false)
  const [publishError, setPublishError] = React.useState('')

  const load = React.useCallback(async () => {
    if (!id) return
    setFailed('')
    try {
      /* Two reads, for the same reason the dashboard makes two: Payload's locale
         fallback is on, so asking for the Thai document returns the ENGLISH
         title when there is no translation. `fallbackLocale=none` is the only
         sentinel that turns that off — `null` is treated as "unspecified" and
         applies the fallback anyway. */
      const [enRes, thRes] = await Promise.all([
        fetch(`/api/articles/${id}?depth=0&locale=en`, { credentials: 'include' }),
        fetch(`/api/articles/${id}?depth=0&locale=th&fallbackLocale=none`, {
          credentials: 'include',
        }),
      ])
      if (!enRes.ok) throw new Error(`Could not read this article (HTTP ${enRes.status}).`)
      const article = (await enRes.json()) as ArticleShape
      let thaiTitle: string | null | undefined = undefined
      if (thRes.ok) {
        const th = (await thRes.json()) as { title?: string | null }
        thaiTitle = th?.title ?? null
      }
      setLoaded({ article, thaiTitle })
    } catch (err) {
      setFailed(err instanceof Error ? err.message : String(err))
    }
  }, [id])

  React.useEffect(() => {
    void load()
  }, [load])

  /* Unreachable in practice — /create has no /review route — but a document
     view with no document should say so rather than render an empty frame. */
  if (!id) {
    return (
      <div className="da-review da-review--message">
        <p className="da-review__message">Save the article first, then review it.</p>
      </div>
    )
  }

  if (failed) {
    return (
      <div className="da-review da-review--message">
        <p className="da-review__message">{failed}</p>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="da-review da-review--message">
        <p className="da-review__message">Loading the article…</p>
      </div>
    )
  }

  const { article, thaiTitle } = loaded
  const issues = readinessFor(article, thaiTitle)
  const blocked = hasBlockers(issues)
  const live = isPublished(article)
  const slug = article.slug?.trim()

  const path = slug ? (preview === 'th' ? `/th/articles/${slug}` : `/articles/${slug}`) : null

  const publish = async () => {
    setPublishing(true)
    setPublishError('')
    try {
      const res = await fetch(`/api/articles/${id}?locale=en`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        errors?: { message: string }[]
        message?: string
      }
      if (!res.ok) {
        throw new Error(json.errors?.[0]?.message || json.message || `HTTP ${res.status}`)
      }
      await load()
      router.refresh()
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : String(err))
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="da-review">
      <div className="da-review__bar">
        <ReadinessStrip issues={issues} live={live} />

        <div className="da-review__controls">
          <div className="da-review__locales" role="group" aria-label="Preview language">
            {(['en', 'th'] as Preview[]).map((code) => (
              <button
                key={code}
                type="button"
                className={`da-review__locale${preview === code ? ' is-on' : ''}`}
                aria-pressed={preview === code}
                onClick={() => setPreview(code)}
              >
                {code === 'en' ? 'English' : 'ไทย'}
              </button>
            ))}
          </div>

          {path && (
            <a className="da-review__open" href={path} target="_blank" rel="noreferrer">
              Open in a new tab
            </a>
          )}
        </div>
      </div>

      {path ? (
        <div className="da-review__frame">
          <iframe
            key={path}
            className="da-review__page"
            src={path}
            title={`${article.title || 'Article'} — ${preview === 'th' ? 'Thai' : 'English'} preview`}
          />
        </div>
      ) : (
        <p className="da-review__message">
          This article has no slug yet, so it has no page to show. Save it once on the Edit tab.
        </p>
      )}

      {/* The decision sits AFTER the article, which is where it is actually
          made. Publishing was previously a select in the rail plus a button
          labelled "Save" — the same word, colour and gesture as fixing a typo,
          for the act of putting something on the public internet. */}
      <div className="da-review__decision">
        {blocked ? (
          <p className="da-review__blocked">
            {issues
              .filter((i) => i.blocking)
              .map((i) => i.label)
              .join(' · ')}{' '}
            — fix this on the Edit tab before publishing.
          </p>
        ) : (
          <>
            <button
              type="button"
              className="btn btn--style-primary da-review__publish"
              onClick={publish}
              disabled={publishing}
            >
              {publishing ? 'Publishing…' : live ? 'Republish' : 'Publish'}
            </button>
            <p className="da-review__destination">
              {live ? (
                <>Live now. Republishing re-saves it at the same address.</>
              ) : (
                <>
                  Goes live at <code>/articles/{slug}</code>, and in Thai at{' '}
                  <code>/th/articles/{slug}</code>.
                </>
              )}
            </p>
          </>
        )}
        {publishError && (
          <p className="da-review__error" role="alert">
            {publishError}
          </p>
        )}
      </div>
    </div>
  )
}

/** What would stop this reaching a reader — the dashboard's rules, for one article. */
function ReadinessStrip({ issues, live }: { issues: ReadinessIssue[]; live: boolean }) {
  if (issues.length === 0) {
    return (
      <p className="da-review__ready">
        {live ? 'Published, and nothing outstanding.' : 'Nothing outstanding.'}
      </p>
    )
  }

  return (
    <ul className="da-review__issues">
      {issues.map((i) => (
        <li
          key={i.key}
          className={`da-review__issue${i.blocking ? ' da-review__issue--blocking' : ''}`}
        >
          {i.label}
        </li>
      ))}
    </ul>
  )
}
