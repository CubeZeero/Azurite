import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { CategoryData } from '@/lib/types'
import { BaseService } from './base'
import { JsonStorage } from './json-storage'

class CategoryService extends BaseService {
    private indexCache: Map<string, string> = new Map() // ID -> Absolute Path

    constructor() {
        super()
    }

    // --- Helpers ---
    private async scanDir(dir: string, parentId: string | null = null): Promise<CategoryData[]> {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        const categories: CategoryData[] = []

        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'attachments' && entry.name !== '_system') {
                const fullPath = path.join(dir, entry.name)
                const metaPath = path.join(fullPath, '.meta.json')

                let meta: any = await JsonStorage.read(metaPath)
                if (!meta) {
                    // If no meta, synthesize it (for manually created folders)
                    meta = {
                        id: randomUUID(),
                        name: entry.name,
                        icon: null,
                        parentId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                    // Write it back to persist ID
                    await JsonStorage.write(metaPath, meta)
                }

                // Update Index
                this.indexCache.set(meta.id, fullPath)

                // Ensure updatedAt exists for legacy/manual folders
                if (!meta.updatedAt) meta.updatedAt = meta.createdAt

                const category: CategoryData = {
                    ...meta,
                    path: fullPath,
                    children: await this.scanDir(fullPath, meta.id),
                    memos: [] // Filled separately if needed, or lazily
                }
                categories.push(category)
            }
        }
        return categories
    }

    async getCategoryPath(id: string): Promise<string | null> {
        // Fast path: check cache
        if (this.indexCache.has(id)) return this.indexCache.get(id)!

        // Slow path: full scan to rebuild cache
        await this.getAllCategories()
        return this.indexCache.get(id) || null
    }

    protected onRootDirChange() {
        this.indexCache.clear()
    }

    // --- Categories ---
    async getAllCategories(): Promise<CategoryData[]> {
        await this.init()
        // Clear cache before rebuild? Or just append? 
        // Safer to clear to handle deletions
        this.indexCache.clear()
        return await this.scanDir(this.rootDir)
    }

    async createCategory(name: string, icon: string | null, parentId: string | null): Promise<CategoryData> {
        await this.init()
        let parentPath = this.rootDir
        if (parentId) {
            const p = await this.getCategoryPath(parentId)
            if (p) parentPath = p
        }

        const id = randomUUID()
        const dirName = name // Potential collision handling needed here in real app
        const fullPath = path.join(parentPath, dirName)

        try {
            await fs.mkdir(fullPath, { recursive: true })

            const meta = {
                id,
                name,
                icon,
                parentId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
            await JsonStorage.write(path.join(fullPath, '.meta.json'), meta)

            this.indexCache.set(id, fullPath)
            return { ...meta, path: fullPath, children: [], memos: [] }
        } catch (error) {
            console.error("CategoryService.createCategory failed:", error)
            throw error
        }
    }

    async deleteCategory(id: string) {
        const p = await this.getCategoryPath(id)
        if (p) {
            await fs.rm(p, { recursive: true, force: true })
            this.indexCache.delete(id)
        }
    }

    async moveCategory(id: string, newParentId: string | null) {
        const oldPath = await this.getCategoryPath(id)
        if (!oldPath) return

        let newParentPath = this.rootDir
        if (newParentId) {
            const p = await this.getCategoryPath(newParentId)
            if (p) newParentPath = p
        }

        const dirName = path.basename(oldPath)
        const newPath = path.join(newParentPath, dirName)

        await fs.rename(oldPath, newPath)

        // Update meta parentId
        const metaPath = path.join(newPath, '.meta.json')
        try {
            const meta: any = await JsonStorage.read(metaPath)
            if (meta) {
                meta.parentId = newParentId
                await JsonStorage.write(metaPath, meta)
                this.indexCache.set(id, newPath)
            }
        } catch (e) {
            console.error("Failed to update moved category meta", e)
        }
    }

    async updateCategory(id: string, data: { name: string }) {
        const oldPath = await this.getCategoryPath(id)
        if (!oldPath) throw new Error("Category not found")

        // 1. Get current metadata to determine type
        let isFolder = false
        try {
            const metaPath = path.join(oldPath, '.meta.json')
            const meta: any = await JsonStorage.read(metaPath)
            if (meta) {
                isFolder = meta.icon === 'folder'
            }
            // Check children via directory scan if needed? 
            // The constraint is simple: "if it looks like a folder, check against folders".
            // Since we use icon='folder' for explicit folders, relies on that.
            // Also check if it has children? 
            // In CategoryList: isFolder = category.icon === 'folder' || hasChildren
            // We should match that logic to be consistent.
            const entries = await fs.readdir(oldPath, { withFileTypes: true })
            const hasChildren = entries.some(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'attachments')
            if (hasChildren) isFolder = true
        } catch (e) {
            console.error("Failed to read meta for type check", e)
        }

        // 2. Check for Duplicates
        const allCategories = await this.getAllCategories()
        const flatten = (cats: CategoryData[]): CategoryData[] => {
            return cats.reduce<CategoryData[]>((acc, c) => {
                return [...acc, c, ...flatten(c.children || [])]
            }, [])
        }
        const flatCats = flatten(allCategories)

        const duplicate = flatCats.find(c => {
            if (c.id === id) return false // skip self

            const otherIsFolder = c.icon === 'folder' || (c.children && c.children.length > 0)

            // Check type match
            if (isFolder !== otherIsFolder) return false

            // Check name match
            return c.name === data.name
        })

        if (duplicate) {
            throw new Error(isFolder
                ? "そのフォルダ名は既に使用されています"
                : "そのチャンネル名は既に使用されています"
            )
        }

        // 3. Rename Logic (Existing)
        const parentPath = path.dirname(oldPath)
        const newPath = path.join(parentPath, data.name)

        if (oldPath !== newPath) {
            await fs.rename(oldPath, newPath)
            this.indexCache.set(id, newPath)

            // Update meta
            const metaPath = path.join(newPath, '.meta.json')
            try {
                const meta: any = await JsonStorage.read(metaPath)
                if (meta) {
                    meta.name = data.name
                    await JsonStorage.write(metaPath, meta)
                }
            } catch (e) {
                console.error("Failed to update meta for renamed category", e)
            }
        }
    }
}

export const categoryService = new CategoryService()
