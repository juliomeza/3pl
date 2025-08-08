
"use client";

import { CreateOrderForm } from '@/components/dashboard/create-order-form';
import { OrderDetails } from '@/components/dashboard/order-details';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useOrderDetails } from '@/hooks/use-order-details';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function ClientOrdersPage() {
  const params = useSearchParams();
  const editOrderNumber = params.get('edit');
  const viewOrderNumber = params.get('view');
  const { clientInfo } = useAuth();
  const ownerId = clientInfo?.owner_id || null;
  const { details, loading, error } = useOrderDetails(ownerId, viewOrderNumber);

  if (viewOrderNumber) {
    if (loading) {
      return (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-4/5 mb-2" />
            <Skeleton className="h-6 w-3/5" />
          </CardContent>
        </Card>
      );
    }
    if (error) {
      return <div className="text-sm text-red-600">{error}</div>;
    }
    if (!details) {
      return <div className="text-sm text-muted-foreground">Order not found or access denied.</div>;
    }
    return <OrderDetails data={details} />;
  }

  return <CreateOrderForm editOrderNumber={editOrderNumber || undefined} />;
}
