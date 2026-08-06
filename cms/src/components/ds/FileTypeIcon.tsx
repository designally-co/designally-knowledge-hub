import React from 'react'

/* FileTypeIcon — a flat, two-colour tile identifying what a file is.

   Drawn rather than borrowed from an icon set: the line icons that were here
   read as UI chrome next to the folder artwork, where these carry the same
   language as the section marks in /public/section-icons — a pale tile in the
   type's colour with a solid glyph sitting on it.

   The type comes from the FILENAME EXTENSION, never the resource's `format`
   field: that field is editor-entered and has already been seen to disagree
   with what was uploaded (a .svg filed as "AI"). The extension is the file. */

type FileKind = 'text' | 'image' | 'font' | 'archive' | 'design' | 'generic'

const KINDS: Record<FileKind, { tint: string; ink: string }> = {
  text: { tint: '#F8E7E4', ink: '#B23127' },
  image: { tint: '#E2F3E8', ink: '#2E9E54' },
  font: { tint: '#EFE5F7', ink: '#7B3FB0' },
  archive: { tint: '#FAEFD8', ink: '#B8860D' },
  design: { tint: '#E4EAF7', ink: '#2C5FB3' },
  generic: { tint: '#EDEAE6', ink: '#6B655C' },
}

const BY_EXT: Record<string, FileKind> = {}
const assign = (kind: FileKind, exts: string[]) => exts.forEach((e) => (BY_EXT[e] = kind))
assign('text', ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'epub', 'pages'])
assign('image', ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif', 'tif', 'tiff', 'heic'])
assign('font', ['otf', 'ttf', 'woff', 'woff2', 'eot'])
assign('archive', ['zip', 'rar', '7z', 'tar', 'gz'])
assign('design', ['fig', 'sketch', 'ai', 'psd', 'xd', 'indd', 'afdesign'])

export function fileKindFor(filename: string): FileKind {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return BY_EXT[ext] ?? 'generic'
}

/** A page with a turned corner — the base shape for the document-ish kinds. */
function Page({ ink }: { ink: string }) {
  return (
    <>
      <path d="M8 5.5h5.2L17 9.3V18a1.2 1.2 0 0 1-1.2 1.2H8A1.2 1.2 0 0 1 6.8 18V6.7A1.2 1.2 0 0 1 8 5.5z" fill={ink} />
      <path d="M13.2 5.5 17 9.3h-2.6a1.2 1.2 0 0 1-1.2-1.2V5.5z" fill="#fff" fillOpacity="0.45" />
    </>
  )
}

export function FileTypeIcon({ filename, size = 30 }: { filename: string; size?: number }) {
  const kind = fileKindFor(filename)
  const { tint, ink } = KINDS[kind]

  return (
    <svg
      className="filetype"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="24" height="24" rx="7" fill={tint} />

      {kind === 'text' && (
        <>
          <Page ink={ink} />
          <rect x="8.8" y="12" width="6.4" height="1.5" rx="0.75" fill="#fff" />
          <rect x="8.8" y="15" width="4.2" height="1.5" rx="0.75" fill="#fff" />
        </>
      )}

      {kind === 'image' && (
        <>
          <rect x="5.6" y="7" width="12.8" height="10" rx="2.2" fill={ink} />
          <circle cx="9.4" cy="10.5" r="1.35" fill="#fff" />
          <path
            d="M5.6 15.1l3.1-3.1 2.5 2.5 2.4-2.4 4.8 4.8v.1a2.2 2.2 0 0 1-2.2 2H7.8a2.2 2.2 0 0 1-2.2-2z"
            fill="#fff"
            fillOpacity="0.8"
          />
        </>
      )}

      {kind === 'font' && (
        /* A letterform says "typeface" faster than a page with an A on it. */
        <path
          d="M12 5.4 17.1 18.6h-2.6l-1.05-2.9H8.55L7.5 18.6H4.9L10 5.4h2zm-1 3.9-1.6 4.4h3.2L11 9.3z"
          fill={ink}
        />
      )}

      {kind === 'archive' && (
        <>
          <rect x="5.8" y="6.6" width="12.4" height="10.8" rx="2.2" fill={ink} />
          <rect x="11.1" y="6.6" width="1.8" height="4.6" fill="#fff" fillOpacity="0.9" />
          <rect x="10.7" y="11.6" width="2.6" height="3.4" rx="0.9" fill="#fff" />
        </>
      )}

      {kind === 'design' && (
        <>
          <circle cx="9.2" cy="9.4" r="3.3" fill={ink} />
          <path d="M15.4 5.6l3.1 5.4h-6.2z" fill={ink} fillOpacity="0.75" />
          <rect x="12.4" y="12.8" width="6" height="6" rx="1.4" fill={ink} fillOpacity="0.9" />
        </>
      )}

      {kind === 'generic' && <Page ink={ink} />}
    </svg>
  )
}
