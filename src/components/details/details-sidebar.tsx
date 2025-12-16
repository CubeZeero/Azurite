'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import { getMemo, addComment, deleteComment } from '@/lib/actions/memo'
import { addTagToMemo } from '@/lib/actions/tag'
import { LinkPreview } from '@/components/memo/link-preview'
import { Loader2, Calendar, FileText, Tag as TagIcon, X, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DraggableHeader } from '@/components/layout/draggable-header'
import { Input } from '@/components/ui/input'
import { FilePreview } from '@/components/memo/file-preview'
import { MemoData } from '@/lib/types'
import { TagManager } from '@/components/memo/tag-manager'

export function DetailsSidebar() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const memoId = searchParams.get('memoId')
    const [memo, setMemo] = useState<MemoData | null>(null)
    const [loading, setLoading] = useState(false)

    const [commentContent, setCommentContent] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)

    const refreshMemo = () => {
        if (!memoId) return;
        getMemo(memoId).then((data) => setMemo(data))
    }

    useEffect(() => {
        if (!memoId) {
            setMemo(null)
            return
        }
        setLoading(true)
        getMemo(memoId).then((data) => {
            setMemo(data)
        }).finally(() => setLoading(false))

        // Listen for updates from other components
        const handleMemoUpdate = (e: Event) => {
            const customEvent = e as CustomEvent
            if (customEvent.detail && customEvent.detail.memoId === memoId) {
                refreshMemo()
            }
        }

        window.addEventListener('memo-updated', handleMemoUpdate)
        return () => window.removeEventListener('memo-updated', handleMemoUpdate)
    }, [memoId])

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!commentContent.trim() || !memo) return

        setSubmittingComment(true)
        try {
            await addComment(memo.id, commentContent)
            setCommentContent('')
            refreshMemo()
        } catch (error) {
            console.error(error)
        } finally {
            setSubmittingComment(false)
        }
    }

    if (!memoId) {
        return (
            <div className="w-full border-l bg-background/50 h-full text-muted-foreground flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm shrink-0">
                <div className="bg-muted/50 rounded-full p-4 mb-4">
                    <FileText className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-sm font-medium opacity-70">Select a memo to view details</p>
            </div>
        )
    }

    return (
        <div className="w-full border-l bg-background/80 h-full flex flex-col shrink-0 animate-in slide-in-from-right-10 duration-200 backdrop-blur-md z-20">
            <DraggableHeader className="p-4 border-b h-14 flex items-center justify-between shadow-sm bg-background/50 backdrop-blur">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold">Details</span>
                </div>
                <div className="flex-1" />
                <Link href={pathname} className="no-drag" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><X className="h-4 w-4" /></Button>
                </Link>
            </DraggableHeader>
            <div className="flex-1 p-4 overflow-y-auto min-h-0">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : memo ? (
                    <div className="space-y-6 min-w-0">
                        {/* Meta */}
                        {/* Title */}
                        <h2 className="text-xl font-bold break-words leading-tight">{memo.title || 'Untitled'}</h2>

                        {/* Meta */}
                        <div className="space-y-3 pb-4 border-b">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold tracking-wider">
                                Information
                            </div>
                            <div className="flex items-center gap-2 text-sm text-foreground">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {new Date(memo.createdAt).toLocaleString()}
                            </div>
                        </div>

                        {/* Content Preview */}
                        <div className="space-y-2">
                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Content</div>
                            <div className="p-3 bg-muted/30 rounded-lg text-sm border shadow-sm max-h-60 overflow-y-auto break-all [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>h1]:text-lg [&>h1]:font-bold [&>blockquote]:border-l-2 [&>blockquote]:pl-2 [&>code]:bg-muted [&>code]:px-1 [&>code]:rounded">
                                <ReactMarkdown components={{
                                    a: ({ node, ...props }) => <span className="text-primary underline cursor-pointer" {...props} />
                                }}>
                                    {memo.content}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="space-y-2">
                            <h4 className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center justify-between">
                                Attachments
                                <span className="text-xs font-normal opacity-70">({memo.attachments.length})</span>
                            </h4>
                            {memo.attachments.length === 0 ? (
                                <div className="p-4 border border-dashed rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground italic">No files attached</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {memo.attachments.map(att => (
                                        <FilePreview key={att.id} attachment={att} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        <TagManager memoId={memo.id} tags={memo.tags} onUpdate={refreshMemo} />

                        {/* Comments */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold tracking-wider border-t pt-4">
                                Comments
                            </div>

                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {memo.comments && memo.comments.length > 0 ? memo.comments.map(comment => (
                                    <div key={comment.id} className="text-sm bg-muted/40 p-2 rounded-md group relative">
                                        <div className="flex justify-between items-start">
                                            <div className="text-xs text-muted-foreground mb-1">{new Date(comment.createdAt).toLocaleString()}</div>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Delete comment?')) {
                                                        await deleteComment(comment.id, memo.id)
                                                        refreshMemo()
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <div className="[&>p]:mb-1 [&>p:last-child]:mb-0">
                                            <ReactMarkdown>{comment.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-xs text-muted-foreground italic">No comments</div>
                                )}
                            </div>

                            <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                                <Input
                                    placeholder="Write a comment..."
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    disabled={submittingComment}
                                    className="text-sm"
                                />
                                <div className="flex justify-end">
                                    <Button size="sm" type="submit" disabled={submittingComment || !commentContent.trim()}>
                                        Post
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">Memo not found</div>
                )}
            </div>
        </div>
    )
}
