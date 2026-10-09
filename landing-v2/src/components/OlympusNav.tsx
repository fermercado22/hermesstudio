import HermesMark from './HermesMark'

const LINKS_LEFT = [
  { href: '#nosotros', label: 'Proceso' },
  { href: '#servicios', label: 'Servicios' },
]
const LINKS_RIGHT = [
  { href: '#preguntas', label: 'Preguntas' },
  { href: '#contacto', label: 'Contacto' },
]

export default function OlympusNav() {
  return (
    <nav
      className="liquid-glass inline-flex max-w-[92vw] fixed top-3 sm:top-6 left-1/2 -translate-x-1/2 z-50 rounded-full px-3 py-2 sm:px-10 sm:py-3"
      aria-label="Navegación principal"
    >
      <div className="flex items-center gap-2.5 xs:gap-3 sm:gap-12">
        {LINKS_LEFT.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="hidden sm:inline text-[10px] sm:text-xs uppercase font-medium tracking-[0.15em] sm:tracking-[0.2em] text-white/85 hover:text-white transition-colors whitespace-nowrap"
          >
            {l.label}
          </a>
        ))}
        <a href="#inicio" aria-label="Hermes Studio — Inicio" className="flex items-center justify-center shrink-0 hover:scale-110 transition-transform duration-300">
          <HermesMark className="h-6 w-6 sm:h-9 sm:w-9 text-white" />
        </a>
        {LINKS_RIGHT.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-[9px] sm:text-xs uppercase font-medium tracking-[0.1em] sm:tracking-[0.2em] text-white/85 hover:text-white transition-colors whitespace-nowrap"
          >
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
