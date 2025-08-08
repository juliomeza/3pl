
'use client';

import { CreateOrderForm } from '@/components/dashboard/create-order-form';
import { useSearchParams } from 'next/navigation';

export default function ClientOrdersPage() {
  const params = useSearchParams();
  const editOrderNumber = params.get('edit');
  // const viewOrderNumber = params.get('view'); // reserved for future read-only view

  return (
    <CreateOrderForm editOrderNumber={editOrderNumber || undefined} />
  );
}
