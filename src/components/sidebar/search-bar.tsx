'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface SearchBarProps {
    value?: string
    onChange?: (val: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search channels..."
                className="pl-9 h-9 bg-background/50"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
            />
        </div>
    )
}
