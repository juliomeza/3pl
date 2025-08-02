
import { CreateOrderForm } from '@/components/dashboard/create-order-form';

export default function ClientOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-headline">Create Orders</h1>
        <p className="text-muted-foreground">
          Create inbound (purchase) and outbound (sales) orders for your projects.
        </p>
      </div>
      <CreateOrderForm />
    </div>
  );
}
