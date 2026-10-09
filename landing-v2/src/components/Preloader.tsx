import { useEffect, useState } from 'react'
import HermesLogo from './HermesLogo'

/** Pantalla de carga: muestra el isotipo y desliza todo hacia arriba para revelar la página. Sin librerías, solo CSS. */
export default function Preloader() {
  const [phase, setPhase] = useState<'show' | 'exit' | 'done'>('show')

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done')
      return
    }
    const toExit = setTimeout(() => setPhase('exit'), 850)
    const toDone = setTimeout(() => setPhase('done'), 850 + 700)
    return () => {
      clearTimeout(toExit)
      clearTimeout(toDone)
    }
  }, [])

  useEffect(() => {
    if (phase === 'done') return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [phase])

  if (phase === 'done') return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#05070f] ${phase === 'exit' ? 'preloader-exit' : ''}`}
      aria-hidden="true"
    >
      <HermesLogo
        className="preloader-logo h-10 sm:h-14 w-auto text-white"
        style={{ ['--logo-mark' as string]: '#a9c1ee' }}
      />
    </div>
  )
}
