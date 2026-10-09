import HermesMark from './HermesMark'
import RollButton from './RollButton'
import { waLink } from '../lib/whatsapp'

export default function Footer() {
  return (
    <footer id="contacto" className="bg-[#05070f] text-white">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-16 sm:pt-20 lg:pt-24 pb-28 sm:pb-20 lg:pb-24">
        <div className="flex flex-col items-start gap-6">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
            <HermesMark className="w-4 h-4 text-white" />
          </span>
          <h2
            className="font-display font-medium leading-[1.08] tracking-[-0.03em]"
            style={{ fontSize: 'clamp(1.75rem, 6vw, 3.5rem)' }}
          >
            ¿Hablamos de tu proyecto?
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">Primera consulta sin costo. Respondemos rápido por WhatsApp.</p>
          <RollButton href={waLink('Hola, quiero consultar sobre Hermes Studio')}>Escribinos por WhatsApp</RollButton>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-16 sm:mt-20 pt-6 border-t border-white/10 text-gray-500 text-xs sm:text-sm">
          <span>© 2026 Hermes Studio. Todos los derechos reservados.</span>
          <span>Buenos Aires, Argentina</span>
        </div>
      </div>
    </footer>
  )
}
