import { redirect } from 'next/navigation'

/** Subscribers are read in the list; their document route returns there. */
export function SubscribersRedirect() {
  redirect('/admin/collections/subscribers')
}
