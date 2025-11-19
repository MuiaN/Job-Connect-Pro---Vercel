import * as React from "react"

import { cn } from "@/lib/utils"
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("modern-card animate-pulse p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-muted/40 rounded w-1/2"></div>
        <div className="h-4 bg-muted/30 rounded w-20" />
      </div>

      <div className="mb-3">
        <div className="h-4 bg-muted/30 rounded w-3/4 mb-2" />
        <div className="h-3 bg-muted/30 rounded w-2/3" />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="h-8 bg-muted/30 rounded w-24" />
        <div className="h-8 bg-muted/30 rounded w-20" />
        <div className="flex-1 h-8 bg-muted/30 rounded" />
      </div>
    </div>
  )
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("h-4 bg-muted/30 rounded", className)} {...props} />
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export default SkeletonCard
