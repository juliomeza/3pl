import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const pricingPlans = [
    {
        name: 'Starter',
        description: 'Perfect for small e-commerce businesses',
        price: '$0',
        period: 'Free forever',
        features: [
            'Up to 100 orders/month',
            'Basic inventory tracking',
            'Email support',
            '2 warehouse locations',
            'Standard reporting',
        ],
        isFeatured: false,
        cta: 'Get Started',
        href: '/login'
    },
    {
        name: 'Professional',
        description: 'Best for growing businesses',
        price: '$30',
        period: 'per month',
        features: [
            'Up to 5,000 orders/month',
            'Advanced inventory management',
            'Priority support',
            'Unlimited warehouses',
            'Advanced reporting & analytics',
            'AI-powered insights',
            'API access',
            'Custom integrations',
        ],
        isFeatured: true,
        cta: 'Start Free Trial',
        href: '/login'
    },
    {
        name: 'Enterprise',
        description: 'For large-scale operations',
        price: 'Custom',
        period: 'Contact us',
        features: [
            'Unlimited orders',
            'Enterprise inventory suite',
            '24/7 dedicated support',
            'Global warehouse network',
            'Custom reporting',
            'Advanced AI assistant',
            'White-label options',
        ],
        isFeatured: false,
        cta: 'Contact Sales',
        href: '#'
    },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-12 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-headline text-4xl font-bold tracking-tighter">Simple, transparent pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">Choose the plan that's right for your business.</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            {pricingPlans.map((plan) => (
                <Card key={plan.name} className={cn('flex flex-col', plan.isFeatured && 'border-primary ring-2 ring-primary shadow-lg')}>
                    <CardHeader>
                        <CardTitle className="font-headline">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="mb-6">
                            <span className="font-headline text-4xl font-bold">{plan.price}</span>
                            <span className="text-muted-foreground"> {plan.period}</span>
                        </div>
                        <ul className="space-y-3">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant={plan.isFeatured ? 'default' : 'outline'} asChild>
                           <Link href={plan.href}>{plan.cta}</Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </div>
    </section>
  );
}
