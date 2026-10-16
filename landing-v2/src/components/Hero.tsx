import { CheckCircle2 } from 'lucide-react'
import HermesLogo from './HermesLogo'
import HeroBackground from './HeroBackground'
import RollButton from './RollButton'
import { waLink } from '../lib/whatsapp'

export default function Hero() {
  return (
    <section id="inicio" className="relative min-h-screen flex flex-col justify-center bg-[#05070f] overflow-hidden" aria-labelledby="heroTitle">
      <HeroBackground />
      <div className="absolute top-0 left-0 right-0 h-40 sm:h-48 z-10 pointer-events-none bg-gradient-to-b from-[#05070f] to-transparent" />

      <div className="relative z-20 max-w-[1440px] mx-auto w-full px-5 sm:px-8 lg:px-12 pt-28 pb-16 sm:pb-20 text-center">
        <HermesLogo
          className="hero-fade-up h-12 sm:h-16 lg:h-20 w-auto text-white mx-auto mb-6 sm:mb-8"
          style={{ animationDelay: '0.2s', ['--logo-mark' as string]: '#a9c1ee' }}
        />

        <h1
          id="heroTitle"
          className="hero-fade-up font-display font-medium text-white leading-[1.05] tracking-[-0.03em]"
          style={{ animationDelay: '0.25s', fontSize: 'clamp(2.25rem, 8vw, 5.5rem)' }}
        >
          Tu negocio<br />en movimiento.
        </h1>

        <p
          className="hero-fade-up mt-6 sm:mt-8 max-w-xl mx-auto text-white/70 text-[15px] sm:text-lg leading-relaxed"
          style={{ animationDelay: '0.4s' }}
        >
          Webs, publicidad, SEO, email y diseño que llegan rápido.
        </p>

        <div className="hero-fade-up mt-10 sm:mt-12 flex flex-col items-center gap-4 sm:gap-5" style={{ animationDelay: '0.55s' }}>
          <RollButton variant="light" href={waLink('Hola, quiero una consulta gratuita con Hermes Studio')}>
            Hablemos por WhatsApp
          </RollButton>
          <p className="flex items-center gap-2 text-[13px] sm:text-sm text-white/60">
            <CheckCircle2 size={14} />
            Primera consulta sin costo · Respondemos rápido
          </p>
        </div>
      </div>
    </section>
  )
}
