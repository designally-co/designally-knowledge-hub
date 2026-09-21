import { redirect } from 'next/navigation'

/**
 * A user has no screen of its own.
 *
 * Everything an account holds is decided in the list: the address came from
 * Google and cannot be edited into anything that signs in, the password door is
 * shut, and API access is a switch in the row. The document view was a form of
 * fields that must not be touched, reached by clicking a row — so the route
 * sends you back to the list rather than drawing it.
 *
 * KEPT AS A REDIRECT, NOT REMOVED. The URL exists in bookmarks and in Payload's
 * own links (a "created by" relationship, the account menu); a 404 for an
 * account that plainly exists says the wrong thing.
 */
export function UsersRedirect() {
  redirect('/admin/collections/users')
}
