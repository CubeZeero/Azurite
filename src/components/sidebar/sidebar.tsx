import { getCategories } from '@/lib/actions/category'
import { getWorkspaceConfig } from '@/lib/workspace'
import { SidebarContainer } from './sidebar-container'

export async function Sidebar() {
    const categories = await getCategories()
    const config = await getWorkspaceConfig()

    return <SidebarContainer categories={categories} config={config} />
}

