import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const stats = [
  { label: 'Businesses', value: '25,200+' },
  { label: 'Warehouses', value: '8,800+' },
  { label: 'Transactions', value: '2.4M' },
  { label: 'Transaction value', value: '$812M' },
];

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative z-10">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
              Synapse3PL v1.1 is here!
            </span>
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground mb-6">
              Logistics management, <span className="text-primary">Warehousing</span>, and your own AI <span className="text-primary">Assistant</span> for E-commerce.
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Start your free trial today. No credit card required, cancel anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg">Start Free Trial</Button>
              <Button size="lg" variant="outline">Talk to Founders</Button>
            </div>
          </div>
          <div className="relative hidden md:block h-[500px]">
            <FloatingCards />
          </div>
        </div>
        <div className="mt-16 md:mt-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="font-headline text-3xl md:text-4xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingCards() {
  return (
    <div className="absolute top-0 right-0 w-[900px] h-[600px] -translate-y-1/4 translate-x-1/4 transform-gpu rotate-[-15deg]">
      <div className="relative w-full h-full">
        <Card className="absolute top-[50px] right-[100px] w-[350px] h-auto float-animation shadow-2xl" style={{ animationDelay: '0s' }}>
          <CardHeader>
            <p className="font-semibold">Inventory Control</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Products stored</span><span className="font-semibold">47,892</span></div>
            <div className="flex justify-between"><span>Orders today</span><span className="font-semibold">1,247</span></div>
            <div className="flex justify-between"><span>Avg. delivery time</span><span className="font-semibold">2.4 days</span></div>
            <MiniChart />
          </CardContent>
        </Card>
        <Card className="absolute top-[200px] right-[300px] w-[300px] h-auto float-animation shadow-2xl" style={{ animationDelay: '-2s' }}>
          <CardHeader>
             <p className="font-semibold">Active Routes</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>In transit</span><span className="font-semibold">342</span></div>
            <div className="flex justify-between"><span>Completed today</span><span className="font-semibold">89</span></div>
            <MiniChart />
          </CardContent>
        </Card>
        <Card className="absolute top-[80px] right-[50px] w-[250px] h-auto float-animation shadow-2xl" style={{ animationDelay: '-4s' }}>
          <CardHeader>
            <p className="font-semibold">Alerts</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Low stock</span><span className="font-semibold text-destructive">12</span></div>
            <div className="flex justify-between"><span>Delays</span><span className="font-semibold text-destructive">3</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniChart() {
    return (
        <div className="w-full h-10 bg-muted rounded-md mt-2 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-[60%]" style={{
                background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))',
                clipPath: 'polygon(0 100%, 20% 80%, 40% 85%, 60% 65%, 80% 70%, 100% 55%, 100% 100%)'
            }}></div>
        </div>
    );
}
