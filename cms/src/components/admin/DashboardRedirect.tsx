import { redirect } from 'next/navigation'

/**
 * `/admin` is not a screen. It is a door to the articles list.
 *
 * WHAT THIS REPLACES. The dashboard used to open on "What needs you" — a
 * headline counting distinct articles waiting on a decision, over three
 * computed sections: drafts, articles with no Thai, and published articles
 * with no summary. It was removed deliberately, along with the readiness rules
 * that fed it. What is left of that idea is nothing, on purpose: the list is
 * where the work happens, so the CMS opens there and the trip through a landing
 * screen is gone.
 *
 * A SERVER REDIRECT, NOT A CLIENT ONE. Redirecting from a client component
 * means rendering the admin shell, mounting, and then navigating — a visible
 * flash of an empty dashboard on every single entry into the CMS. This runs
 * before anything paints.
 *
 * IT ALSO KEEPS PAYLOAD'S AUTH FLOW INTACT, which a redirect in `next.config`
 * would not. This component is only rendered for a request that already reached
 * the dashboard view, so an unauthenticated visitor still meets Payload's own
 * login screen at `/admin` rather than being bounced to a deep collection URL
 * and rejected from there.
 */
export function DashboardRedirect() {
  redirect('/admin/collections/articles')
}
