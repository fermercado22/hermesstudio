import { useScrollReveal } from '../hooks/useScrollReveal'
import HermesMark from './HermesMark'
import RollButton from './RollButton'

const STEPS = [
  { n: '01', title: 'Escuchamos tu negocio', text: 'Qué vendés, a quién y cómo te escriben hoy.' },
  { n: '02', title: 'Diseñamos y lanzamos', text: 'Web, anuncios y automatizaciones, en semanas.' },
  { n: '03', title: 'Medimos consultas', text: 'Lo que cuenta: gente escribiéndote por WhatsApp.' },
]

export default function Showcase() {
  const ref = useScrollReveal<HTMLDivElement>()

  return (
    <section className="relative bg-gradient-to-b from-[#05070f] via-[#071a40] to-[#0A48AD] overflow-hidden">
      <HermesMark className="pointer-events-none absolute -right-32 -top-20 w-[28rem] h-[28rem] text-white/5" />

      <div ref={ref} className="relative max-w-[1100px] mx-auto px-5 sm:px-8 py-28 sm:py-36 lg:py-44 text-center">
        <span className="reveal inline-block text-[11px] sm:text-xs uppercase tracking-[0.3em] text-white/50 mb-6">
          Cómo trabajamos
        </span>

        <h2
          className="reveal font-display font-medium text-white leading-[1.08] tracking-[-0.02em] mb-6"
          style={{ animationDelay: '0.1s', fontSize: 'clamp(2rem, 6vw, 4.25rem)' }}
        >
          Donde cada negocio<br />encuentra su camino.
        </h2>

        <p
          className="reveal max-w-xl mx-auto text-white/70 text-[15px] sm:text-lg leading-relaxed mb-14 sm:mb-16"
          style={{ animationDelay: '0.2s' }}
        >
          Las mismas herramientas digitales que usan las grandes marcas, pensadas para tu negocio. Ejecución rápida con IA — semanas, no meses.
        </p>

        <div className="reveal grid sm:grid-cols-3 gap-5 sm:gap-6 text-left" style={{ animationDelay: '0.3s' }}>
          {STEPS.map((st) => (
            <div key={st.n} className="liquid-glass rounded-2xl p-6 sm:p-7">
              <span className="font-display text-white/40 text-lg">{st.n}</span>
              <h3 className="font-display font-medium text-white text-base sm:text-lg mt-2">{st.title}</h3>
              <p className="text-white/60 text-sm mt-1.5 leading-relaxed">{st.text}</p>
            </div>
          ))}
        </div>

        <div className="reveal mt-12 sm:mt-14 flex justify-center" style={{ animationDelay: '0.4s' }}>
          <RollButton href="#servicios">Ver servicios</RollButton>
        </div>
      </div>
    </section>
  )
}
