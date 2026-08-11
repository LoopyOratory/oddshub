import { SearchBar } from '@/components/SearchBar'
import React from 'react'
import {
  HeadContent,
  Scripts,
  createRootRoute,
  Link,
  Outlet,
  useRouter,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { zodValidator } from '@tanstack/zod-adapter'
import { retainSearchParams } from '@tanstack/react-router'
import { rootSearchSchema } from '@/lib/acca'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@/components/tanstack-devtools'
import { AccaWidget } from '@/components/AccaWidget'
import { Button } from '@/components/ui/button'
import appCss from '../styles.css?url'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/predictions', label: 'Predictions' },
  { to: '/matches', label: 'Fixtures' },
  { to: '/leagues', label: 'Leagues' },
  { to: '/acca', label: 'Acca' },
] as const


const SITE_URL = 'https://oddshub.example.com'
const SITE_NAME = 'OddsHub'
const SITE_TITLE = 'OddsHub — Football Predictions, Live Odds & Analysis'
const SITE_DESCRIPTION =
  'Free football predictions and tips with model confidence, live decimal odds comparison across 80+ bookmakers, scoreline probability heatmaps, xG analysis and an acca calculator.'

export { SITE_DESCRIPTION }

export const Route = createRootRoute({
  validateSearch: zodValidator(rootSearchSchema),
  search: {
    middlewares: [retainSearchParams(['acca'])],
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: SITE_TITLE },
      { name: 'description', content: SITE_DESCRIPTION },
      { name: 'theme-color', content: '#0d1210' },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: SITE_TITLE },
      { name: 'twitter:description', content: SITE_DESCRIPTION },
      { name: 'twitter:site', content: '@oddshub' },
      { name: 'keywords', content: 'football predictions, sports betting, odds comparison, acca builder, live scores, xG analysis' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'canonical', href: SITE_URL },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
          description: SITE_DESCRIPTION,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/matches?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }),
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  const router = useRouter()
  const { queryClient } = router.options.context as { queryClient: QueryClient }
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background min-h-screen font-sans text-foreground antialiased">
        <QueryClientProvider client={queryClient}>
          <header className="glass-header sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
              {/* Logo */}
              <Link to="/" className="shrink-0 font-heading text-lg font-bold">
                <span className="text-emerald-400">Odds</span>
                <span className="text-white">Hub</span>
              </Link>

              {/* Search bar - center on desktop */}
              <div className="hidden flex-1 justify-center md:flex">
                <SearchBar />
              </div>

              {/* Nav links - right side */}
              <nav className="hidden shrink-0 gap-1 md:flex">
                {navItems.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    activeOptions={{ exact: to === '/' }}
                    activeProps={{ className: 'bg-emerald-500/15 text-emerald-400' }}
                    className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                ))}
              </nav>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden ml-auto"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              </Button>
            </div>

            {/* Mobile search + nav */}
            {mobileOpen && (
              <div className="border-t md:hidden">
                <div className="p-3">
                  <SearchBar />
                </div>
                <nav className="border-t px-4 py-2">
                  {navItems.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      activeOptions={{ exact: to === '/' }}
                      activeProps={{ className: 'bg-emerald-500/15 text-emerald-400' }}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6">
            <Outlet />
          </main>
          <TanStackDevtools position="bottom-right">
            <TanStackRouterDevtoolsPanel router={router} />
          </TanStackDevtools>
        </QueryClientProvider>
        <AccaWidget />
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <h1 className="font-heading text-6xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found</p>
      <Link to="/" className="mt-6 text-sm text-primary hover:underline">Back to Home</Link>
    </div>
  )
}