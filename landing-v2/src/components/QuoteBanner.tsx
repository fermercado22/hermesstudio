import { useScrollReveal } from '../hooks/useScrollReveal'

export default function QuoteBanner() {
  const ref = useScrollReveal<HTMLDivElement>()

  return (
    <section className="relative bg-gradient-to-b from-[#0A48AD] via-[#071a40] to-[#05070f] py-28 sm:py-36 lg:py-44">
      <div ref={ref} className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <p
          className="reveal-scale font-display text-white leading-snug lg:leading-tight"
          style={{ fontSize: 'clamp(1.5rem, 5vw, 3.25rem)' }}
        >
          Mucho más que una agencia.
          <br />
          <span className="font-light italic text-white/80">Un mensajero para tu negocio.</span>
        </p>
      </div>
    </section>
  )
}
