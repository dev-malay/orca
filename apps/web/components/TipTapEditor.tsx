'use client'

import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { parseRichContent } from '@repo/shared'

type JSONContentLocal = {
  type: string
  attrs?: Record<string, unknown>
  content?: JSONContentLocal[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

interface TipTapEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

function toJsonContent(value: string): JSONContentLocal {
  if (value === '') {
    return { type: 'doc', content: [] }
  }
  const parsed = parseRichContent(value)
  if (parsed) {
    return parsed as JSONContentLocal
  }
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: value }] }],
  }
}

export function TipTapEditor({ value, onChange, disabled, className }: TipTapEditorProps) {
  const editor = useEditor(
    {
      extensions: [StarterKit],
      editable: !disabled,
      content: toJsonContent(value) as unknown as string | JSONContentLocal,
      onUpdate: ({ editor }) => {
        onChange(JSON.stringify(editor.getJSON()))
      },
    },
    [disabled],
  )

  useEffect(() => {
    if (!editor) return
    const current = JSON.stringify(editor.getJSON())
    if (current !== value) {
      editor.commands.setContent(toJsonContent(value))
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className="editor-container p-4">
      <EditorContent
        editor={editor}
        className={`max-w-none outline-none ${className ?? ''}`}
      />
    </div>
  )
}
