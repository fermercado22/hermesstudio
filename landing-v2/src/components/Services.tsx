import { Check } from 'lucide-react'
import { useScrollReveal } from '../hooks/useScrollReveal'

const WEB_INCLUDES = [
  'Diseño a medida, no una plantilla genérica',
  'Catálogo o secciones de servicios, según tu negocio',
  'SEO on-page y compresión de imágenes para que cargue rápido',
  'Contacto directo por WhatsApp, sin formularios que nadie llena',
]

const OTHER_SERVICES = [
  { title: 'SEO', desc: 'Posicionamiento orgánico para que Google te encuentre primero.' },
  { title: 'Google Ads', desc: 'Aparecés cuando alguien ya está buscando lo que vendés.' },
  { title: 'Meta Ads', desc: 'Publicidad en Instagram y Facebook con segmentación precisa.' },
  { title: 'Email Marketing', desc: 'Campañas que fidelizan clientes y generan ventas recurrentes.' },
  { title: 'Automatización', desc: 'Procesos con IA para no perder tiempo en tareas repetitivas.' },
  { title: 'Diseño & Branding', desc: 'Identidad visual que comunica quién sos antes de hablar.' },
]

export default function Services() {
  const ref = useScrollReveal<HTMLDivElement>()

  return (
    <section id="servicios" className="bg-[#05070f] pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
      <div ref={ref} className="max-w-[1440px] mx-auto">
        <div className="reveal px-5 sm:px-8 lg:px-12 flex items-center gap-3 mb-6 sm:mb-8">
          <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-gray-900 text-[11px] sm:text-xs font-semibold">
            2
          </span>
          <span className="text-[12px] sm:text-sm font-medium border border-white/20 text-white/80 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">
            Qué hacemos
          </span>
        </div>

        <h2
          className="reveal px-5 sm:px-8 lg:px-12 font-display font-medium text-white leading-[1.08] tracking-[-0.03em] mb-10 sm:mb-14 lg:mb-16"
          style={{ animationDelay: '0.1s', fontSize: 'clamp(1.75rem, 7vw, 4.2rem)' }}
        >
          Servicios
        </h2>

        <div className="reveal px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5 sm:gap-6 items-start" style={{ animationDelay: '0.15s' }}>
          <article className="liquid-glass rounded-2xl bg-brand/20 p-7 sm:p-9 lg:p-10">
            <span className="text-xs font-medium text-white/60 mb-3 block">Servicio principal</span>
            <h3 className="font-display font-medium text-2xl sm:text-3xl text-white mb-3">Desarrollo Web</h3>
            <p className="text-white/70 text-[14px] sm:text-[15px] leading-relaxed mb-7">
              Tu sitio es lo que tu cliente mira antes de escribirte. Lo diseñamos para que esa decisión sea fácil.
            </p>
            <ul className="flex flex-col gap-3">
              {WEB_INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] sm:text-sm text-white/90">
                  <Check size={15} className="text-white shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <div className="liquid-glass rounded-2xl p-7 sm:p-9 lg:p-10">
            <span className="text-xs font-medium text-white/50 mb-4 block">También ofrecemos</span>
            <ul className="flex flex-col divide-y divide-white/10">
              {OTHER_SERVICES.map(({ title, desc }) => (
                <li key={title} className="py-3.5 first:pt-0 last:pb-0">
                  <p className="text-white font-display font-medium text-[14px] sm:text-[15px]">{title}</p>
                  <p className="text-white/50 text-[13px] sm:text-sm mt-0.5">{desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
