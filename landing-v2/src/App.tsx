import ErrorBoundary from './components/ErrorBoundary'
import Preloader from './components/Preloader'
import OlympusNav from './components/OlympusNav'
import Hero from './components/Hero'
import Showcase from './components/Showcase'
import Services from './components/Services'
import Expositor from './components/Expositor'
import QAndA from './components/QAndA'
import QuoteBanner from './components/QuoteBanner'
import Footer from './components/Footer'
import WhatsAppFloat from './components/WhatsAppFloat'

export default function App() {
  return (
    <>
      <Preloader />
      <OlympusNav />
      <ErrorBoundary>
        <Hero />
      </ErrorBoundary>
      <Showcase />
      <Services />
      <Expositor />
      <QAndA />
      <QuoteBanner />
      <Footer />
      <WhatsAppFloat />
    </>
  )
}
