import { Card, CardHeader, CardContent } from '@/components/ui/card';

const stats = [
  { label: 'Businesses', value: '25,200+' },
  { label: 'Warehouses', value: '8,800+' },
  { label: 'Transactions', value: '3.4M' },
  { label: 'Transaction value', value: '$812M' },
];

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-8 items-center">
          <div className="relative z-10 lg:col-span-3">
            <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-gray-400 mb-6 mr-0 sm:mr-10 md:mr-20 lg:mr-32 leading-tight md:leading-snug">
              Logistics management, <span className="text-foreground">Warehousing</span>, Distribution, Inventory & your own <span className="text-foreground">Assistant</span> made for <span className="text-foreground">E-commerce</span>.
            </h1>
          </div>
          <div className="relative hidden lg:block lg:col-span-2 h-[500px]">
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
        <Card className="absolute top-[150px] right-[300px] w-[350px] h-auto float-animation shadow-2xl" style={{ animationDelay: '0s' }}>
          <CardHeader>
            <p className="font-semibold">Inventory Control</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Products stored</span><span className="font-semibold">47,892</span></div>
            <div className="flex justify-between"><span>Orders today</span><span className="font-semibold">1,247</span></div>
            <div className="flex justify-between"><span>Avg. delivery time</span><span className="font-semibold">2.4 days</span></div>
          </CardContent>
        </Card>
        <Card className="absolute top-[300px] right-[500px] w-[300px] h-auto float-animation shadow-2xl" style={{ animationDelay: '-2s' }}>
          <CardHeader>
             <p className="font-semibold">Active Routes</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>In transit</span><span className="font-semibold">342</span></div>
            <div className="flex justify-between"><span>Completed today</span><span className="font-semibold">89</span></div>
            <MiniChart />
          </CardContent>
        </Card>
        <Card className="absolute top-[280px] right-[250px] w-[250px] h-auto float-animation shadow-2xl" style={{ animationDelay: '-4s' }}>
          <CardHeader>
            <p className="font-semibold">Alerts</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Low stock</span><span className="font-semibold text-destructive">12</span></div>
            <div className="flex justify-between"><span>Delays</span><span className="font-semibold text-destructive">3</span></div>
          </CardContent>
        </Card>
        <Card className="absolute top-[420px] right-[350px] w-[300px] h-auto float-animation shadow-2xl" style={{ animationDelay: '-6s' }}>
          <CardHeader>
            <p className="font-semibold">Performance</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
             <div className="flex justify-between"><span>Efficiency</span><span className="font-semibold">98%</span></div>
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
                background: 'linear-gradient(135deg, hsl(224 64% 32%), hsl(190 100% 58%))',
                clipPath: 'polygon(0 100%, 20% 80%, 40% 85%, 60% 65%, 80% 70%, 100% 55%, 100% 100%)'
            }}></div>
        </div>
    );
}
