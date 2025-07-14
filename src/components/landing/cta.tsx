import { Button } from '@/components/ui/button';

export function Cta() {
  return (
    <section id="cta" className="py-12 md:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-headline text-4xl font-bold tracking-tighter">Ready to optimize your logistics?</h2>
        <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
          Join thousands of businesses already transforming their operations with Synapse3PL.
        </p>
        <div className="mt-8">
            <Button size="lg" variant="secondary">Start your free trial</Button>
        </div>
      </div>
    </section>
  );
}
