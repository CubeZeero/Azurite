'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Hash, Folder } from 'lucide-react'
import { createCategory } from '@/lib/actions/category'

import { CategoryData } from '@/lib/types'

export function CreateCategoryDialog({ categories }: { categories: CategoryData[] }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [type, setType] = useState<'category' | 'folder'>('category')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        try {
            await createCategory(name, type === 'folder' ? 'folder' : null, undefined)
            setOpen(false)
            setName('')
            setType('category')
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Only allow selecting root categories as parents (nesting level 1)
    const potentialParents = categories.filter(c => !c.parentId)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-4 w-4">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add Channel</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Channel</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            id="name"
                            placeholder="Channel name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Type</label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant={type === 'category' ? 'default' : 'outline'}
                                onClick={() => setType('category')}
                                className="flex-1"
                            >
                                <Hash className="mr-2 h-4 w-4" /> Text Channel
                            </Button>
                            <Button
                                type="button"
                                variant={type === 'folder' ? 'default' : 'outline'}
                                onClick={() => setType('folder')}
                                className="flex-1"
                            >
                                <Folder className="mr-2 h-4 w-4" /> Folder
                            </Button>
                        </div>
                    </div>



                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            Create
                        </Button>
                    </DialogFooter>
                </form>

            </DialogContent>
        </Dialog>
    )
}

