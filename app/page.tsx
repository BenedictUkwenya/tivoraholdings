import Navbar from "@/components/landing/navbar"
import Hero from "@/components/landing/hero"
import Ticker from "@/components/landing/ticker"
import Stats from "@/components/landing/stats"
import Features from "@/components/landing/features"
import Plans from "@/components/landing/plans"
import HowItWorks from "@/components/landing/how-it-works"
import Testimonials from "@/components/landing/testimonials"
import FAQ from "@/components/landing/faq"
import CTA from "@/components/landing/cta"
import Footer from "@/components/landing/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900 overflow-x-hidden">
      <Navbar />
      <Hero />
      <Ticker />
      <Stats />
      <Features />
      <Plans />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}
