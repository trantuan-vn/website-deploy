import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

const nextConfig: NextConfig = {
  // Emit a standalone server bundle so the production Docker image can run `node server.js`.
  output: 'standalone',
  // The standalone tracer (@vercel/nft) resolves packages using the `default`/`import`
  // export conditions, so it copies `file-type/source/index.js` and `strtok3/lib/core.js`
  // but drops the `node`-condition entries (`file-type/index.js`, `strtok3/lib/index.js`)
  // that Payload actually loads at runtime when serving media. Force-copy them so that
  // `/api/media/file/*` can detect mime types instead of failing with ERR_MODULE_NOT_FOUND.
  outputFileTracingIncludes: {
    '/**': [
      './node_modules/.pnpm/file-type@*/node_modules/file-type/**/*',
      './node_modules/.pnpm/strtok3@*/node_modules/strtok3/**/*',
    ],
  },
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [100],
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
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
  reactStrictMode: true,
  redirects,
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
