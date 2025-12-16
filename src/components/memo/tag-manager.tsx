
'use client'

import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { addTagToMemo, searchTags } from '@/lib/actions/tag'
import { TagData } from '@/lib/types'

interface TagManagerProps {
    memoId: string
    tags: TagData[]
    onUpdate: () => void
}

export function TagManager({ memoId, tags, onUpdate }: TagManagerProps) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<TagData[]>([])

    // Debounced search for suggestions
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) {
                searchTags(query).then((res) => setSuggestions(res as unknown as TagData[]))
            } else {
                setSuggestions([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = async (tagName: string) => {
        try {
            await addTagToMemo(memoId, tagName)
            onUpdate()
            setOpen(false)
            setQuery('')
            setSuggestions([])
        } catch (e) {
            console.error(e)
        }
    }

    // Filter out tags that are already assigned from suggestions
    const availableSuggestions = suggestions.filter(s => !tags.some(t => t.id === s.id))

    return (
        <div className="space-y-2">
            <h4 className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-2">
                Tags
            </h4>
            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="px-2 py-1 text-xs font-normal">
                        {tag.name}
                    </Badge>
                ))}

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs text-muted-foreground border-dashed rounded-full px-2"
                        >
                            <Plus className="h-3 w-3 mr-1" /> Add Tag
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[200px]" align="start">
                        <Command shouldFilter={false}>
                            <CommandInput placeholder="Search tags..." value={query} onValueChange={setQuery} className="h-8 text-xs" />
                            <CommandList>
                                <CommandEmpty className="py-2 px-2 text-xs text-muted-foreground">
                                    {query ? (
                                        <div
                                            className="px-2 py-1 text-xs cursor-pointer hover:bg-accent rounded-sm flex items-center gap-1"
                                            onClick={() => handleSelect(query)}
                                        >
                                            <Plus className="h-3 w-3" /> Create "{query}"
                                        </div>
                                    ) : (
                                        <span>Type to search...</span>
                                    )}
                                </CommandEmpty>
                                {availableSuggestions.length > 0 && (
                                    <CommandGroup heading="Suggestions">
                                        {availableSuggestions.map(tag => (
                                            <CommandItem
                                                key={tag.id}
                                                value={tag.name}
                                                onSelect={() => handleSelect(tag.name)}
                                                className="text-xs"
                                            >
                                                {tag.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}
