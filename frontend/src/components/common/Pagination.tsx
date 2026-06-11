import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils'
import { PaginationMeta } from '../../types'

interface PaginationProps {
  pagination: PaginationMeta
  onPageChange: (page: number) => void
}

export default function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, hasPrevPage, hasNextPage } = pagination

  if (totalPages <= 1) return null

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevPage}
        className="p-2 rounded-lg btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>

      {pages[0] > 1 && (
        <>
          <PageBtn page={1} current={page} onClick={onPageChange} />
          {pages[0] > 2 && <span className="text-white/30 text-sm px-1">…</span>}
        </>
      )}

      {pages.map(p => (
        <PageBtn key={p} page={p} current={page} onClick={onPageChange} />
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="text-white/30 text-sm px-1">…</span>}
          <PageBtn page={totalPages} current={page} onClick={onPageChange} />
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        className="p-2 rounded-lg btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

function PageBtn({ page, current, onClick }: { page: number; current: number; onClick: (p: number) => void }) {
  const isActive = page === current
  return (
    <button
      onClick={() => onClick(page)}
      className={cn(
        'w-8 h-8 rounded-lg text-sm font-medium transition-all',
        isActive ? 'text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5',
      )}
      style={isActive ? { background: 'linear-gradient(135deg, #a3ff29, #21d978)' } : {}}
    >
      {page}
    </button>
  )
}