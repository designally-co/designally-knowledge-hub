'use client'

import { useEffect, useState } from 'react'

/**
 * Share row at the end of an article. Facebook / X / LinkedIn open the
 * platform's web share intent in a popup; "Copy link" writes the URL to the
 * clipboard; the native Share button (rendered only where `navigator.share`
 * exists — i.e. mobile) opens the OS share sheet, which is the only route to
 * Instagram / TikTok / WhatsApp from the web.
 *
 * The URL is read on the client (`window.location`) so it's always the real,
 * absolute page URL without needing the site origin server-side.
 */
export function ArticleShare({
  title,
  labels,
}: {
  title: string
  labels: { heading: string; copyLink: string; copied: string; shareVia: string }
}) {
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  // Decide native-share availability after mount to avoid an SSR/CSR mismatch.
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  const pageUrl = () =>
    typeof window === 'undefined' ? '' : window.location.origin + window.location.pathname

  const openPopup = (href: string) =>
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=540')

  const onFacebook = () =>
    openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl())}`)

  const onX = () =>
    openPopup(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl())}&text=${encodeURIComponent(title)}`,
    )

  const onLinkedIn = () =>
    openPopup(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl())}`)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  const onNativeShare = async () => {
    try {
      await navigator.share({ title, url: pageUrl() })
    } catch {
      /* user dismissed the sheet, or unsupported — no-op */
    }
  }

  return (
    <div className="article-share">
      <p className="article-share__label">{labels.heading}</p>
      <div className="article-share__row">
        <button type="button" className="article-share__btn" aria-label="Facebook" onClick={onFacebook}>
          {ICON_FACEBOOK}
        </button>
        <button type="button" className="article-share__btn" aria-label="X (Twitter)" onClick={onX}>
          {ICON_X}
        </button>
        <button type="button" className="article-share__btn" aria-label="LinkedIn" onClick={onLinkedIn}>
          {ICON_LINKEDIN}
        </button>
        <button
          type="button"
          className="article-share__btn"
          aria-label={copied ? labels.copied : labels.copyLink}
          data-copied={copied || undefined}
          onClick={onCopy}
        >
          {copied ? ICON_CHECK : ICON_LINK}
        </button>
        {canNativeShare && (
          <button type="button" className="article-share__btn" aria-label={labels.shareVia} onClick={onNativeShare}>
            {ICON_SHARE}
          </button>
        )}
      </div>
      <span className="article-share__status" role="status" aria-live="polite">
        {copied ? labels.copied : ''}
      </span>
    </div>
  )
}

/* --- Icons: brand marks are filled (24 grid); utility marks are stroked. --- */

const ICON_FACEBOOK = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

const ICON_X = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const ICON_LINKEDIN = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const ICON_LINK = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const ICON_CHECK = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const ICON_SHARE = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="m16 6-4-4-4 4" />
    <path d="M12 2v13" />
  </svg>
)
