import { useScrollReveal } from '../hooks/useScrollReveal'

const LEFT = [
  {
    q: '¿Por qué Hermes?',
    a: 'Hermes es el mensajero de los dioses: el que conecta y mueve las cosas rápido. Así encaramos cada proyecto — nada se frena en el camino.',
  },
  {
    q: '¿Cómo trabajan tan rápido?',
    a: 'Usamos IA en todo el proceso de diseño y desarrollo. Lo que antes tomaba meses, ahora lo lanzamos en semanas, sin bajar la calidad.',
  },
  {
    q: '¿Para quién es Hermes Studio?',
    a: 'Para empresas que necesitan verse serias y que las contacten ya — nada de formularios eternos, un WhatsApp que no para de sonar.',
  },
]

const RIGHT = [
  {
    q: '¿Y si no tengo página todavía?',
    a: 'Mejor. Partimos de cero, sin arrastrar errores de otra web. Catálogo, SEO y contacto directo, todo pensado para convertir.',
  },
  {
    q: '¿Y si ya tengo clientes y poco tiempo?',
    a: 'Por eso existimos. Vos seguís atendiendo tu negocio, nosotros nos encargamos de que te sigan encontrando.',
  },
  {
    q: '¿Qué sigue después de la web?',
    a: 'Publicidad y automatización, cuando estés listo. Un paso a la vez, sin venderte humo.',
  },
]

export default function QAndA() {
  const ref = useScrollReveal<HTMLDivElement>()
  let i = 0

  return (
    <section id="preguntas" className="bg-[#05070f]">
      <div ref={ref} className="max-w-[1100px] mx-auto px-5 sm:px-8 lg:px-12 pt-20 sm:pt-28 lg:pt-32 pb-28 sm:pb-36">
        <h2
          className="reveal flex items-baseline justify-center gap-2 font-display text-white mb-16 sm:mb-20"
          style={{ fontSize: 'clamp(2.25rem, 7vw, 4.5rem)' }}
        >
          <span>P</span>
          <span className="italic text-white/80" style={{ fontSize: '0.5em' }}>&amp;</span>
          <span>R</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-10 sm:gap-14 lg:gap-20">
          <div className="flex flex-col gap-10 sm:gap-12">
            {LEFT.map((item) => {
              i += 1
              return (
                <div key={item.q} className="reveal" style={{ animationDelay: `${0.12 * i}s` }}>
                  <h3 className="font-display text-xs sm:text-base uppercase tracking-wide text-white mb-2">{item.q}</h3>
                  <p className="text-[12px] sm:text-sm leading-relaxed text-white/60">{item.a}</p>
                </div>
              )
            })}
          </div>
          <div className="flex flex-col gap-10 sm:gap-12">
            {RIGHT.map((item) => {
              i += 1
              return (
                <div key={item.q} className="reveal" style={{ animationDelay: `${0.12 * i}s` }}>
                  <h3 className="font-display text-xs sm:text-base uppercase tracking-wide text-white mb-2">{item.q}</h3>
                  <p className="text-[12px] sm:text-sm leading-relaxed text-white/60">{item.a}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
