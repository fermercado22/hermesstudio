import { useEffect, useRef, useState } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import RollButton from './RollButton'

type Demo = {
  slug: string
  rubro: string
  nombre: string
  herramienta: string
  alt: string
  vistas: [string, string, string]
}

const DEMOS: Demo[] = [
  {
    slug: 'corralon',
    rubro: 'Corralón',
    nombre: 'Corralón Central',
    herramienta: 'Armador de pedidos que llegan ordenados por WhatsApp.',
    alt: 'Web de ejemplo de un corralón con armador de pedidos',
    vistas: ['Inicio', 'Armador de pedidos', 'Para empresas'],
  },
  {
    slug: 'maderera',
    rubro: 'Maderera',
    nombre: 'Maderera Horizonte',
    herramienta: 'Calculadora de madera con plano en vivo y lista de materiales.',
    alt: 'Web de ejemplo de una maderera con calculadora de materiales',
    vistas: ['Inicio', 'Calculadora', 'Lista de materiales'],
  },
  {
    slug: 'metalurgica',
    rubro: 'Metalúrgica',
    nombre: 'Forja Norte',
    herramienta: 'Calculadora de peso de acero y pedido de cotización técnica.',
    alt: 'Web de ejemplo de una metalúrgica con calculadora de peso de acero',
    vistas: ['Inicio', 'Servicios', 'Calculadora de peso'],
  },
  {
    slug: 'agro',
    rubro: 'Maquinaria agrícola',
    nombre: 'Surco Maquinarias',
    herramienta: 'Pedido de repuestos con número de serie y catálogo de usados.',
    alt: 'Web de ejemplo de una casa de maquinaria agrícola con pedido de repuestos',
    vistas: ['Inicio', 'Pedido de repuestos', 'Equipos usados'],
  },
]

const ROTATE_MS = 4500

export default function Expositor() {
  const revealRef = useScrollReveal<HTMLDivElement>()
  const sectionRef = useRef<HTMLElement>(null)

  const [index, setIndex] = useState(0)
  const [view, setView] = useState(0)
  const [inView, setInView] = useState(false)
  const [manual, setManual] = useState(false)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  const demo = DEMOS[index]
  const rotating = inView && !manual && !reduced

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 })
    obs.observe(node)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    DEMOS.forEach((d) => {
      ;[1, 2, 3].forEach((n) => (new Image().src = `/demos/${d.slug}-${n}.jpg`))
      new Image().src = `/demos/${d.slug}-mobile.jpg`
    })
  }, [inView])

  // Rota sola solo si el sistema lo permite y hasta que la persona elige un rubro.
  useEffect(() => {
    if (!rotating) return
    const t = window.setTimeout(() => {
      if (view < 2) {
        setView(view + 1)
      } else {
        setView(0)
        setIndex((i) => (i + 1) % DEMOS.length)
      }
    }, ROTATE_MS)
    return () => window.clearTimeout(t)
  }, [index, view, rotating])

  const choose = (i: number) => {
    setManual(true)
    setIndex(i)
    setView(0)
  }

  const chooseView = (v: number) => {
    setManual(true)
    setView(v)
  }

  return (
    <section id="ejemplos" ref={sectionRef} className="bg-[#05070f] pt-16 sm:pt-20 lg:pt-28 pb-24 sm:pb-28 lg:pb-36 overflow-hidden">
      <div ref={revealRef} className="max-w-[1440px] mx-auto">
        <div className="reveal px-5 sm:px-8 lg:px-12 flex items-center gap-3 mb-6 sm:mb-8">
          <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-gray-900 text-[11px] sm:text-xs font-semibold">
            3
          </span>
          <span className="text-[12px] sm:text-sm font-medium border border-white/20 text-white/80 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">
            Lo que armamos
          </span>
        </div>

        <h2
          className="reveal px-5 sm:px-8 lg:px-12 font-display font-medium text-white leading-[1.08] tracking-[-0.03em] mb-4 sm:mb-5"
          style={{ animationDelay: '0.1s', fontSize: 'clamp(1.75rem, 7vw, 4.2rem)' }}
        >
          Así se ve una web
          <br className="hidden sm:block" /> pensada para tu rubro.
        </h2>
        <p
          className="reveal px-5 sm:px-8 lg:px-12 max-w-2xl text-white/60 text-[14px] sm:text-base leading-relaxed mb-10 sm:mb-14"
          style={{ animationDelay: '0.15s' }}
        >
          Cuatro rubros, cuatro diseños distintos y una herramienta propia en cada uno. Son proyectos de concepto que
          muestran el nivel de diseño y de funcionalidad que armamos.
        </p>

        <div
          className="reveal px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 lg:gap-12 items-start"
          style={{ animationDelay: '0.2s' }}
        >
          {/* Selector */}
          <div
            role="tablist"
            aria-label="Rubros de ejemplo"
            className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible -mx-5 px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 pb-1"
          >
            {DEMOS.map((d, i) => {
              const active = i === index
              return (
                <button
                  key={d.slug}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => choose(i)}
                  className={`relative shrink-0 w-[250px] lg:w-full text-left rounded-lg border p-4 sm:p-5 overflow-hidden transition-colors duration-300 ${
                    active ? 'border-white/25 bg-brand/25' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="block text-[11px] text-white/50 mb-1">Ejemplo: {d.nombre}</span>
                  <span className="block font-display font-medium text-white text-[17px] sm:text-lg">{d.rubro}</span>
                  <span className={`block text-[12.5px] sm:text-[13px] leading-snug mt-1.5 ${active ? 'text-white/80' : 'text-white/50'}`}>
                    {d.herramienta}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Escenario: solo se mira, nada se abre */}
          <div className="relative select-none">
            <div className="rounded-xl border border-white/15 hover:border-white/35 transition-colors duration-300 bg-[#0b1020] overflow-hidden">
              <div className="flex items-center gap-3 px-3.5 sm:px-4 h-9 sm:h-10 border-b border-white/10 bg-[#0d1326]">
                <span className="flex gap-1.5" aria-hidden="true">
                  <i className="block w-2.5 h-2.5 rounded-full bg-white/20" />
                  <i className="block w-2.5 h-2.5 rounded-full bg-white/20" />
                  <i className="block w-2.5 h-2.5 rounded-full bg-white/20" />
                </span>
                <span className="mx-auto text-[11px] sm:text-xs text-white/45 bg-white/[0.06] rounded-md px-3 py-0.5 sm:py-1 min-w-[40%] text-center">
                  tu-negocio.com.ar
                </span>
                <span className="w-10 sm:w-12" aria-hidden="true" />
              </div>

              <div className="relative aspect-[16/10] overflow-hidden bg-[#0b1020]">
                <img
                  key={`d-${demo.slug}-${view}`}
                  src={`/demos/${demo.slug}-${view + 1}.jpg`}
                  alt={demo.alt}
                  width={1280}
                  height={2600}
                  draggable={false}
                  className="demo-fade pointer-events-none absolute inset-0 w-full h-full object-cover object-top"
                />
              </div>
            </div>

            <div
              role="tablist"
              aria-label="Secciones de la web de ejemplo"
              className="mt-4 flex flex-wrap items-center gap-2"
            >
              {demo.vistas.map((label, v) => {
                const active = v === view
                return (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => chooseView(v)}
                    className={`relative overflow-hidden rounded-full border px-3.5 py-1.5 text-[12.5px] sm:text-[13px] transition-colors duration-300 ${
                      active ? 'border-white/30 bg-white text-gray-900 font-medium' : 'border-white/15 text-white/65 hover:text-white hover:border-white/30'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <div className="absolute right-3 sm:right-8 bottom-[-40px] sm:bottom-[-48px] w-[19%] min-w-[80px] max-w-[150px] pointer-events-none">
              <div className="rounded-[1.4rem] sm:rounded-[1.9rem] border-[4px] sm:border-[6px] border-[#161a26] bg-black overflow-hidden relative">
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10 h-1.5 w-1/4 rounded-full bg-black/80" aria-hidden="true" />
                <img
                  key={`m-${demo.slug}`}
                  src={`/demos/${demo.slug}-mobile.jpg`}
                  alt=""
                  width={780}
                  height={1688}
                  draggable={false}
                  className="demo-fade block w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="reveal px-5 sm:px-8 lg:px-12 mt-14 sm:mt-16 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8" style={{ animationDelay: '0.25s' }}>
          <RollButton href="#contacto">Quiero algo así</RollButton>
          <p className="text-[12px] sm:text-[13px] text-white/40 max-w-md">
            Proyectos de concepto con nombres ficticios y fotos de referencia. No son trabajos de clientes.
          </p>
        </div>
      </div>
    </section>
  )
}
