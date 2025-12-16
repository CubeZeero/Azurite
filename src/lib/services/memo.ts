import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { AttachmentData, MemoData, CategoryData } from '@/lib/types'
import { BaseService } from './base'
import { categoryService } from './category'
import { getOgp } from '@/lib/actions/ogp'

class MemoService extends BaseService {
    constructor() {
        super()
    }

    async getMemos(categoryId: string): Promise<MemoData[]> {
        const catPath = await categoryService.getCategoryPath(categoryId)
        if (!catPath) return []

        const files = await fs.readdir(catPath)
        const memos: MemoData[] = []

        for (const file of files) {
            if (file.endsWith('.json') && file !== '.meta.json') {
                try {
                    const content = await fs.readFile(path.join(catPath, file), 'utf-8')
                    const data = JSON.parse(content)
                    data.path = path.join(catPath, file)
                    if (!data.content) data.content = ''
                    if (!data.attachments) data.attachments = []
                    if (!data.tags) data.tags = []
                    if (!data.reactions) data.reactions = []
                    if (!data.comments) data.comments = []
                    if (!data.embeds) data.embeds = []
                    memos.push(data)
                } catch (e) {
                    console.error(`Failed to read memo ${file}:`, e)
                }
            }
        }

        // Sort by createdAt asc (Chat-like)
        return memos.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }

    async searchMemos(query: string): Promise<(MemoData & { category: CategoryData })[]> {
        const allCategories = await categoryService.getAllCategories()
        const allMemos: (MemoData & { category: CategoryData })[] = []

        // Recursive flatten categories
        const flatten = (cats: CategoryData[]): CategoryData[] => {
            return cats.reduce<CategoryData[]>((acc, cat) => {
                const { children, ...rest } = cat
                return [...acc, { ...rest, children: [] } as CategoryData, ...flatten(children || [])]
            }, [])
        }

        const flatCategories = flatten(allCategories)
        const lowerQuery = query.toLowerCase()

        for (const cat of flatCategories) {
            const memos = await this.getMemos(cat.id)
            for (const memo of memos) {
                // If query is empty, allow? No, standard search usually requires query.
                // Assuming query is non-empty here or handled by caller.
                const matchesContent = !lowerQuery ? true : (
                    memo.content.toLowerCase().includes(lowerQuery) ||
                    (memo.title && memo.title.toLowerCase().includes(lowerQuery)) ||
                    memo.tags.some(t => t.name.toLowerCase().includes(lowerQuery)) ||
                    (memo.embeds && memo.embeds.some(e =>
                        (e.title && e.title.toLowerCase().includes(lowerQuery)) ||
                        (e.description && e.description.toLowerCase().includes(lowerQuery)) ||
                        (e.siteName && e.siteName.toLowerCase().includes(lowerQuery))
                    ))
                )

                if (matchesContent) {
                    allMemos.push({ ...memo, category: cat })
                }
            }
        }

        return allMemos
    }

    async getMemo(id: string): Promise<MemoData | null> {
        // Rudimentary scan relying on category cache
        // Rebuild/ensure cache is populated
        await categoryService.getAllCategories()
        // We can't access categoryService's indexCache directly because it's private.
        // But getMemo needs to find the file.
        // In the original storage, indexCache was shared. 
        // Here we need exposed way to get all paths? 
        // OR we just rely on `categoryService.getAllCategories` to return objects with paths?
        // `getAllCategories` returns CategoryData which HAS `path`.

        const scan = async (cats: CategoryData[]): Promise<MemoData | null> => {
            for (const cat of cats) {
                const files = await fs.readdir(cat.path)
                for (const file of files) {
                    if (file.endsWith(`${id}.json`)) {
                        const content = await fs.readFile(path.join(cat.path, file), 'utf-8')
                        return JSON.parse(content)
                    }
                }
                const result = await scan(cat.children)
                if (result) return result
            }
            return null
        }

        return await scan(await categoryService.getAllCategories())
    }

    private async saveFiles(files: File[], catPath: string, categoryId: string): Promise<AttachmentData[]> {
        const attachments: AttachmentData[] = []
        if (files.length > 0) {
            const attDir = path.join(catPath, 'attachments')
            await fs.mkdir(attDir, { recursive: true })

            for (const file of files) {
                const buffer = Buffer.from(await file.arrayBuffer())
                const ext = file.name.split('.').pop() || 'bin'
                const filename = `${randomUUID()}.${ext}`
                await fs.writeFile(path.join(attDir, filename), buffer)

                attachments.push({
                    id: randomUUID(),
                    url: `FILE_SYSTEM:${categoryId}/attachments/${filename}`,
                    type: file.type,
                    name: file.name,
                    mimeType: file.type,
                    createdAt: new Date().toISOString()
                })
            }
        }
        return attachments
    }


    // --- Embed Helper ---
    private async fetchEmbedMetadata(content: string): Promise<any[]> {
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const matches = content.match(urlRegex)
        if (!matches) return []

        const urls = matches.map(url => url.replace(/[.,;!?)]+$/, ''))
        const uniqueUrls = Array.from(new Set(urls))

        // Dynamic import to avoid circular dependency issues if any, though standard import usually works.
        const { fetchTweet } = await import('@/lib/actions/tweet')

        const embeds = await Promise.all(uniqueUrls.map(async url => {
            try {
                // Check for Twitter/X
                const twitterMatch = url.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/)
                if (twitterMatch) {
                    const tweetId = twitterMatch[1]
                    try {
                        const tweet = await fetchTweet(tweetId)
                        if (tweet) {
                            return {
                                url,
                                title: `Tweet from ${tweet.user?.name} (@${tweet.user?.screen_name})`,
                                description: tweet.text, // Tweet content for search
                                siteName: 'Twitter', // or X
                                image: tweet.photos?.[0]?.url || tweet.user?.profile_image_url_https
                            }
                        }
                    } catch (e) {
                        console.warn("Failed to fetch Tweet API, falling back to OGP", e)
                    }
                }

                // Check for YouTube
                const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
                if (youtubeMatch) {
                    try {
                        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
                        const res = await fetch(oembedUrl)
                        if (res.ok) {
                            const data = await res.json()
                            return {
                                url,
                                title: data.title,
                                description: `Video by ${data.author_name}`, // Add author to description for search
                                siteName: 'YouTube',
                                image: data.thumbnail_url
                            }
                        }
                    } catch (e) {
                        console.warn("Failed to fetch YouTube oEmbed", e)
                    }
                }

                // Determine type or use generic OGP
                // For now, we use generic OGP for text search purposes
                const ogp = await getOgp(url)
                if (ogp) {
                    return {
                        url,
                        title: ogp.title,
                        description: ogp.description,
                        siteName: ogp.siteName,
                        image: ogp.image // Optional for internal storage
                    }
                }
                return null
            } catch (error) {
                console.warn("Failed to fetch OGP for", url, error)
                return null
            }
        }))
        return embeds.filter(e => e !== null) as any[]
    }

    async createMemo(categoryId: string, data: Partial<MemoData>, files: File[] = []): Promise<MemoData> {
        const catPath = await categoryService.getCategoryPath(categoryId)
        if (!catPath) throw new Error("Category not found")

        const id = randomUUID()
        const now = new Date().toISOString()

        const attachments = await this.saveFiles(files, catPath, categoryId)

        // Fetch OGP
        const embeds = await this.fetchEmbedMetadata(data.content || '')

        const memo: MemoData = {
            id,
            title: data.title || null,
            content: data.content || '',
            createdAt: now,
            updatedAt: now,
            categoryId,
            isPinned: false,
            tags: [],
            attachments,
            comments: [],
            reactions: [],
            embeds
        }

        await fs.writeFile(path.join(catPath, `${id}.json`), JSON.stringify(memo, null, 2))
        return memo
    }

    async updateMemo(id: string, data: Partial<MemoData>, files: File[] = []) {
        // Find existing
        const memo = await this.getMemo(id)
        if (!memo) throw new Error("Memo not found")

        const catPath = await categoryService.getCategoryPath(memo.categoryId)
        if (!catPath) return

        let newAttachments: AttachmentData[] = []
        if (files.length > 0) {
            newAttachments = await this.saveFiles(files, catPath, memo.categoryId)
        }

        const updatedAttachments = [...(memo.attachments || []), ...newAttachments]

        // Re-fetch OGP if content changed
        // Optimization: We could diff, but for now simple re-fetch is safer for consistency
        let embeds = memo.embeds || []
        const hasEmbeds = embeds.length > 0
        const hasContentChange = data.content && data.content !== memo.content
        const hasUrl = (data.content || memo.content).includes('http')

        // If content changed OR (has URL but no embeds stored - likely failed before or old data)
        if (hasContentChange || (hasUrl && !hasEmbeds)) {
            // If content is not in data, use existing memo.content
            const contentToScan = data.content !== undefined ? data.content : memo.content
            embeds = await this.fetchEmbedMetadata(contentToScan)
        }

        const updated = {
            ...memo,
            ...data,
            attachments: data.attachments ? data.attachments : updatedAttachments, // If data.attachments provided (deletion), use it. Else append new.
            embeds: embeds,
            updatedAt: new Date().toISOString()
        }

        await fs.writeFile(path.join(catPath, `${id}.json`), JSON.stringify(updated, null, 2))
    }

    async deleteMemo(id: string) {
        const memo = await this.getMemo(id)
        if (!memo) return

        const catPath = await categoryService.getCategoryPath(memo.categoryId)
        if (catPath) {
            await fs.unlink(path.join(catPath, `${id}.json`))
        }
    }

    async toggleReaction(memoId: string, emoji: string) {
        const memo = await this.getMemo(memoId)
        if (!memo) throw new Error("Memo not found")
        const catPath = await categoryService.getCategoryPath(memo.categoryId)
        if (!catPath) throw new Error("Category path not found")

        // Initialize reactions if missing (migrations)
        if (!memo.reactions) memo.reactions = []

        const userId = 'default' // Single user mode
        const existingIndex = memo.reactions.findIndex(r => r.emoji === emoji && r.userId === userId)

        if (existingIndex >= 0) {
            // Remove
            memo.reactions.splice(existingIndex, 1)
        } else {
            // Add
            memo.reactions.push({
                id: randomUUID(),
                emoji,
                userId,
                createdAt: new Date().toISOString()
            })
        }

        await fs.writeFile(path.join(catPath, `${memoId}.json`), JSON.stringify(memo, null, 2))
    }

    async deleteComment(memoId: string, commentId: string) {
        const memo = await this.getMemo(memoId)
        if (!memo) throw new Error("Memo not found")
        const catPath = await categoryService.getCategoryPath(memo.categoryId)
        if (!catPath) throw new Error("Category path not found")

        if (!memo.comments) return

        memo.comments = memo.comments.filter(c => c.id !== commentId)

        await fs.writeFile(path.join(catPath, `${memoId}.json`), JSON.stringify(memo, null, 2))
    }
}

export const memoService = new MemoService()
