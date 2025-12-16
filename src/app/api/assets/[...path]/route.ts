import { NextRequest, NextResponse } from 'next/server'
import { categoryService } from '@/lib/services/category'
import { join } from 'path'
import { promises as fs } from 'fs'

// Fallback mime type inference if package not installed
function getMimeType(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
        case 'png': return 'image/png'
        case 'jpg': case 'jpeg': return 'image/jpeg'
        case 'gif': return 'image/gif'
        case 'webp': return 'image/webp'
        case 'svg': return 'image/svg+xml'
        case 'pdf': return 'application/pdf'
        default: return 'application/octet-stream'
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: pathSegments } = await params

    // Pattern: /api/assets/CategoryId/filename
    // pathSegments = [CategoryId, filename]

    if (pathSegments.length < 2) {
        return new NextResponse("Invalid Path", { status: 400 })
    }

    const [categoryId, ...rest] = pathSegments
    const filename = rest.join('/') // Handles nested if any, though we flattened

    const catPath = await categoryService.getCategoryPath(categoryId)
    if (!catPath) {
        return new NextResponse("Category Not Found", { status: 404 })
    }

    // Security check: Ensure filepath is within catPath
    const filePath = join(catPath, 'attachments', filename)

    // Prevent directory traversal
    if (!filePath.startsWith(catPath)) {
        return new NextResponse("Access Denied", { status: 403 })
    }

    try {
        const stat = await fs.stat(filePath)
        const fileSize = stat.size
        const range = request.headers.get('range')

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-")
            const start = parseInt(parts[0], 10)
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
            const chunksize = (end - start) + 1

            const fileHandle = await fs.open(filePath, 'r')
            const buffer = Buffer.alloc(chunksize)
            await fileHandle.read(buffer, 0, chunksize, start)
            await fileHandle.close()

            return new NextResponse(buffer, {
                status: 206,
                headers: {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize.toString(),
                    'Content-Type': getMimeType(filename),
                    'Cache-Control': 'public, max-age=31536000, immutable'
                }
            })
        } else {
            const fileBuffer = await fs.readFile(filePath)
            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': getMimeType(filename),
                    'Accept-Ranges': 'bytes',
                    'Content-Length': fileSize.toString(),
                    'Cache-Control': 'public, max-age=31536000, immutable'
                }
            })
        }
    } catch (e) {
        return new NextResponse("File Not Found", { status: 404 })
    }
}
