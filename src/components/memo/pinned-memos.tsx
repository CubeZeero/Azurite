import React, { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button'
import { Pin, ArrowDownToLine } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { MemoData } from '@/lib/types'
import { FilePreview } from './file-preview'
import { LinkPreview } from './link-preview'
import { TweetPreview } from './tweet-preview'

function extractUrls(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const matches = text.match(urlRegex)
    if (!matches) return []
    return Array.from(new Set(matches.map(url => url.replace(/[.,;!?)]+$/, ''))))
}

function getTweetId(url: string) {
    const match = url.match(/^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/\w+\/status\/(\d+)/)
    return match ? match[1] : null
}

interface PinnedMemosProps {
    memos: MemoData[]
}

export function PinnedMemos({ memos }: PinnedMemosProps) {
    const [open, setOpen] = useState(false)
    const pinnedMemos = memos.filter(m => m.isPinned)

    const handleJump = (id: string) => {
        setOpen(false)
        // Add a small delay to allow sheet close animation (optional) or just run
        setTimeout(() => {
            const element = document.getElementById(`memo-${id}`)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                element.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
                setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
                }, 2000)
            }
        }, 100)
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <Pin className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Pinned Messages</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col gap-4 px-[5px]">
                    {pinnedMemos.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm italic py-10">
                            No pinned messages in this channel.
                        </div>
                    ) : (
                        pinnedMemos.map(memo => (
                            <div key={memo.id} className="border rounded-lg overflow-hidden flex flex-col">
                                <Link
                                    href={`?memoId=${memo.id}`}
                                    className="block p-3 hover:bg-muted/50 transition-colors text-sm flex-1"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs truncate max-w-[200px]">{memo.title || 'No Title'}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(memo.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground [&>p]:mb-1 mb-2">
                                        <ReactMarkdown components={{
                                            a: ({ node, ...props }) => {
                                                const children = React.Children.toArray(props.children)
                                                const isRawUrl = children.length === 1 && children[0] === props.href
                                                if (isRawUrl) return null
                                                return <span className="text-primary underline" {...props} />
                                            }
                                        }}>{memo.content}</ReactMarkdown>
                                    </div>

                                    {/* Attachments */}
                                    {memo.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-1 mb-2">
                                            {memo.attachments.map(att => (
                                                <div key={att.id} onClick={(e) => e.stopPropagation()}>
                                                    <FilePreview attachment={att} />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* OGP/Tweets */}
                                    {extractUrls(memo.content).length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            {extractUrls(memo.content).map(url => {
                                                const tweetId = getTweetId(url)
                                                if (tweetId) return <TweetPreview key={url} id={tweetId} />
                                                return <div key={url} onClick={e => e.stopPropagation()}><LinkPreview url={url} /></div>
                                            })}
                                        </div>
                                    )}
                                </Link>
                                <div className="p-2 border-t bg-muted/20 flex justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-7 text-xs"
                                        onClick={() => handleJump(memo.id)}
                                    >
                                        <ArrowDownToLine className="h-3.5 w-3.5" />
                                        Jump to Memo
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
