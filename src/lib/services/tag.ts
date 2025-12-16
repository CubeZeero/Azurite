import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { TagData } from '@/lib/types'
import { BaseService } from './base'
import { memoService } from './memo'
import { categoryService } from './category'

class TagService extends BaseService {
    constructor() {
        super()
    }

    async getTags(query: string): Promise<TagData[]> {
        await this.init()
        const systemDir = path.join(this.rootDir, '.system')
        const tagsPath = path.join(systemDir, 'tags.json')

        try {
            const content = await fs.readFile(tagsPath, 'utf-8')
            const allTags: TagData[] = JSON.parse(content)
            if (!query) return allTags
            return allTags.filter(t => t.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
        } catch {
            return []
        }
    }

    async addTagToMemo(memoId: string, tagName: string) {
        // 1. Find Memo
        const memo = await memoService.getMemo(memoId)
        if (!memo) throw new Error("Memo not found")
        const catPath = await categoryService.getCategoryPath(memo.categoryId)
        if (!catPath) throw new Error("Category path not found")

        // 2. Resolve Tag ID (Find or Create in Index)
        const systemDir = path.join(this.rootDir, '.system')
        const tagsPath = path.join(systemDir, 'tags.json')
        let allTags: TagData[] = []
        try {
            const content = await fs.readFile(tagsPath, 'utf-8')
            allTags = JSON.parse(content)
        } catch { }

        let tag = allTags.find(t => t.name === tagName)
        if (!tag) {
            tag = { id: randomUUID(), name: tagName }
            allTags.push(tag)
            await fs.mkdir(systemDir, { recursive: true })
            await fs.writeFile(tagsPath, JSON.stringify(allTags, null, 2))
        }

        // 3. Update Memo
        // Check if already tagged
        if (!memo.tags.some(t => t.name === tagName)) {
            // We need to store just ID or full object? 
            // Type says TagData[].
            memo.tags.push(tag)
            await fs.writeFile(path.join(catPath, `${memoId}.json`), JSON.stringify(memo, null, 2))
        }
    }
}

export const tagService = new TagService()
