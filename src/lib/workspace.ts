import { promises as fs } from 'fs'
import path from 'path'
import { unstable_noStore } from 'next/cache'

export interface WorkspaceConfig {
    dataDir: string
    history: string[]
}

export async function getWorkspaceConfig(): Promise<WorkspaceConfig> {
    unstable_noStore()
    const userDataDir = process.env.USER_DATA_DIR
    if (!userDataDir) {
        // Fallback for dev/browser if not set
        return { dataDir: process.env.DATA_DIR || '', history: [] }
    }

    const configPath = path.join(userDataDir, 'config.json')
    try {
        const content = await fs.readFile(configPath, 'utf-8')
        return JSON.parse(content)
    } catch {
        return { dataDir: process.env.DATA_DIR || '', history: [] }
    }
}
