import { APIError, type CollectionBeforeChangeHook } from 'payload'

/** Consent is supplied by the public confirmation flow, never by an editor.
 * Token-validated routes use the Local API without an admin user. Collection
 * access denies anonymous REST/GraphQL writes before this hook is reached.
 */
export const protectSubscriberConsent: CollectionBeforeChangeHook = ({ data, operation, originalDoc, req }) => {
  if (operation === 'create') {
    if (data.status && data.status !== 'pending') {
      throw new APIError('New sign-ups must confirm their email first.', 400)
    }
    data.status = 'pending'
    if (typeof data.email === 'string') data.email = data.email.trim().toLowerCase()
  }

  if (
    operation === 'update' &&
    req.user &&
    data.status !== undefined &&
    data.status !== originalDoc?.status &&
    data.status !== 'unsubscribed'
  ) {
    throw new APIError('Only the subscriber can confirm or restart their subscription. You can unsubscribe them here.', 400)
  }

  return data
}
