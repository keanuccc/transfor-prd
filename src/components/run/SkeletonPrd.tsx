import { Skeleton } from '@/components/ui/skeleton'

function SkeletonLine({ width, indent = 0 }: { width: string; indent?: number }) {
  return (
    <div className="flex items-center gap-2 py-0.5" style={{ paddingLeft: indent * 16 }}>
      <Skeleton className="h-3 rounded" style={{ width }} />
    </div>
  )
}

function SkeletonBlock() {
  // Randomize widths slightly via fixed variants to avoid React key warnings
  return (
    <div className="mb-5 space-y-1.5">
      <Skeleton className="mb-2 h-5 w-48 rounded" />
      <SkeletonLine width="92%" />
      <SkeletonLine width="97%" />
      <SkeletonLine width="83%" />
      <SkeletonLine width="89%" />
      <div className="py-0.5" />
      <SkeletonLine width="78%" indent={1} />
      <SkeletonLine width="85%" indent={1} />
      <SkeletonLine width="72%" indent={1} />
    </div>
  )
}

export function SkeletonPrd() {
  return (
    <div className="px-10 py-8">
      <Skeleton className="mb-6 h-8 w-64 rounded" />
      <SkeletonBlock />
      <SkeletonBlock />
      <SkeletonBlock />
      <Skeleton className="mb-2 h-5 w-40 rounded" />
      <SkeletonLine width="91%" />
      <SkeletonLine width="88%" />
      <SkeletonLine width="94%" />
    </div>
  )
}
