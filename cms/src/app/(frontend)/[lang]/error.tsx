'use client'

import React from 'react'

import { Button } from '@/components/ds'

/**
 * When a page throws.
 *
 * WITHOUT THIS FILE, NEXT SERVES ITS OWN — an unstyled white page with a
 * generic sentence on it, from a different product than the one the visitor
 * was reading a second ago. On a site whose whole argument is that the craft
 * is the evidence, that is the worst possible page to be caught by.
 *
 * IT OFFERS THE RETRY FIRST because most of what can fail here is transient:
 * the database is briefly unreachable, a deploy is mid-flight, a network hiccup
 * between the render and the data. `reset()` re-renders the segment without a
 * full page load, so the common case costs one tap and no lost scroll position.
 *
 * THE DIGEST IS SHOWN, QUIETLY. Next replaces a server error's message with a
 * hash before it reaches the browser — deliberately, so that a stack trace
 * never leaks — and that hash is the only thing connecting what the visitor saw
 * to the line in the logs. Printing it is the difference between "it broke" and
 * a report someone can act on.
 *
 * ENGLISH ONLY, for the same reason as `not-found`: an error boundary renders
 * without route params, so it cannot know which locale failed.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    /* The server logs its own errors; this is the client half, which otherwise
       goes unrecorded. */
    console.error(error)
  }, [error])

  return (
    <section className="notfound__hero">
      <div className="shell notfound__inner">
        <p className="notfound__code">Something went wrong</p>
        <h1 className="notfound__title">This page did not load.</h1>
        <p className="notfound__lede">
          Not something you did. It is usually momentary — trying again is often enough.
        </p>
        <div className="notfound__ways">
          <Button onClick={reset}>Try again</Button>
          <Button href="/" variant="secondary">
            Home
          </Button>
        </div>
        {error.digest ? <p className="notfound__digest">Reference: {error.digest}</p> : null}
      </div>
    </section>
  )
}
