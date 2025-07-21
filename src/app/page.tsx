import {
  Header,
  Hero,
  Features,
  Testimonials,
  Cta,
  Footer,
} from '@/components/landing';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <Testimonials />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
