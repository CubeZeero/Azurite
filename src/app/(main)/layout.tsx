
import { Sidebar } from '@/components/sidebar/sidebar'
import { DetailsSidebar } from '@/components/details/details-sidebar'
import { Suspense } from 'react'
import { ResizableLayout } from '@/components/layout/resizable-layout'
import { getWorkspaceConfig } from '@/lib/workspace'
import { WelcomeScreen } from '@/components/welcome-screen'

export const dynamic = 'force-dynamic'

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const config = await getWorkspaceConfig()

    // Show Welcome Screen if no workspace is selected
    if (!config.dataDir) {
        return <WelcomeScreen />
    }

    return (
        <div className="h-screen w-full overflow-hidden bg-background font-sans flex flex-col">
            <div className="flex-1 overflow-hidden">
                <ResizableLayout
                    sidebar={<Sidebar />}
                    details={
                        <Suspense fallback={<div className="h-full w-full bg-background" />}>
                            <DetailsSidebar />
                        </Suspense>
                    }
                >
                    {children}
                </ResizableLayout>
            </div>
        </div>
    )
}
