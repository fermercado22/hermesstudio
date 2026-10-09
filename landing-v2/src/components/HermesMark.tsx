type Props = {
  className?: string
}

/** Isotipo de Hermes Studio (alas). Usa fill="currentColor", heredá el color con className de texto. */
export default function HermesMark({ className = 'w-5 h-5' }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 1080 1080"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M760.44,656.61l-442.77-270.94,16.62-121.77,339.11,207.51c65.36,39.99,97.29,113.88,87.04,185.19Z" />
      <path d="M683.76,781.94c-58.84,41.6-139.16,46.79-204.52,6.8l-83.1-50.86,16.63-121.76,270.99,165.83Z" />
      <path d="M734.97,727.15c-9.29,15.18-20.4,28.55-32.88,40l-344.33-210.83,15.15-110.98,382.72,234.32c-2.26,8.18-5.11,16.25-8.54,24.17-3.44,7.93-7.47,15.72-12.12,23.31Z" />
    </svg>
  )
}
