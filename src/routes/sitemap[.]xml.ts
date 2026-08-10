import { createFileRoute } from '@tanstack/react-router'
import { bsdGet } from '@/lib/bsd.server'
import type { League } from '@/lib/bsd'

const SITE = 'https://oddshub.example.com'

const staticPages = [
  { path: '/', priority: '1.0', freq: 'hourly' },
  { path: '/predictions', priority: '0.9', freq: 'hourly' },
  { path: '/matches', priority: '0.9', freq: 'hourly' },
  { path: '/odds', priority: '0.8', freq: 'hourly' },
  { path: '/leagues', priority: '0.8', freq: 'daily' },
  { path: '/teams', priority: '0.7', freq: 'daily' },
  { path: '/people', priority: '0.4', freq: 'weekly' },
  { path: '/acca', priority: '0.8', freq: 'monthly' },
]

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const urls = staticPages.map(
          (page) =>
            `<url><loc>${SITE}${page.path}</loc><changefreq>${page.freq}</changefreq><priority>${page.priority}</priority></url>`,
        )

        try {
          const leagues = await bsdGet<{ results: League[] }>('/leagues/', { limit: 200 })
          for (const league of leagues.results) {
            urls.push(
              `<url><loc>${SITE}/leagues/${league.id}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`,
            )
          }
        } catch {
          // league URLs are extra; static pages alone are a valid sitemap
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`
        return new Response(xml, {
          headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        })
      },
    },
  },
})
