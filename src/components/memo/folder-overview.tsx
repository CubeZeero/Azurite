"use client"

import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Hash, Folder, FileText, Clock } from 'lucide-react'
import { CategoryData, MemoData } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface FolderOverviewProps {
    currentCategory: CategoryData
    subCategories: (CategoryData & { latestMemo: MemoData | null })[]
}

export function FolderOverview({ currentCategory, subCategories }: FolderOverviewProps) {
    if (subCategories.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/20 h-full">
                <div className="max-w-md space-y-4">
                    <Folder className="h-12 w-12 mx-auto opacity-50" />
                    <h2 className="text-xl font-bold">Empty Folder</h2>
                    <p className="text-sm">
                        This folder has no channels. Create a channel inside it to get started.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
            {/* Header */}
            <div className="h-14 border-b flex items-center px-4 shrink-0 shadow-sm bg-background/80 backdrop-blur z-10 gap-2">
                <Folder className="h-5 w-5 text-muted-foreground" />
                <span className="font-bold text-lg">{currentCategory.name}</span>
                <span className="text-muted-foreground text-sm ml-2">({subCategories.length} channels)</span>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subCategories.map((cat) => (
                        <Link key={cat.id} href={`/category/${cat.id}`} className="block group">
                            <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 group-hover:-translate-y-0.5">
                                <CardHeader className="pb-2 space-y-0 relative">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            {cat.icon === 'folder' ? <Folder className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                                            <span className="truncate">{cat.name}</span>
                                        </CardTitle>
                                        {cat.latestMemo && (
                                            <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(cat.latestMemo.createdAt), { addSuffix: true })}
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {cat.latestMemo ? (
                                        <div className="text-sm text-muted-foreground line-clamp-3 break-words text-left">
                                            {cat.latestMemo.content || (
                                                <span className="italic opacity-70">
                                                    {cat.latestMemo.attachments?.length ? `${cat.latestMemo.attachments.length} attachment(s)` : 'No text content'}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground/50 italic flex items-center gap-2 h-[4.5rem]">
                                            <FileText className="h-4 w-4" />
                                            No memos yet
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
