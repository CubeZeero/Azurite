'use server'

import { memoService } from '@/lib/services/memo'
import { revalidatePath } from 'next/cache'
// Removed fs/path imports as storage handles it

export async function createMemo(formData: FormData) {
    const content = formData.get('content') as string
    const title = formData.get('title') as string
    const categoryId = formData.get('categoryId') as string
    const files = formData.getAll('files') as File[]

    if ((!content || !content.trim()) && files.length === 0) {
        throw new Error("Content or file is required")
    }

    const memo = await memoService.createMemo(categoryId, { content, title }, files)

    // Remap attachments URL to API route
    memo.attachments = memo.attachments.map(att => ({
        ...att,
        // Convert internal placeholder to public API route
        // Original: FILE_SYSTEM:CatID/attachments/filename
        // New: /api/assets/CatID/filename
        url: `/api/assets/${categoryId}/${att.url.split('/').pop()}`
    }))

    revalidatePath(`/category/${categoryId}`)
    return memo
}

export async function getMemo(id: string) {
    const memo = await memoService.getMemo(id)
    if (!memo) return null

    // Fix URLs
    memo.attachments = memo.attachments.map(att => ({
        ...att,
        // Extract internal filename (UUID) from stored FILE_SYSTEM URL
        url: `/api/assets/${memo.categoryId}/${att.url.split('/').pop()}`
    }))

    return memo
}

export async function addComment(memoId: string, content: string) {
    // Implementing comments in JSON is possible but complex for partial updates.
    // For now, let's implement basic append.
    const memo = await memoService.getMemo(memoId)
    if (!memo) return

    const newComment = {
        id: crypto.randomUUID(),
        content,
        createdAt: new Date().toISOString(),
        memoId
    }

    // This requires a new method in storage to add comment specifically 
    // OR we just use updateMemo with new comments array.
    const comments = memo.comments || []
    comments.push(newComment)

    await memoService.updateMemo(memoId, { comments })

    revalidatePath('/')
    return newComment
}

export async function deleteComment(id: string, memoId: string) {
    await memoService.deleteComment(memoId, id)
    revalidatePath('/')
}

export async function updateMemo(
    id: string,
    data: {
        content?: string,
        title?: string,
        isPinned?: boolean,
        attachments?: any[]
    },
    files: File[] = [] // Optional files
) {
    if (!id) throw new Error('Memo ID is required')

    // If files are passed, we handle them.
    await memoService.updateMemo(id, data, files)

    // Remap URLs for new object? 
    // revalidatePath handles data refresh on client.
    revalidatePath('/')
}

export async function deleteMemo(id: string) {
    if (!id) throw new Error('Memo ID is required')

    const memo = await memoService.getMemo(id)
    if (memo) {
        await memoService.deleteMemo(id)
        revalidatePath(`/category/${memo.categoryId}`)
    }
}

export async function deleteAttachment(id: string) {
    // Again, we need memoId to find the attachment in the JSON struct.
    // Without MemoIndex, this is hard.
    console.warn("deleteAttachment requires memoId in this architecture")
}

export async function searchMemos(query: string) {
    // if (!query.trim()) return [] // Allow empty query for "All Notes"
    return await memoService.searchMemos(query)
}

