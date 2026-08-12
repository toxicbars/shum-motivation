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
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${
        copied
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-[#FF1493]/20 text-[#FF1493] border border-[#FF1493]/30 hover:bg-[#FF1493]/30'
      }`}
    >
      {copied ? 'Скопировано!' : 'Скопировать'}
    </button>
  )
}