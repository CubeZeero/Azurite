import { cn } from "@/lib/utils"
import Link from "next/link"

interface EmbedCardProps {
    url: string
    borderColor?: string
    author?: {
        name: string
        handle?: string
        url?: string
    }
    title?: string
    description?: React.ReactNode
    imageUrl?: string
    media?: React.ReactNode // Custom media content (e.g. iframe)
    footer?: {
        icon?: React.ReactNode
        text: string
    }
}

export function EmbedCard({
    url,
    borderColor = "#2563eb", // Default Blue
    author,
    title,
    description,
    imageUrl,
    media,
    footer
}: EmbedCardProps) {
    return (
        <div className="flex w-full max-w-md mt-2 h-fit">
            {/* Left Colored Bar */}
            <div
                className="w-1 m-0 p-0 rounded-l-md shrink-0"
                style={{ backgroundColor: borderColor }}
            />

            {/* Content Box */}
            <div className="flex-1 bg-card/50 border-y border-r rounded-r-md p-3 text-sm min-w-0">
                {/* Author / Header */}
                {author && (
                    <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground font-medium">
                        {author.name}
                        {author.handle && (
                            <Link
                                href={author.url || url}
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline"
                            >
                                (@{author.handle})
                            </Link>
                        )}
                    </div>
                )}

                {/* Title */}
                {title && (
                    <div className="font-bold text-base text-primary/90 mb-1 hover:underline cursor-pointer">
                        <Link href={url} target="_blank" onClick={(e) => {
                            e.stopPropagation()
                        }}>
                            {title}
                        </Link>
                    </div>
                )}

                {/* Description / Body */}
                {description && (
                    <div className="text-muted-foreground whitespace-pre-wrap break-words mb-2 leading-relaxed">
                        {description}
                    </div>
                )}

                {/* Media (Image or Custom) */}
                {media ? (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black shadow-sm mt-2 border">
                        {media}
                    </div>
                ) : imageUrl && (
                    <div
                        className="relative w-full aspect-video rounded-md overflow-hidden bg-muted/50 cursor-pointer border mt-2"
                        onClick={(e) => {
                            e.stopPropagation()
                            window.open(url, '_blank')
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt="Embed Media"
                            className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                )}

                {/* Footer */}
                {footer && (
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                        {footer.icon}
                        <span>{footer.text}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
