import { useState } from 'react'
import { AttachmentData } from '@/lib/types'
import { FileIcon, ImageIcon, Film, Music, FileText, Download } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface FilePreviewProps {
    attachment: AttachmentData
}

export function FilePreview({ attachment }: FilePreviewProps) {
    const isVideo = attachment.type.startsWith('video/') || /\.(mp4|webm|ogg)$/i.test(attachment.name)
    const isAudio = attachment.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(attachment.name)
    const isImage = attachment.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(attachment.name)

    const [isOpen, setIsOpen] = useState(false)

    const handleDownload = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const link = document.createElement('a')
        link.href = attachment.url
        link.download = attachment.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (isImage) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <ContextMenu>
                    <ContextMenuTrigger>
                        <div
                            className="relative overflow-hidden rounded-lg border bg-muted/30 cursor-pointer hover:opacity-90 transition-opacity max-w-[50%] w-fit"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsOpen(true)
                            }}
                        >
                            <img
                                src={attachment.url}
                                alt={attachment.name || 'Image'}
                                className="w-full h-auto object-contain"
                                loading="lazy"
                            />
                        </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuItem onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>

                <DialogContent className="max-w-screen-lg w-full h-auto max-h-screen p-0 bg-transparent border-none shadow-none text-white">
                    <DialogTitle className="sr-only">{attachment.name || 'Image Preview'}</DialogTitle>
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                <img
                                    src={attachment.url}
                                    alt={attachment.name || 'Image'}
                                    className="w-full h-auto max-h-[90vh] object-contain rounded-md"
                                />
                            </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem onClick={handleDownload}>
                                <Download className="mr-2 h-4 w-4" /> Download
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                </DialogContent>
            </Dialog>
        )
    }

    if (isVideo) {
        return (
            <div className="rounded-lg overflow-hidden border bg-background/50 flex flex-col w-full" onClick={e => e.stopPropagation()}>
                <div className="p-2 border-b text-xs font-medium truncate flex items-center gap-2 bg-muted/30">
                    <Film className="h-3.5 w-3.5 text-muted-foreground" />
                    {attachment.name}
                </div>
                <video src={attachment.url} controls className="max-h-[500px] w-full bg-black" />
            </div>
        )
    }

    if (isAudio) {
        return (
            <div className="rounded-lg border bg-background/50 w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-2 border-b text-xs font-medium truncate flex items-center gap-2 bg-muted/30">
                    <Music className="h-3.5 w-3.5 text-primary" />
                    {attachment.name}
                </div>
                <div className="p-2">
                    <audio src={attachment.url} controls className="w-full h-8" />
                </div>
            </div>
        )
    }

    return (
        <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-3 p-3 rounded-lg border bg-muted/10 hover:bg-muted/20 transition-colors w-full max-w-sm group"
        >
            <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center text-primary group-hover:bg-primary/20 shrink-0">
                <FileIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{attachment.name || 'File'}</div>
                <div className="text-xs text-muted-foreground uppercase">{attachment.type}</div>
            </div>
            <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
    )
}
