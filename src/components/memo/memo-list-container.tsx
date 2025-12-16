'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CategoryData, MemoData } from '@/lib/types'
import { MemoInput } from './memo-input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PinnedMemos } from './pinned-memos'
import { MemoItem } from './memo-item'
import { saveWorkspaceSetting } from '@/lib/actions/settings'
import { searchMemos } from '@/lib/actions/memo'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, Globe, Folder, ArrowRight } from 'lucide-react'
import { DraggableHeader } from '@/components/layout/draggable-header'

export type MemoWithDetails = MemoData & { category?: CategoryData }

interface MemoListContainerProps {
    category: CategoryData
    initialMemos: MemoWithDetails[]
    initialViewMode?: 'list' | 'grid'
    readOnly?: boolean
}

export function MemoListContainer({ category, initialMemos, initialViewMode = 'list', readOnly = false }: MemoListContainerProps) {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(initialViewMode)
    const [editingIds, setEditingIds] = useState<Set<string>>(new Set())
    const scrollRef = useRef<HTMLDivElement>(null)
    const initialLoadRef = useRef(true)

    // Search State
    const [searchQuery, setSearchQuery] = useState('')
    const [searchScope, setSearchScope] = useState<'current' | 'all'>('current')
    const [searchResults, setSearchResults] = useState<(MemoData & { category?: CategoryData })[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Effect to run global search when query/scope/date changes
    useEffect(() => {
        const runSearch = async () => {
            // If NO query, reset
            if (!searchQuery.trim()) {
                setSearchResults([])
                return
            }

            if (searchScope === 'current') {
                // Client-side filter
                const lower = searchQuery.toLowerCase()
                const filtered = initialMemos.filter(memo => {
                    const matchesContent = !lower ? true : (
                        memo.content.toLowerCase().includes(lower) ||
                        (memo.title && memo.title.toLowerCase().includes(lower)) ||
                        memo.tags.some(t => t.name.toLowerCase().includes(lower)) ||
                        (memo.embeds && memo.embeds.some(e =>
                            (e.title && e.title.toLowerCase().includes(lower)) ||
                            (e.description && e.description.toLowerCase().includes(lower)) ||
                            (e.siteName && e.siteName.toLowerCase().includes(lower))
                        ))
                    )

                    return matchesContent
                })
                setSearchResults(filtered)
            } else {
                // Server-side global search
                setIsSearching(true)
                try {
                    const results = await searchMemos(searchQuery)
                    setSearchResults(results)
                } catch (e) {
                    console.error("Search failed", e)
                } finally {
                    setIsSearching(false)
                }
            }
        }

        // Debounce?
        const timer = setTimeout(runSearch, 300)
        return () => clearTimeout(timer)
    }, [searchQuery, searchScope, initialMemos])

    // Handle Hash Navigation & Highlighting
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash) {
            const id = window.location.hash.substring(1) // remove #
            // Check if it's a memo id
            if (id.startsWith('memo-')) {
                const element = document.getElementById(id)
                if (element) {
                    // Scroll
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })

                    // Highlight
                    element.classList.add('bg-primary/20', 'rounded-lg', 'transition-colors', 'duration-1000')
                    setTimeout(() => {
                        element.classList.remove('bg-primary/20')
                    }, 2000)
                }
            }
        }
    }, [initialMemos, router]) // Run when memos load or route changes? Route change might not trigger this if component logic.
    // Actually nextjs router change might remount or trigger updates. 
    // Basic hash change might need 'useParams' or window listener, but usually initial render is enough for "Go to Channel".


    // Determine what to display
    const isSearchActive = !!searchQuery.trim()
    const displayedMemos = isSearchActive ? searchResults : initialMemos

    const handleViewModeChange = async (mode: 'list' | 'grid') => {
        setViewMode(mode)
        await saveWorkspaceSetting('viewMode', mode)
    }

    // Masonry Layout Logic (Restored)
    const [columns, setColumns] = useState(1)
    useEffect(() => {
        const updateColumns = () => {
            if (window.innerWidth >= 1280) setColumns(3)
            else if (window.innerWidth >= 768) setColumns(2)
            else setColumns(1)
        }
        updateColumns()
        window.addEventListener('resize', updateColumns)
        return () => window.removeEventListener('resize', updateColumns)
    }, [])

    const handleEditChange = (id: string, isEditing: boolean) => {
        setEditingIds(prev => {
            const next = new Set(prev)
            if (isEditing) next.add(id)
            else next.delete(id)
            return next
        })
    }

    // Distribute memos logic... use displayedMemos instead of initialMemos
    const distributedMemos = React.useMemo(() => {
        if (viewMode === 'list') return [displayedMemos] // Single column

        const getEstimatedHeight = (memo: MemoWithDetails) => {
            let height = 100
            height += Math.ceil((memo.content?.length || 0) / 50) * 20
            if (memo.attachments?.length) height += memo.attachments.length * 200
            const urlMatches = memo.content?.match(/(https?:\/\/[^\s]+)/g)
            if (urlMatches) height += urlMatches.length * 300
            return height
        }

        const cols: (MemoData & { category?: CategoryData })[][] = Array.from({ length: columns }, () => [])
        const colHeights = new Array(columns).fill(0)

        displayedMemos.forEach((memo) => {
            let minColIndex = 0
            let minHeight = colHeights[0]
            for (let i = 1; i < columns; i++) {
                if (colHeights[i] < minHeight) {
                    minHeight = colHeights[i]
                    minColIndex = i
                }
            }
            cols[minColIndex].push(memo)
            colHeights[minColIndex] += getEstimatedHeight(memo)
        })

        return cols
    }, [displayedMemos, columns, viewMode])

    // Jump Handler
    const handleJump = (memo: MemoData & { category?: CategoryData }) => {
        if (memo.categoryId === category.id) {
            // Same category, simple scroll logic if element exists
            const element = document.getElementById(`memo-${memo.id}`)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        } else {
            router.push(`/category/${memo.categoryId}#memo-${memo.id}`)
        }
    }

    // Removed misplaced import

    // ...

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
            {/* Header */}
            <DraggableHeader className="h-14 border-b flex items-center justify-between px-4 shrink-0 shadow-sm bg-background/80 backdrop-blur z-10 gap-4">
                <div className="flex items-center gap-2 font-bold text-lg shrink-0">
                    <span className="text-muted-foreground text-2xl">#</span>
                    {category.name}
                </div>

                {/* Search Bar in Header */}
                <div className="flex-1 max-w-md relative flex items-center gap-2 no-drag" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={readOnly ? "Search all memos..." : "Search memos..."}
                            className="pl-9 h-9 bg-background/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Scope Toggle - Hide if readOnly (always global) or if no query */}
                    {searchQuery && !readOnly && (
                        <div className="flex items-center border rounded-md overflow-hidden shrink-0">
                            <button
                                onClick={() => setSearchScope('current')}
                                className={cn("px-2 py-1.5 text-xs font-medium transition-colors flex items-center gap-1", searchScope === 'current' ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                                title="Current Channel"
                            >
                                <Folder className="h-3 w-3" />
                                Current
                            </button>
                            <div className="w-[1px] bg-border h-full" />
                            <button
                                onClick={() => setSearchScope('all')}
                                className={cn("px-2 py-1.5 text-xs font-medium transition-colors flex items-center gap-1", searchScope === 'all' ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                                title="All Channels"
                            >
                                <Globe className="h-3 w-3" />
                                All
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0 no-drag" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <PinnedMemos memos={initialMemos} />
                    <div className="bg-muted/50 p-1 rounded-md flex space-x-1">
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleViewModeChange('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleViewModeChange('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DraggableHeader>

            <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 pb-4">
                    {/* Empty States */}
                    {!isSearchActive && initialMemos.length === 0 && (
                        <div className="text-center text-muted-foreground py-20">
                            <div className="text-lg font-medium mb-2">No memos yet</div>
                            <div className="text-sm">{readOnly ? "Your timeline is empty." : `Be the first to create a memo in #${category.name}!`}</div>
                        </div>
                    )}
                    {isSearchActive && searchResults.length === 0 && !isSearching && (
                        <div className="text-center text-muted-foreground py-20">
                            <div className="text-lg font-medium mb-2">No results found</div>
                            <div className="text-sm">Try a different query</div>
                        </div>
                    )}

                    <div className={cn(
                        "flex gap-4",
                        viewMode === 'list' ? "flex-col" : "flex-row items-start"
                    )}>
                        {distributedMemos.map((colMemos, colIndex) => (
                            <div key={colIndex} className="flex-1 flex flex-col gap-4 min-w-0">
                                {colMemos.map(memo => (
                                    <div key={memo.id} id={`memo-${memo.id}`} className="relative group/memo-wrapper">
                                        {/* Show Channel Badge if readOnly or Global Search */}
                                        {(readOnly || (isSearchActive && searchScope === 'all' && memo.categoryId !== category.id)) && (
                                            <div className="mb-1 flex items-center justify-between px-1">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                                                    <Folder className="h-3 w-3" />
                                                    {memo.category?.name || 'Unknown Channel'}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 gap-1 text-xs"
                                                    onClick={() => router.push(`/category/${memo.categoryId}#memo-${memo.id}`)}
                                                >
                                                    Go to Channel <ArrowRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}

                                        <MemoItem
                                            memo={memo}
                                            viewMode={viewMode}
                                            onEditChange={(isEditing) => handleEditChange(memo.id, isEditing)}
                                            readOnly={readOnly}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area - Hidden if any memo is being edited OR if searching OR if readOnly */}
            {
                editingIds.size === 0 && !isSearchActive && !readOnly && (
                    <div className="p-4 bg-background border-t">
                        <MemoInput
                            categoryId={category.id}
                            onCreated={() => {
                                // Small timeout to allow UI update with new item
                                setTimeout(() => {
                                    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
                                }, 100)
                            }}
                        />
                    </div>
                )
            }
        </div >
    )
}
