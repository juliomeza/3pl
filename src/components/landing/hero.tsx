
import { Card, CardContent } from '@/components/ui/card';

const stats = [
  { label: 'Businesses', value: '50+' },
  { label: 'Warehouses', value: '10+' },
  { label: 'Transactions', value: '4.2M' },
  { label: 'Transaction value', value: '$812M' },
];

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-background pt-4 pb-32 xl:pt-4 xl:pb-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="relative z-10 w-[42rem] sm:w-auto">
              <h1 className="font-headline text-6xl lg:text-7xl font-bold tracking-tighter text-foreground">
                    <span className="block text-muted-foreground">Logistics</span>
                    <span className="block text-muted-foreground">management,</span>
                    <span className="block font-bold text-primary">Warehousing,</span>
                    <span className="block text-muted-foreground">Distribution,</span>
                    <span className="block text-muted-foreground">Inventory &amp; your</span>
                    <span className="block text-muted-foreground">own <span className="font-bold text-primary">Assistant</span></span>
                    <span className="block text-muted-foreground">made for</span>
                    <span className="block font-bold text-primary">E-commerce</span>
                </h1>
            </div>
          </div>
          <div className="hidden lg:block relative mt-12 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 lg:h-full">
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
    <div className="relative w-full h-[350px] lg:h-full">
      <div className="relative w-full h-full">
        <Card className="absolute top-[80px] -right-[50px] w-[340px] h-auto float-animation shadow-2xl" style={{ animationDelay: '0s' }}>
          <CardContent className="p-4 space-y-2 text-sm">
            <p className="font-semibold text-base">Inventory Control</p>
            <div className="flex justify-between items-baseline text-muted-foreground"><span>Products stored</span><span className="font-semibold text-right text-foreground">1,247</span></div>
            <div className="flex justify-between items-baseline text-muted-foreground"><span>Orders today</span><span className="font-semibold text-right text-foreground">89</span></div>
            <div className="flex justify-between items-baseline text-muted-foreground"><span>Avg. delivery time</span><span className="font-semibold text-right text-foreground">1.2d</span></div>
          </CardContent>
        </Card>
        <Card className="absolute top-[260px] right-[100px] w-[300px] h-auto float-animation shadow-2xl" style={{ animationDelay: '-1s' }}>
          <CardContent className="p-4 space-y-2 text-sm">
             <p className="font-semibold text-base">Active Routes</p>
             <div className="flex justify-between items-baseline text-muted-foreground"><span>In transit</span><span className="font-semibold text-foreground">342</span></div>
            <div className="flex justify-between items-baseline text-muted-foreground"><span>Completed today</span><span className="font-semibold text-foreground">121</span></div>
            <MiniChart />
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
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                clipPath: 'polygon(0 100%, 20% 80%, 40% 85%, 60% 65%, 80% 70%, 100% 55%, 100% 100%)'
            }}></div>
        </div>
    );
}
