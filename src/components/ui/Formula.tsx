import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'

/** Renders LaTeX with KaTeX. Invalid input degrades to the raw source rather than crashing. */
export function Formula({ tex, block = false, className }: { tex: string; block?: boolean; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: block, throwOnError: false, strict: false, output: 'html' }),
    [tex, block],
  )
  const Tag = block ? 'div' : 'span'
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
