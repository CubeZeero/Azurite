'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { FolderOpen, Layers } from 'lucide-react'

import { useRouter } from 'next/navigation'

export function WelcomeScreen() {
    const router = useRouter()

    const handleOpen = async () => {
        if (window.electron?.workspace) {
            const result: any = await window.electron.workspace.select()
            if (result && result.success) {
                router.refresh()
            }
        }
    }

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground space-y-8 p-8 animate-in fade-in duration-500">
            <div className="flex flex-col items-center space-y-4">
                <div className="mb-8 relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                    <img
                        src="/app-icon.png"
                        alt="Azurite Logo"
                        className="h-32 w-32 relative drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                    />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Azurite</h1>
                <p className="text-muted-foreground text-center max-w-sm leading-relaxed">
                    ローカルで管理する<br />
                    チャットアプリライクなMarkdownノートアプリ
                </p>
            </div>

            <div className="flex flex-col items-center gap-4">
                <Button
                    size="lg"
                    onClick={handleOpen}
                    className="h-12 px-8 text-base font-medium shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
                >
                    <FolderOpen className="mr-2 h-5 w-5" />
                    ノートブックを開く
                </Button>
                <p className="text-xs text-muted-foreground/60">
                    既存のフォルダを選択するか、新しいフォルダを作成してください
                </p>
            </div>
        </div>
    )
}
