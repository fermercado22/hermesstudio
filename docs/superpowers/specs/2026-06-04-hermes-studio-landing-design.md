# Hermes Studio — Landing Page Design Spec

**Fecha:** 2026-06-04  
**Estado:** Aprobado

---

## Contexto

Landing page institucional para **Hermes Studio**, agencia de marketing digital inspirada en el dios griego Hermes. El sitio sirve como primera impresión para prospectos de un mix de industrias (pymes, e-commerce, emprendedores, startups). Sin testimonios ni casos de estudio al lanzar — la voz de marca y el proceso son los pilares de credibilidad.

**CTA principal:** WhatsApp (botón verde #25D366 en nav y secciones clave).

---

## Decisiones de diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| Estilo visual | Clean & Minimal (Notion/Linear) | Proyecta claridad y profesionalismo |
| Logo | Logotipo tipográfico "Hermes Studio" | Sin logo definitivo aún |
| Iconografía | SVG de trazo fino (estilo Lucide) | Sin emojis genéricos |
| Tecnología | HTML/CSS/JS puro — `index.html` único | Sin dependencias de build, máxima performance |
| Idioma | Español (Argentina) | Mercado local |

---

## Arquitectura técnica

- **Un único archivo:** `hermes-studio/index.html`
- **CSS:** Custom properties para colores/tipografía, sin frameworks. Mobile-first.
- **JS:** Vanilla — menú mobile (hamburger), accordion FAQ, smooth scroll
- **Fuente:** Inter via Google Fonts (weights: 400, 600, 800)
- **Íconos:** SVG inline (Lucide icons — stroke style, 24×24)
- **Paleta:**
  - Fondo: `#ffffff`
  - Texto principal: `#111111`
  - Texto secundario: `#777777`
  - Bordes: `#e5e5e5`
  - Sección oscura (manifiesto/CTA): `#111111`
  - WhatsApp CTA: `#25D366`
  - Acento sutil: `#f5f5f5` (fondos de cards)

---

## Estructura de secciones

### ① Nav
- Sticky, `backdrop-filter: blur` al hacer scroll
- Izquierda: "Hermes Studio" en bold
- Derecha desktop: links internos (Servicios, Proceso, FAQ) + botón WhatsApp verde
- Mobile: hamburger → menú desplegable

### ② Hero
- Badge pill: "Agencia de Marketing Digital"
- H1 (2 líneas): headline impactante, tipografía grande con tracking negativo
- Subtítulo: descripción de servicios en una línea
- Dos CTAs: primario WhatsApp verde, secundario "Ver servicios" (outline)
- Grid 4×2 de las 7 tarjetas de servicios (con ícono SVG + nombre), última celda vacía o decorativa

### ③ Manifiesto
- Fondo `#111111`, texto blanco
- Eyebrow: "Por qué existimos"
- Cita/frase de marca en comillas, tipografía grande
- Párrafo corto con la visión de Hermes Studio

### ④ Servicios
- Título de sección centrado
- Grid de 7 cards (3 cols desktop, 2 cols tablet, 1 col mobile)
- Cada card: ícono SVG + nombre + descripción 2 líneas
- Card de Dashboards span completo o destacada

### ⑤ Proceso
- Título de sección
- 4 pasos en fila (desktop) / columna (mobile)
- Cada paso: número circular relleno negro + título + descripción corta
- Conectados visualmente con línea o flecha entre pasos

### ⑥ FAQ
- Título de sección
- 5 preguntas en accordion (expand/collapse con JS)
- Animación suave de apertura
- Preguntas:
  1. ¿Trabajan con cualquier tipo de negocio?
  2. ¿Cuánto tiempo tarda ver resultados?
  3. ¿Cómo son los precios?
  4. ¿Hacen contratos largos?
  5. ¿Qué necesito para empezar?

### ⑦ CTA Final
- Fondo `#111111`
- Headline de cierre con frase de marca
- Subtítulo breve: "Sin compromisos. Solo una charla."
- Botón WhatsApp grande

### ⑧ Footer
- Fondo blanco, borde top sutil
- Izquierda: "Hermes Studio" + tagline
- Derecha: © año

---

## Responsivo

| Breakpoint | Comportamiento |
|------------|---------------|
| Mobile < 768px | 1 columna, nav hamburger, proceso en columna |
| Tablet 768–1024px | 2 columnas servicios, proceso 2×2 |
| Desktop > 1024px | Layout completo, grid 4 columnas servicios |

---

## SEO técnico

- `<title>`: "Hermes Studio — Agencia de Marketing Digital"
- `<meta description>`: descripción con servicios y CTA
- Open Graph tags (og:title, og:description, og:image placeholder)
- Un único `<h1>` en el hero
- Jerarquía de encabezados: h1 → h2 por sección → h3 en cards
- Schema.org `LocalBusiness` JSON-LD
- Atributos `alt` en todos los íconos SVG

---

## Performance

- Sin frameworks externos de JS
- Inter cargada con `font-display: swap` y `preconnect`
- CSS crítico inline si supera los 14KB
- Target: Lighthouse 95+ en todas las categorías
