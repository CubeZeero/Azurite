
export interface AttachmentData {
    id: string
    url: string
    type: string
    name: string
    mimeType: string
    createdAt: string
}

export interface CommentData {
    id: string
    content: string
    createdAt: string
    memoId: string
}

export interface TagData {
    id: string
    name: string
}



export interface ReactionData {
    id: string
    emoji: string
    userId: string // For "me" or "system"
    createdAt: string
}

export interface MemoData {
    id: string
    title: string | null
    content: string
    createdAt: string
    updatedAt: string
    categoryId: string
    isPinned: boolean
    tags: TagData[]
    attachments: AttachmentData[]
    comments: CommentData[]
    reactions: ReactionData[]
    // Runtime
    path?: string
    // Embed Metadata for Search
    embeds?: EmbedMetadata[]
}

export interface EmbedMetadata {
    url: string
    title?: string
    description?: string
    siteName?: string
    image?: string
}

export interface CategoryData {
    id: string
    name: string
    icon: string | null
    parentId: string | null
    createdAt: string
    updatedAt: string
    // Runtime only
    path: string
    children: CategoryData[]
    memos: MemoData[]
}
