import { promises as fs } from 'fs'
import path from 'path'

export class JsonStorage {
    /**
     * Reads a JSON file and returns the parsed object.
     * Uses atomic read if possible (though node fs is atomic enough for read).
     */
    static async read<T>(filePath: string): Promise<T | null> {
        try {
            const content = await fs.readFile(filePath, 'utf-8')
            return JSON.parse(content) as T
        } catch (error) {
            // Return null if file doesn't exist or is invalid
            return null
        }
    }

    /**
     * Writes an object to a JSON file atomically.
     * Creates directory if it doesn't exist.
     */
    static async write<T>(filePath: string, data: T): Promise<void> {
        const dir = path.dirname(filePath)
        try {
            await fs.mkdir(dir, { recursive: true })
            // Atomic write: write to temp file then rename
            const tempPath = `${filePath}.tmp.${Date.now()}`
            await fs.writeFile(tempPath, JSON.stringify(data, null, 2))
            await fs.rename(tempPath, filePath)
        } catch (error) {
            console.error(`JsonStorage.write failed for ${filePath}:`, error)
            throw error
        }
    }

    /**
     * Deletes a file if it exists.
     */
    static async delete(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath)
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error
            }
        }
    }
}
