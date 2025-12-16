'use server'

import { categoryService } from '@/lib/services/category'
import { revalidatePath } from 'next/cache'

export async function createCategory(name: string, icon: string | null = null, parentId?: string) {
    if (!name || name.trim() === '') {
        throw new Error('Category name is required')
    }

    try {
        console.log("Action: createCategory start", name)
        // Cast to any to satisfy Prisma return type expectations if needed, 
        // or arguably we should update the types. 
        // But since the frontend expects the shape, and our CategoryData maps well:
        // CategoryData (id, name, parentId...) roughly equals DB model.
        const category = await categoryService.createCategory(name, icon, parentId || null)
        console.log("Action: storage.createCategory success", category.id)

        try {
            console.log("Action: revalidatePath start")
            revalidatePath('/')
            console.log("Action: revalidatePath success")
        } catch (revalError) {
            console.error("Action: revalidatePath FAILED (Non-fatal):", revalError)
        }

        return category
    } catch (e) {
        console.error("Action createCategory FAILED:", e)
        throw e
    }
}


export async function getCategories() {
    // We need to flatten the tree or return root?
    // The original getCategories returned ALL categories flat.
    // storage.getAllCategories returns Roots with Children nested.
    // We need to FLATTEN them to match findMany() behavior if components expect a flat list
    // OR update components to handle trees.
    // Let's check: CategoryList component likely does its own tree building from flat list.
    // Actually, `CategoryList` builds the tree itself.

    // Helper to flatten
    const nodes = await categoryService.getAllCategories()
    const flatten = (items: any[]): any[] => {
        return items.reduce((acc, item) => {
            const { children, memos, ...rest } = item
            return [...acc, rest, ...flatten(children || [])]
        }, [])
    }

    return flatten(nodes).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export async function deleteCategory(id: string) {
    if (!id) throw new Error('Category ID is required')

    await categoryService.deleteCategory(id)

    revalidatePath('/')
}

export async function moveCategory(id: string, newParentId: string | null) {
    if (!id) throw new Error('Category ID is required')
    await categoryService.moveCategory(id, newParentId)
    revalidatePath('/')
}

export async function renameCategory(id: string, name: string) {
    if (!id) throw new Error('Category ID is required')
    if (!name || name.trim() === '') throw new Error('Category name is required')

    await categoryService.updateCategory(id, { name })
    revalidatePath('/')
}
