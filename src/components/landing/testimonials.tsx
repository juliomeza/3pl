import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

const testimonialsData = [
    { name: 'Patricia Morales', handle: 'DirectShop • Mexico', avatar: 'PM', content: "We are now saving 1-2 man-days each month. Due to improved order reconciliation, we are now saving time, and we have a better understanding of our logistics thanks to dashboards." },
    { name: 'Guy Solan', handle: 'Thetis Commerce • UK', avatar: 'GS', content: "Without Reliable 3PL I would've lost loads of money on inefficient logistics." },
    { name: 'Facu Montanaro', handle: 'Kundo Studio • Argentina', avatar: 'FM', content: "It has completely transformed how I manage my day-to-day logistics tasks." },
    { name: 'Richard Poelderl', handle: 'Conduct.bln • Germany', avatar: 'RP', content: "I prefer to have one tool for logistics, similar to what Deel is for HR." },
    { name: 'Lucas Grey', handle: '@ImLucasGrey', avatar: 'LG', content: "This is so ingenious and good!" },
    { name: 'Zeno Rocha', handle: '@zenorocha', avatar: 'ZR', content: "this is absolutely amazing." },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-12 md:py-24 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-headline text-4xl font-bold tracking-tighter">Loved by businesses worldwide</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">Don't just take our word for it. Here's what people are saying.</p>
        </div>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {testimonialsData.map((testimonial, index) => (
                <Card key={index} className="break-inside-avoid">
                    <CardContent className="p-6">
                        <p className="text-foreground mb-4">"{testimonial.content}"</p>
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={`https://i.pravatar.cc/40?u=${testimonial.name}`} alt={testimonial.name} />
                                <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-sm">{testimonial.name}</p>
                                <p className="text-xs text-muted-foreground">{testimonial.handle}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </section>
  );
}
