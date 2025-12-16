'use client'

import React, { useEffect } from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-markdown'

interface MarkdownInputProps {
    value: string
    onChange: (value: string) => void
    onKeyDown?: (e: React.KeyboardEvent) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    autoFocus?: boolean
    onPaste?: (e: React.ClipboardEvent) => void
}

export function MarkdownInput({ value, onChange, onKeyDown, placeholder, className, disabled, autoFocus, onPaste }: MarkdownInputProps) {

    // Ensure Prism highlighter is ready
    useEffect(() => {
        // Force re-highlight if needed or just let it be
    }, [])

    const highlight = (code: string) => {
        return Prism.highlight(code, Prism.languages.markdown || Prism.languages.extend('markup', {}), 'markdown')
    }

    return (
        <div className={`relative ${className} group`} onPaste={onPaste}>
            <Editor
                value={value}
                onValueChange={onChange}
                highlight={highlight}
                padding={10}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                ignoreTabKey={false} // Allows tabbing
                onKeyDown={onKeyDown}
                style={{
                    fontFamily: 'inherit',
                    fontSize: 14,
                    lineHeight: '1.5',
                }}
                className="min-h-[40px] max-h-[300px] overflow-y-auto w-full outline-none font-sans font-normal" // font-sans + font-normal (Regular)
                textareaClassName="focus:outline-none"
            />
            {/* Placeholder styling is tricky with this editor, usually done via CSS on the pre/textarea when empty */}
            {/* We will handle placeholder via CSS similar to Tiptap or custom logic if needed */}
        </div>
    )
}
