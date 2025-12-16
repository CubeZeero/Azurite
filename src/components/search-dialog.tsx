'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { searchMemos } from '@/lib/actions/memo'
import { MemoData, TagData, CategoryData } from '@/lib/types'
import { FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SearchResult = MemoData & { category: CategoryData }

export function SearchDialog() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const router = useRouter()

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) {
                searchMemos(query).then(data => setResults(data as SearchResult[]))
            } else {
                setResults([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (memoId: string, categoryId: string) => {
        setOpen(false)
        router.push(`/category/${categoryId}?memoId=${memoId}`)
    }

    return (
        <>
            <Button
                variant="outline"
                className="w-full relative justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-full"
                onClick={() => setOpen(true)}
            >
                <Search className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline-flex">Search...</span>
                <span className="inline-flex lg:hidden">Search</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
                <CommandInput placeholder="Search memos..." value={query} onValueChange={setQuery} />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    {results.length > 0 && (
                        <CommandGroup heading="Memos">
                            {results.map(memo => (
                                <CommandItem
                                    key={memo.id}
                                    value={`${memo.content} ${memo.tags.map(t => t.name).join(' ')} ${memo.embeds?.map(e => `${e.title || ''} ${e.description || ''} ${e.siteName || ''}`).join(' ') || ''}`}
                                    onSelect={() => handleSelect(memo.id, memo.category.id)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="truncate">{memo.content}</span>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span>#{memo.category.name}</span>
                                            {memo.tags.length > 0 && (
                                                <span>• {memo.tags.map(t => `#${t.name}`).join(' ')}</span>
                                            )}
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}
