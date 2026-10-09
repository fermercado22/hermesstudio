import { Shader, Swirl, ChromaFlow, FlutedGlass, FilmGrain } from 'shaders/react'

/**
 * Fondo animado del hero. Paleta oscura con acento en azul de marca (#0A48AD)
 * para el tratamiento cinematográfico.
 */
export default function HeroShader() {
  return (
    <Shader className="absolute inset-0 w-full h-full z-10 pointer-events-none">
      <Swirl colorA="#0a1230" colorB="#0A48AD" detail={1.7} />
      <ChromaFlow
        baseColor="#0a1230"
        downColor="#0A48AD"
        leftColor="#0A48AD"
        rightColor="#0A48AD"
        upColor="#0A48AD"
        momentum={13}
        radius={9}
      />
      <FlutedGlass
        aberration={0.61}
        angle={31}
        frequency={8}
        highlight={0.12}
        highlightSoftness={0}
        lightAngle={-90}
        refraction={4}
        shape="rounded"
        softness={1}
        speed={0.15}
      />
      <FilmGrain strength={0.05} />
    </Shader>
  )
}
