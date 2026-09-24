'use client'

import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'

/**
 * How a file gets from the admin to R2 on the live site — the browser half of
 * DIRECT UPLOADS (lib/storage.ts).
 *
 * Vercel will not carry a request body over 4.5MB, so the file never rides the
 * form's own request. The server hands out a staging key; a file of 4MB or
 * less is sent to it through the Hub's proxy (which needs nothing of the
 * bucket), a larger one straight to R2 with the signed URL. The form is then
 * submitted with the key, and the server does the rest.
 *
 * Whatever is thrown here is what the editor reads: Payload shows the message
 * as the toast for the failed save. So each one says what happened in words
 * that make sense beside a file they just chose.
 */

type Staged = { key: string; url: string; token: string; proxyMaxBytes: number }

async function reason(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown }
    if (typeof body?.error === 'string' && body.error) return body.error
  } catch {
    /* not JSON — the fallback says it */
  }
  return fallback
}

function megabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1)
}

export const MediaUploadHandler = createClientUploadHandler({
  handler: async ({ apiRoute, file, serverHandlerPath, serverURL }) => {
    const api = `${serverURL ?? ''}${apiRoute}`
    const type = file.type || 'application/octet-stream'

    const start = await fetch(`${api}${serverHandlerPath}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, mimeType: type, size: file.size }),
    })
    if (!start.ok) throw new Error(await reason(start, `“${file.name}” could not be uploaded.`))
    const staged = (await start.json()) as Staged

    if (file.size <= staged.proxyMaxBytes) {
      const sent = await fetch(
        `${api}/media-upload-proxy?token=${encodeURIComponent(staged.token)}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': type },
          body: file,
        },
      )
      if (!sent.ok) throw new Error(await reason(sent, `“${file.name}” could not be uploaded.`))
    } else {
      let sent: Response
      try {
        sent = await fetch(staged.url, { method: 'PUT', headers: { 'Content-Type': type }, body: file })
      } catch {
        /* A PUT the browser would not send at all is the storage bucket's CORS
           rule, not the file: nothing else stops a request before it leaves. */
        throw new Error(
          `“${file.name}” is ${megabytes(file.size)} MB. Files over 4 MB go straight to storage, and storage is not accepting uploads from this site yet (its CORS rule is missing).`,
        )
      }
      if (!sent.ok) {
        throw new Error(`Storage refused “${file.name}” (${sent.status}). Try again.`)
      }
    }

    return { key: staged.key }
  },
})
