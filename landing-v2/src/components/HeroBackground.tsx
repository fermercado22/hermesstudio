import { lazy, Suspense, useEffect, useState } from 'react'

const HeroShader = lazy(() => import('./HeroShader'))

function supportsWebGPU() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

/**
 * El shader (paquete `shaders`, WebGPU) pesa bastante y afecta el LCP del hero.
 * Se carga con lazy() recién en el cliente, y en navegadores sin WebGPU se
 * muestra un degradé CSS con los mismos colores en vez de intentar renderizarlo.
 */
export default function HeroBackground() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (supportsWebGPU()) setReady(true)
  }, [])

  const fallback = (
    <div className="absolute inset-0 w-full h-full z-10 pointer-events-none bg-gradient-to-br from-[#05070f] via-[#0a1a3d] to-[#0A48AD]" />
  )

  if (!ready) return fallback

  return (
    <Suspense fallback={fallback}>
      <HeroShader />
    </Suspense>
  )
}
