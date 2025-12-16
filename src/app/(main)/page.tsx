import { memoService } from '@/lib/services/memo'
import { getWorkspaceSettings } from '@/lib/actions/settings'
import { MemoListContainer } from '@/components/memo/memo-list-container'
import { CategoryData } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MainPage() {
    // 1. Fetch All Memos
    // We use searchMemos('') which returns (MemoData & { category: CategoryData })[]
    // This gives us the necessary category context for each memo.
    const allMemos = await memoService.searchMemos('')

    // 2. Sort by createdAt Ascending (Oldest First for Timeline)
    allMemos.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    // 3. Fix Asset URLs
    const formattedMemos = allMemos.map(m => ({
        ...m,
        attachments: (m.attachments || []).map(att => ({
            ...att,
            url: att.url.startsWith('FILE_SYSTEM:')
                ? `/api/assets/${m.categoryId}/${att.url.replace('FILE_SYSTEM:', '').split('/').pop()}`
                : att.url
        }))
    }))

    const settings = await getWorkspaceSettings()

    // 4. Synthetic Category for "All Notes"
    const allNotesCategory: CategoryData = {
        id: 'all-notes',
        name: 'All Notes',
        icon: null,
        parentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        path: '',
        children: [],
        memos: []
    }

    return (
        <MemoListContainer
            category={allNotesCategory}
            initialMemos={formattedMemos}
            initialViewMode={settings.viewMode}
            readOnly={true}
        />
    )
}
