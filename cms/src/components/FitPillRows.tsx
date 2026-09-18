'use client'
import React from 'react'

/**
 * A wrapping row of pills held to a number of lines. Every pill is rendered;
 * on the client the ones that would run past the limit are hidden, from the
 * end, until the last child — the "see all" pill — fits on the last line with
 * them. So the count follows the width and the words, not a fixed number.
 *
 * The line limit is CSS's to set, as `--pill-rows` on the element (it changes
 * with the breakpoint). Until the first measure, CSS clips the row to about
 * that height so the page does not jump.
 */
export function FitPillRows({
  className,
  label,
  children,
}: {
  className?: string
  label: string
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const fit = () => {
      const items = Array.from(el.children) as HTMLElement[]
      if (items.length < 2) return
      const max = parseInt(getComputedStyle(el).getPropertyValue('--pill-rows'), 10) || 2
      const rest = items.slice(0, -1)

      items.forEach((it) => it.removeAttribute('data-fit-hidden'))
      el.setAttribute('data-fitted', '')

      const rows = () => {
        const tops = new Set<number>()
        for (const it of items) {
          if (!it.hasAttribute('data-fit-hidden')) tops.add(Math.round(it.offsetTop))
        }
        return tops.size
      }

      // Drop pills from the end until the row, "see all" included, fits.
      for (let i = rest.length - 1; i >= 0 && rows() > max; i--) {
        rest[i].setAttribute('data-fit-hidden', '')
      }
    }

    // Refit on a width change only: hiding pills changes the height, which
    // would otherwise call straight back into fit.
    let width = -1
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width)
      if (w === width) return
      width = w
      fit()
    })
    ro.observe(el)
    // Widths change once the web fonts arrive.
    document.fonts?.ready.then(fit).catch(() => {})
    return () => ro.disconnect()
  }, [])

  return (
    <nav ref={ref} className={className} aria-label={label}>
      {children}
    </nav>
  )
}
