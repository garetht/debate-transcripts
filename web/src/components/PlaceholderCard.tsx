import type { JSX } from 'react'

export function PlaceholderCard({
  message,
  tone = 'neutral',
}: {
  message: string
  tone?: 'neutral' | 'error'
}): JSX.Element {
  const toneClass =
    tone === 'error'
      ? 'border-red-200/70 bg-red-50/80 text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200'
      : 'border-slate-200/60 bg-white/60 text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200'

  return (
    <article
      className={`rounded-2xl border p-5 text-sm shadow-card ring-1 ring-black/5 transition duration-200 ${toneClass}`}
    >
      {message}
    </article>
  )
}
