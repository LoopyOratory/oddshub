import { createFileRoute } from '@tanstack/react-router'
import { PublicAccaList, TopAccas } from '@/components/PublicAcca'

export const Route = createFileRoute('/acca/public')({
  head: () => ({
    meta: [{ title: 'Public Accumulators | OddsHub' }],
  }),
  component: PublicAccasPage,
})

function PublicAccasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Public Accumulators</h1>
        <p className="text-muted-foreground">
          Browse and copy accumulators shared by the community
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Recent Accumulators</h2>
          <PublicAccaList limit={20} />
        </div>
        <div>
          <TopAccas period="week" />
        </div>
      </div>
    </div>
  )
}