const PHONE = '5492392613037'

export function waLink(message: string) {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`
}
