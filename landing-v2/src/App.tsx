import Preloader from './components/Preloader'
import OlympusNav from './components/OlympusNav'
import Hero from './components/Hero'
import Showcase from './components/Showcase'
import Services from './components/Services'
import QAndA from './components/QAndA'
import QuoteBanner from './components/QuoteBanner'
import Footer from './components/Footer'
import WhatsAppFloat from './components/WhatsAppFloat'

export default function App() {
  return (
    <>
      <Preloader />
      <OlympusNav />
      <Hero />
      <Showcase />
      <Services />
      <QAndA />
      <QuoteBanner />
      <Footer />
      <WhatsAppFloat />
    </>
  )
}
