
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Cta() {
  return (
    <section id="cta" className="py-12 md:py-24 bg-foreground text-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-headline text-4xl font-bold tracking-tighter">Ready to optimize your logistics?</h2>
        <p className="mt-4 text-lg text-background/80 max-w-2xl mx-auto">
          Join thousands of businesses already transforming their operations with Reliable 3PL.
        </p>
        <div className="mt-8">
            <Button size="lg" variant="secondary" asChild>
                <Link href="#">Contact Us</Link>
            </Button>
        </div>
      </div>
    </section>
  );
}
