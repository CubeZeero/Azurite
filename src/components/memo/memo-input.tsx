'use client'

import React, { useRef, useState, useEffect } from 'react'
import { createMemo } from '@/lib/actions/memo'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Paperclip, ArrowUp, X, File, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { MarkdownInput } from './markdown-input'

export function MemoInput({ categoryId, onCreated }: { categoryId: string; onCreated?: () => void }) {
    const [content, setContent] = useState('')
    const [title, setTitle] = useState('')
    const [files, setFiles] = useState<File[]>([])
    const [loading, setLoading] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Revoke object URLs to avoid memory leaks
    useEffect(() => {
        const objectUrls: string[] = [];
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                objectUrls.push(URL.createObjectURL(file));
            }
        });

        return () => {
            objectUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [files]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if ((!content.trim() && files.length === 0 && !title.trim()) || loading) return

        setLoading(true)
        const formData = new FormData()
        formData.append('content', content)
        if (title.trim()) formData.append('title', title.trim())
        formData.append('categoryId', categoryId)
        files.forEach(file => formData.append('files', file))

        try {
            await createMemo(formData)
            setContent('')
            setTitle('')
            setFiles([])
            onCreated?.()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }



    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index))
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        if (e.clipboardData.files.length > 0) {
            const pastedFiles = Array.from(e.clipboardData.files)
            const imageFiles = pastedFiles.filter(file => file.type.startsWith('image/'))

            if (imageFiles.length > 0) {
                e.preventDefault()
                setFiles(prev => [...prev, ...imageFiles])
            }
        }
    }

    return (
        <div className="flex flex-col gap-2">
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2 pb-2">
                    {files.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 bg-muted rounded-md px-2 py-1.5 text-xs text-muted-foreground border relative group">
                            {file.type.startsWith('image/') ? (
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="h-8 w-8 object-cover rounded shadow-sm"
                                />
                            ) : file.type.startsWith('video/') ? (
                                <div className="h-8 w-8 bg-black/10 flex items-center justify-center rounded shadow-sm text-foreground">
                                    <ImageIcon className="h-4 w-4 hidden" /> {/* Dummy to keep import used if needed, or remove */}
                                    <ArrowUp className="h-4 w-4 hidden" />
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-film"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" /></svg>
                                </div>
                            ) : file.type.startsWith('audio/') ? (
                                <div className="h-8 w-8 bg-primary/10 flex items-center justify-center rounded shadow-sm text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-music"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                                </div>
                            ) : (
                                <File className="h-4 w-4" />
                            )}
                            <span className="max-w-[150px] truncate">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="ml-1 hover:text-foreground text-muted-foreground/50 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative flex flex-col gap-0 bg-muted/30 rounded-xl border focus-within:ring-1 focus-within:ring-ring transition-all overflow-hidden mt-0">
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title (Optional)"
                        className="px-4 pt-3 pb-1 bg-transparent border-0 focus:ring-0 text-sm font-bold text-foreground placeholder:text-muted-foreground/50 w-full focus:outline-none"
                        disabled={loading}
                    />

                    <div className="flex items-end gap-2 p-2 pt-0">
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
                            size="icon"
                            variant="ghost"
                            disabled={loading}
                            className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground shrink-0 mb-0.5"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="h-5 w-5" />
                            <span className="sr-only">Attach file</span>
                        </Button>

                        <MarkdownInput
                            value={content}
                            onChange={(val) => setContent(val)}
                            onPaste={handlePaste}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                    e.preventDefault()
                                    handleSubmit()
                                }
                            }}
                            placeholder={title ? "Message..." : "Message (hold Shift + Enter for new line)"}
                            className="w-full"
                        />

                        <Button
                            type="submit"
                            size="icon"
                            disabled={loading || (!content.trim() && files.length === 0)}
                            className="rounded-full h-9 w-9 shrink-0 mb-0.5"
                            variant={content.trim() || files.length > 0 ? 'default' : 'secondary'}
                        >
                            <ArrowUp className="h-5 w-5" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
