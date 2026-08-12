'use client'

import { useState } from 'react'

export function CopyInviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      }`}
    >
      {copied ? 'Скопировано!' : 'Скопировать'}
    </button>
  )
}