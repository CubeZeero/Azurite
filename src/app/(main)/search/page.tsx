import { memoService } from '@/lib/services/memo'
import { MemoItem } from '@/components/memo/memo-item'
import { FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SearchPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const q = searchParams.q as string

    if (!q) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Enter a search term...</p>
            </div>
        )
    }

    const results = await memoService.searchMemos(q)

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-background/50 backdrop-blur z-10">
                <h1 className="font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Search: "{q}"
                    <span className="text-xs font-normal text-muted-foreground ml-2">({results.length} found)</span>
                </h1>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                    {results.length > 0 ? (
                        results.map(memo => (
                            <MemoItem
                                key={memo.id}
                                memo={memo}
                                viewMode="list"
                                onEditChange={() => { }}
                            />
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            No memos found matching "{q}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
