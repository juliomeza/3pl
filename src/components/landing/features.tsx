
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AiAssistant } from './ai-assistant';
import { LogisticsOverviewChart } from './charts/logistics-overview-chart';
import { OrderTrackingTable } from './charts/order-tracking-table';
import { ShipmentManagementChart } from './charts/shipment-management-chart';

const featureData = [
  {
    title: 'Logistics Overview',
    description: 'Bring your own warehouse. We connect to over 20,000+ suppliers in 33 countries. Keep tabs on your inventory and shipments, and gain a clearer picture of your business\'s logistics.',
    points: ['Inventory', 'Turnover rate', 'Shipments', 'Unified overview'],
    component: <LogisticsOverviewChart />,
    align: 'right'
  },
  {
    title: 'Track your orders',
    description: 'Track your orders, monitor project durations, set rates and create shipments from your recorded transactions.',
    points: ['Order status tracking', 'Real-time updates', 'Delivery history'],
    component: <OrderTrackingTable />,
    align: 'left'
  },
  {
    title: 'Shipment Management',
    description: 'Create and send shipments to your customers, monitor your delivery status, track delayed shipments and send notifications.',
    points: ['Create orders', 'Add tracking & delivery notes', 'Add discounts', 'Send automated notifications', 'Export as PDF'],
    component: <ShipmentManagementChart />,
    align: 'right'
  },
   {
    title: 'AI Assistant',
    description: 'Ask Reliable 3PL anything and get tailored insights into your logistics situation. Understand your biggest costs and opportunities to get a better grasp on your operations to help you cut costs and find opportunities.',
    points: ['Tailored insights', 'Cost analysis', 'Opportunity identification'],
    component: <AiAssistant />,
    align: 'left'
  },
];

export function Features() {
  return (
    <section id="features" className="py-12 md:py-24 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-headline text-4xl font-bold tracking-tighter">Everything you need</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            From automated inventory-to-order mapping to conversing with your logistics data and consolidating all your files.
          </p>
        </div>

        <div className="space-y-16">
          {featureData.map((feature, index) => (
            <div key={index} className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className={`order-2 ${feature.align === 'left' ? 'md:order-2' : 'md:order-1'}`}>
                <h3 className="font-headline text-3xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground mb-6">{feature.description}</p>
                {feature.points.length > 0 && (
                  <ul className="space-y-2">
                    {feature.points.map((point, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={`order-1 ${feature.align === 'left' ? 'md:order-1' : 'md:order-2'}`}>
                <Card className="overflow-hidden shadow-lg p-6">
                  {feature.component}
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
