'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MemoData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MoreHorizontal, Trash, Pin, Pencil, Paperclip, X, File as FileIcon, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { FilePreview } from './file-preview'
import { LinkPreview } from './link-preview'
import { TweetPreview } from './tweet-preview'
import { MarkdownInput } from './markdown-input'
import { deleteMemo, updateMemo, deleteAttachment } from '@/lib/actions/memo'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu"

// Define compatible type locally or import if needed, but MemoData is enough here
// export type MemoWithDetails = MemoData

interface MemoItemProps {
    memo: MemoData
    viewMode: 'list' | 'grid'
    onEditChange: (isEditing: boolean) => void
    readOnly?: boolean
}

import { YoutubePreview } from './youtube-preview'

function extractUrls(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const matches = text.match(urlRegex)
    if (!matches) return []
    return matches.map(url => url.replace(/[.,;!?)]+$/, ''))
}

function getTweetId(url: string) {
    const match = url.match(/^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/\w+\/status\/(\d+)/)
    return match ? match[1] : null
}

function getYoutubeId(url: string) {
    // Covers youtube.com/watch?v=, m.youtube.com/watch?v=, youtu.be/
    const match = url.match(/^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)
    return match ? match[1] : null
}

export function MemoItem({ memo, viewMode, onEditChange, readOnly = false }: MemoItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(memo.content || '')
    const [editTitle, setEditTitle] = useState(memo.title || '')
    const [saving, setSaving] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Ensure safe access for render
    const safeContent = memo.content || ''
    const safeAttachments = memo.attachments || []

    useEffect(() => {
        onEditChange(isEditing)
        return () => onEditChange(false)
    }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleUpdate = async () => {
        if (!editContent.trim() && !editTitle.trim() && files.length === 0 && memo.attachments.length === 0) return
        setSaving(true)
        try {
            if (files.length > 0) {
                await updateMemo(memo.id, { content: editContent, title: editTitle }, files)
            } else {
                await updateMemo(memo.id, { content: editContent, title: editTitle })
            }

            // Dispatch event to notify listeners (e.g. DetailsSidebar)
            const event = new CustomEvent('memo-updated', { detail: { memoId: memo.id } })
            window.dispatchEvent(event)

            setIsEditing(false)
            setFiles([])
        } finally {
            setSaving(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.isComposing) return
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleUpdate()
        }
        if (e.key === 'Escape') {
            setIsEditing(false)
            setFiles([])
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const removeNewFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index))
    }

    const handleDelete = async (e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        if (confirm('Delete this memo?')) {
            await deleteMemo(memo.id)
        }
    }

    const handleDeleteAttachment = async (attId: string) => {
        if (confirm('Delete this attachment?')) {
            await deleteAttachment(attId)
        }
    }

    const handlePin = async (e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        await updateMemo(memo.id, { isPinned: !memo.isPinned })
    }

    // Common menu items for ContextMenu and Dropdown
    const MenuItems = () => (
        <>
            <ContextMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handlePin()}>
                <Pin className={cn("mr-2 h-4 w-4", memo.isPinned && "fill-current")} />
                {memo.isPinned ? "Unpin" : "Pin"}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={(e) => handleDelete()} className="text-red-500 focus:text-red-500">
                <Trash className="mr-2 h-4 w-4" /> Delete
            </ContextMenuItem>
        </>
    )

    if (isEditing) {
        return (
            <div className="p-4 border rounded-lg bg-card shadow-sm space-y-4">
                {/* Title Input */}
                <Input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Title (Optional)"
                    className="font-bold border-none px-0 focus-visible:ring-0 text-lg"
                    onKeyDown={handleKeyDown}
                />

                {/* Live Preview Editor */}
                <div className="flex flex-col gap-2 min-h-[100px]">
                    <MarkdownInput
                        value={editContent}
                        onChange={setEditContent}
                        onKeyDown={handleKeyDown}
                        placeholder="Memo content..."
                        className="w-full border rounded-md"
                        autoFocus
                    />
                </div>

                {/* Existing Attachments */}
                {memo.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {memo.attachments.map(att => {
                            const isMedia = att.type.startsWith('audio/') || att.type.startsWith('video/') || /\.(mp4|webm|ogg|mp3|wav|m4a)$/i.test(att.name)
                            return (
                                <div key={att.id} className={cn("relative group/att", isMedia && "w-full")}>
                                    <FilePreview attachment={att} />
                                    <button
                                        onClick={() => handleDeleteAttachment(att.id)}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover/att:opacity-100 transition-opacity hover:bg-destructive/90 shadow-sm z-10"
                                        title="Delete attachment"
                                        type="button"
                                    >
                                        <Trash className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}

                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 border-t pt-2 border-dashed">
                        {files.map((file, i) => {
                            const isMedia = file.type.startsWith('audio/') || file.type.startsWith('video/') || /\.(mp4|webm|ogg|mp3|wav|m4a)$/i.test(file.name)
                            return (
                                <div key={i} className={cn("relative group/new-file", isMedia && "w-full")}>
                                    <div className={cn("flex items-center gap-2 bg-muted rounded-md px-2 py-1.5 text-xs text-muted-foreground border", isMedia && "w-full")}>
                                        {file.type.startsWith('image/') ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                className="h-8 w-8 object-cover rounded shadow-sm"
                                            />
                                        ) : file.type.startsWith('video/') ? (
                                            <div className="h-8 w-8 bg-black/10 flex items-center justify-center rounded shadow-sm text-foreground">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-film"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" /></svg>
                                            </div>
                                        ) : file.type.startsWith('audio/') ? (
                                            <div className="h-8 w-8 bg-primary/10 flex items-center justify-center rounded shadow-sm text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-music"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                                            </div>
                                        ) : (
                                            <FileIcon className="h-4 w-4" />
                                        )}
                                        <span className={cn("truncate", !isMedia && "max-w-[100px]")}>{file.name}</span>
                                    </div>
                                    <button
                                        onClick={() => removeNewFile(i)}
                                        className="absolute -top-2 -right-2 bg-muted-foreground/80 text-background rounded-full p-0.5 opacity-0 group-hover/new-file:opacity-100 transition-opacity shadow-sm z-10 hover:bg-muted-foreground"
                                        title="Remove file"
                                        type="button"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}

                <div className="flex justify-between gap-2 mt-2">
                    <div className="flex items-center">
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-8 gap-2 text-xs"
                        >
                            <Paperclip className="h-3.5 w-3.5" />
                            Add File
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setFiles([]); }}>Cancel</Button>
                        <Button size="sm" onClick={handleUpdate} disabled={saving}>Save</Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <Link
                    id={`memo-${memo.id}`}
                    href={`?memoId=${memo.id}`}
                    scroll={false}
                    onClick={(e) => {
                        // Prevent scroll jump
                    }}
                    className={cn(
                        "block p-4 border rounded-lg shadow-sm bg-card hover:border-sidebar-ring/50 transition-colors cursor-pointer group relative",
                        viewMode === 'list' && "w-full",
                        memo.isPinned && "border-primary/50 bg-primary/5"
                    )}
                >
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 overflow-hidden">
                                {memo.isPinned && <Pin className="h-3 w-3 rotate-45 text-primary shrink-0" />}
                                {memo.title && <span className="font-bold text-base truncate">{memo.title}</span>}
                                {memo.title && <span className="text-muted-foreground mx-1">•</span>}
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    {new Date(memo.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="font-sans text-sm leading-relaxed text-foreground [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>h1]:text-lg [&>h1]:font-bold [&>h2]:text-base [&>h2]:font-bold [&>blockquote]:border-l-2 [&>blockquote]:pl-2 [&>blockquote]:italic [&>code]:bg-muted [&>code]:rounded [&>code]:px-1 allow-select">
                            <ReactMarkdown
                                remarkPlugins={[remarkBreaks, remarkGfm]}
                                components={{
                                    a: ({ node, ...props }) => {
                                        const children = React.Children.toArray(props.children)
                                        const isRawUrl = children.length === 1 && children[0] === props.href
                                        if (isRawUrl) return null

                                        return <span className="text-primary underline cursor-pointer" onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            window.open(props.href, '_blank')
                                        }}>{props.children}</span>
                                    },
                                    // Code (Inline and Block)
                                    code: ({ node, className, children, ...props }: any) => {
                                        const match = /language-(\w+)/.exec(className || '')
                                        const isBlock = !!match || String(children).includes('\n')
                                        return isBlock ? (
                                            <pre className="bg-muted p-2 rounded-md overflow-x-auto my-2 text-xs font-mono">
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            </pre>
                                        ) : (
                                            <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                                                {children}
                                            </code>
                                        )
                                    },
                                    pre: ({ children }) => <>{children}</>, // Let code handle the block
                                    // Tables
                                    table: ({ node, ...props }) => (
                                        <div className="my-2 w-full overflow-x-auto">
                                            <table className="w-full border-collapse border border-border text-sm" {...props} />
                                        </div>
                                    ),
                                    th: ({ node, ...props }) => <th className="border border-border bg-muted/50 p-2 font-bold text-left" {...props} />,
                                    td: ({ node, ...props }) => <td className="border border-border p-2" {...props} />,
                                    // Lists & Task Lists
                                    ul: ({ node, ...props }) => <ul className={cn("pl-4 list-disc my-2", props.className)} {...props} />,
                                    ol: ({ node, ...props }) => <ol className="pl-4 list-decimal my-2" {...props} />,
                                    li: ({ node, children, ...props }) => {
                                        // Check if it's a task list item
                                        const isTask = props.className?.includes('task-list-item')
                                        const line = node?.position?.start.line

                                        if (isTask && line) {
                                            // Helper to recursively find and attach handler to checkbox
                                            const attachHandler = (nodes: React.ReactNode): React.ReactNode => {
                                                return React.Children.map(nodes, (child) => {
                                                    if (!React.isValidElement(child)) return child

                                                    const element = child as React.ReactElement<any>

                                                    // content of components.input is <input ... />
                                                    if (element.props.type === 'checkbox') {
                                                        return React.cloneElement(element, {
                                                            onChange: async () => {
                                                                if (readOnly) return
                                                                const lines = memo.content.split('\n')
                                                                const targetLineIndex = line - 1
                                                                if (targetLineIndex >= 0 && targetLineIndex < lines.length) {
                                                                    const targetLine = lines[targetLineIndex]
                                                                    // Toggle [ ] <-> [x]
                                                                    const newLine = targetLine.replace(/(\[[ xX]?\])/, (match) => {
                                                                        return match.includes('x') || match.includes('X') ? '[ ]' : '[x]'
                                                                    })

                                                                    if (newLine !== targetLine) {
                                                                        lines[targetLineIndex] = newLine
                                                                        const newContent = lines.join('\n')
                                                                        await updateMemo(memo.id, { content: newContent })
                                                                    }
                                                                }
                                                            },
                                                            disabled: readOnly,
                                                            className: cn(element.props.className, "cursor-pointer")
                                                        })
                                                    }

                                                    if (element.props.children) {
                                                        return React.cloneElement(element, {
                                                            children: attachHandler(element.props.children)
                                                        })
                                                    }

                                                    return child
                                                })
                                            }

                                            return (
                                                <li className={cn("list-none flex items-center gap-2 -ml-4", "my-0.5")} {...props}>
                                                    {attachHandler(children)}
                                                </li>
                                            )
                                        }

                                        return (
                                            <li className="my-0.5" {...props}>
                                                {children}
                                            </li>
                                        )
                                    },
                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-primary/50 pl-2 italic text-muted-foreground my-2" {...props} />,
                                    h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-4 mb-2" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-3 mb-2" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                }}
                            >
                                {memo.content.replace(/(https?:\/\/[^\s]+)/g, '')}
                            </ReactMarkdown>
                        </div>

                        {/* Attachments */}
                        {memo.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                                {memo.attachments.map(att => {
                                    const isMedia = att.type.startsWith('audio/') || att.type.startsWith('video/') || /\.(mp4|webm|ogg|mp3|wav|m4a)$/i.test(att.name)
                                    return (
                                        <div key={att.id} className={cn(isMedia && "w-full")}>
                                            <FilePreview attachment={att} />
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* OGP/Tweets */}
                        {extractUrls(memo.content).length > 0 && (
                            <div className="mt-2 space-y-2">
                                {extractUrls(memo.content).map((url, i) => {
                                    const tweetId = getTweetId(url)
                                    if (tweetId) return <TweetPreview key={`${url}-${i}`} id={tweetId} />

                                    const youtubeId = getYoutubeId(url)
                                    if (youtubeId) return <YoutubePreview key={`${url}-${i}`} videoId={youtubeId} />

                                    return (
                                        <ContextMenu key={`${url}-${i}`}>
                                            <ContextMenuTrigger>
                                                <div onClick={e => { e.preventDefault(); e.stopPropagation() }} className="w-fit">
                                                    <LinkPreview url={url} />
                                                </div>
                                            </ContextMenuTrigger>
                                            <ContextMenuContent>
                                                <ContextMenuItem onClick={() => navigator.clipboard.writeText(url)}>
                                                    Copy URL
                                                </ContextMenuItem>
                                            </ContextMenuContent>
                                        </ContextMenu>
                                    )
                                })}
                            </div>
                        )}

                        {/* Actions (Hidden if readOnly) */}
                        {!readOnly && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted text-muted-foreground/50 hover:text-foreground">
                                            <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handlePin()}>
                                            <Pin className={cn("mr-2 h-4 w-4", memo.isPinned && "fill-current")} />
                                            {memo.isPinned ? "Unpin" : "Pin"}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-500 focus:text-red-500"
                                            onClick={handleDelete}
                                        >
                                            <Trash className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                </Link>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                {MenuItems()}
            </ContextMenuContent>
        </ContextMenu >
    )
}
