import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  href: string
  children: ReactNode
  variant?: 'dark' | 'brand'
  size?: 'sm' | 'md'
}

/**
 * Botón con animación de "text roll" en hover (el texto se duplica y
 * se desliza verticalmente) y un círculo con flecha que rota -45deg.
 */
export default function RollButton({ href, children, variant = 'brand', size = 'md' }: Props) {
  const bg = variant === 'brand' ? 'bg-brand hover:bg-brand-dark' : 'bg-gray-900 hover:bg-gray-800'
  const arrowColor = variant === 'brand' ? 'text-brand' : 'text-gray-900'
  const circleSize = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8'
  const pad = size === 'sm' ? 'pl-5 pr-2 py-2' : 'pl-5 sm:pl-6 pr-2 py-2'
  const textSize = size === 'sm' ? 'text-[13px]' : 'text-[13px] sm:text-sm'
  const isInternalAnchor = href.startsWith('#')

  return (
    <a
      href={href}
      {...(!isInternalAnchor && { target: '_blank', rel: 'noopener noreferrer' })}
      className={`group inline-flex items-center gap-3 ${pad} rounded-full ${bg} text-white font-medium ${textSize} transition-colors duration-300`}
    >
      <span className="relative h-[20px] overflow-hidden block">
        <span
          className="flex flex-col transition-transform duration-500 group-hover:-translate-y-1/2"
          style={{ transitionTimingFunction: 'cubic-bezier(0.25,0.1,0.25,1)' }}
        >
          <span className="h-[20px] leading-[20px] block">{children}</span>
          <span className="h-[20px] leading-[20px] block">{children}</span>
        </span>
      </span>
      <span className={`flex items-center justify-center ${circleSize} rounded-full bg-white shrink-0`}>
        <ArrowRight
          className={`${arrowColor} w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-45`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.25,0.1,0.25,1)' }}
        />
      </span>
    </a>
  )
}
