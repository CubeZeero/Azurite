import { categoryService } from '@/lib/services/category'
import { memoService } from '@/lib/services/memo'
import { notFound } from 'next/navigation'
import { MemoListContainer } from '@/components/memo/memo-list-container'
import { getWorkspaceSettings } from '@/lib/actions/settings'

export const dynamic = 'force-dynamic'

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const categoryId = id
    // We need category details and memos.
    // storage.getCategoryPath(id) validates existence but we need content.
    // We can infer category data from cache or scan.
    // Let's add getCategory(id) method to storage or reuse list.
    // Actually we can just get all categories and find it, or impl getCategory.
    // Let's assume we implement getCategoryDetails in actions or storage.

    // Direct call to services in SC
    const cats = await categoryService.getAllCategories() // This builds the tree.  
    // We need to find the specific category node in the tree.
    const findCat = (nodes: any[], targetId: string): any => {
        for (const node of nodes) {
            if (node.id === targetId) return node
            if (node.children) {
                const found = findCat(node.children, targetId)
                if (found) return found
            }
        }
        return null
    }
    const category = findCat(cats, categoryId)

    if (category) {
        // Fetch Memos for this category
        const rawMemos = await memoService.getMemos(categoryId)
        // Fix Asset URLs
        category.memos = rawMemos.map(m => ({
            ...m,
            attachments: m.attachments.map(att => ({
                ...att,
                url: `/api/assets/${categoryId}/${att.url.split('/').pop()}`
            }))
        }))
    }

    if (!category) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/20 h-full">
                <div className="max-w-md space-y-4">
                    <h2 className="text-xl font-bold text-destructive">Category Not Found</h2>
                    <p className="text-sm">
                        The category you are looking for does not exist or has been deleted.
                    </p>
                    <a href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                        Return Home
                    </a>
                </div>
            </div>
        )
    }


    if (category.icon === 'folder') {
        const children = category.children || []
        // Fetch latest memo for each child
        const childrenWithLatest = await Promise.all(children.map(async (child: any) => {
            const memos = await memoService.getMemos(child.id)
            // memos are sorted asc by default in service, so we reverse or take last
            // getMemos returns sorted by createdAt ASC. So last is latest.
            const latestMemo = memos.length > 0 ? memos[memos.length - 1] : null
            return {
                ...child,
                latestMemo
            }
        }))

        // Sort children by latest activity? Or name? Let's sort by latest activity desc.
        childrenWithLatest.sort((a, b) => {
            const timeA = a.latestMemo ? new Date(a.latestMemo.createdAt).getTime() : 0
            const timeB = b.latestMemo ? new Date(b.latestMemo.createdAt).getTime() : 0
            return timeB - timeA
        })

        // Also import FolderOverview
        const { FolderOverview } = await import('@/components/memo/folder-overview')

        return <FolderOverview currentCategory={category} subCategories={childrenWithLatest} />
    }

    const settings = await getWorkspaceSettings()

    return <MemoListContainer
        category={category}
        initialMemos={category.memos}
        initialViewMode={settings.viewMode}
    />
}
