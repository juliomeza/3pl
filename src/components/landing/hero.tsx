import { Card, CardContent } from '@/components/ui/card';

const stats = [
  { label: 'Businesses', value: '50+' },
  { label: 'Warehouses', value: '10+' },
  { label: 'Transactions', value: '4.3M' },
  { label: 'Transaction value', value: '$812M' },
];

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden py-4 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid xl:grid-cols-5 gap-8 items-center">
          <div className="relative z-10 xl:col-span-3">
            <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-muted-foreground leading-tight md:leading-tight">
              Logistics management, <span className="text-foreground">Warehousing</span>, Distribution, Inventory &amp; your own <span className="text-foreground">Assistant</span> made for <span className="text-foreground">E&#8209;commerce</span>
            </h1>
          </div>
          <div className="relative hidden xl:block xl:col-span-2 h-[500px]">
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
    <div className="absolute top-0 right-0 w-[900px] h-[600px] -translate-y-1/4 translate-x-1/4 transform-gpu rotate-[5deg]">
      <div className="relative w-full h-full">
        <Card className="absolute top-[80px] right-[450px] w-[340px] h-auto float-animation shadow-2xl" style={{ animationDelay: '0s' }}>
          <CardContent className="p-4 space-y-2 text-sm">
            <p className="font-semibold text-base">Inventory Control</p>
            <div className="flex justify-between items-baseline text-muted-foreground"><span>Products stored</span><span className="font-semibold text-right text-foreground">1,247</span></div>
            <div className="flex justify-between items-baseline text-muted-foreground"><span>Orders today</span><span className="font-semibold text-right text-foreground">89</span></div>
            <div className="flex justify-between items-baseline text-muted-foreground"><span>Avg. delivery time</span><span className="font-semibold text-right text-foreground">1.2d</span></div>
          </CardContent>
        </Card>
        <Card className="absolute top-[260px] right-[300px] w-[300px] h-auto float-animation shadow-2xl" style={{ animationDelay: '-1s' }}>
          <CardContent className="p-4 space-y-2 text-sm">
             <p className="font-semibold text-base">Active Routes</p>
             <div className="flex justify-between items-baseline text-muted-foreground"><span>In transit</span><span className="font-semibold text-foreground">342</span></div>
            <div className="flex justify-between items-baseline text-muted-foreground"><span>Completed today</span><span className="font-semibold text-foreground">121</span></div>
            <MiniChart />
          </CardContent>
        </Card>
        <Card className="absolute top-[460px] right-[380px] w-[280px] h-auto float-animation shadow-2xl" style={{ animationDelay: '-6s' }}>
          <CardContent className="p-4 space-y-2 text-sm">
             <p className="font-semibold text-base">Performance</p>
             <div className="flex justify-between items-baseline text-muted-foreground"><span>Efficiency</span><span className="font-semibold text-foreground">98.3%</span></div>
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
