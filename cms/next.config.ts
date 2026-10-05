import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  /* The self-contained server the NAS container runs (Dockerfile) — but NEVER
     ON VERCEL. Vercel builds its own output, and `standalone` there fails the
     build at its last step (ENOENT .next/next-server.js.nft.json), which is
     what broke Survey's production deploys the day it was added there. */
  output: process.env.VERCEL ? undefined : 'standalone',
  /* WITHOUT THIS, EVERY ENGLISH PAGE IN THE CONTAINER IS A 500. English is
     served unprefixed by a middleware rewrite to `/en/...`. The standalone
     server listens on 0.0.0.0, and Next compares a rewrite's origin with
     `http://0.0.0.0:3000` while handing the middleware a URL on
     `localhost:3000` — so the rewrite never looks internal, Next proxies it
     back to itself over HTTP, the middleware adds `/en` again, and it loops
     until the request dies. Measured on 16.2.7. This hands the middleware the
     URL Next compares against, so the rewrite stays internal. `next start`
     and Vercel never showed it; both route rewrites differently. */
  skipProxyUrlNormalize: true,
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
