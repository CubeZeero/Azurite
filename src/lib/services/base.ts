import { promises as fs } from 'fs'
import path from 'path'

import { getWorkspaceConfig } from '@/lib/workspace'

export abstract class BaseService {
    protected rootDir: string = ''

    constructor() {
        // Initial fallback
        this.rootDir = process.env.DATA_DIR || path.join(process.cwd(), 'data')
    }

    public getRootDir() {
        return this.rootDir
    }

    // Hook for subclasses to clear caches
    protected onRootDirChange() { }

    // Legacy method - no longer mainly used but kept for compatibility if needed
    public setRootDir(newPath: string) {
        if (this.rootDir !== newPath) {
            this.rootDir = newPath
            this.onRootDirChange()
        }
    }

    async init() {
        // Dynamically load config to support hot-swapping
        try {
            const config = await getWorkspaceConfig()
            if (config.dataDir && config.dataDir !== this.rootDir) {
                this.rootDir = config.dataDir
                this.onRootDirChange()
            }
        } catch (e) {
            // console.error("BaseService init failed to load config", e)
        }

        try {
            await fs.access(this.rootDir)
        } catch {
            await fs.mkdir(this.rootDir, { recursive: true })
        }
    }
}
