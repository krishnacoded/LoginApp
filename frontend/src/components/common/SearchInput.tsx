import React, { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../utils'

interface SearchInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  isLoading?: boolean
  className?: string
}

export default function SearchInput({
  value, onChange, placeholder = 'Search...', isLoading, className,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={cn('relative', className)}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9 pr-8"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-lime-400/30 border-t-lime-400 rounded-full animate-spin" />
      )}
      {!isLoading && value && (
        <button
          onClick={() => { onChange(''); inputRef.current?.focus() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}