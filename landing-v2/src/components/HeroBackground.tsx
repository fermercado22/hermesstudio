import { lazy, Suspense, useEffect, useState } from 'react'

const HeroShader = lazy(() => import('./HeroShader'))

async function hasWorkingWebGPU() {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false
  try {
    const gpu = (navigator as unknown as { gpu: { requestAdapter: () => Promise<unknown> } }).gpu
    const adapter = await gpu.requestAdapter()
    return !!adapter
  } catch {
    return false
  }
}

/**
 * El shader (paquete `shaders`, WebGPU) pesa bastante y afecta el LCP del hero.
 * Se carga con lazy() recién en el cliente. Algunos navegadores (sobre todo en
 * mobile) exponen `navigator.gpu` pero no logran crear un adapter real — ahí
 * hay que caer al degradé CSS igual, no alcanza con detectar la propiedad.
 */
export default function HeroBackground() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    hasWorkingWebGPU().then((ok) => {
      if (ok && !cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
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
