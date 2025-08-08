"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { deletePortalOrder } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MapPin, Package, Truck, Receipt, Calendar, Link as LinkIcon } from 'lucide-react';

export interface OrderDetailsData {
  orderNumber: string;
  orderType: 'inbound' | 'outbound' | null;
  source: 'portal' | 'operations' | 'both';
  status?: string | null;
  wmsStatus?: string | null;
  deliveryStatus?: string | null;
  orderStatusId?: number | null;
  orderDate?: string | null;
  fulfillmentDate?: string | null;
  estimatedDeliveryDate?: string | null;
  recipient: {
    name?: string | null;
    companyName?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
  };
  billing: {
    name?: string | null;
    companyName?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
  };
  carrier?: string | null;
  serviceType?: string | null;
  trackingNumbers?: string[];
  lineItems?: Array<{
    lineNumber: number;
    materialCode: string;
    materialName: string;
    quantity: number;
    uom: string;
    batchNumber?: string | null;
    licensePlate?: string | null;
    serialNumber?: string | null;
  }>;
}

function titleCase(s?: string | null) {
  if (!s) return 'Not set';
  return s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function fmtDate(iso?: string | null) {
  if (!iso) return 'Not set';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'Not set';
  }
}

export function OrderDetails({ data }: { data: OrderDetailsData }) {
  const router = useRouter();
  const { clientInfo } = useAuth();
  const { toast } = useToast();
  const topAccent = data.orderType === 'inbound'
    ? 'from-blue-500 via-sky-400 to-cyan-400'
    : 'from-emerald-500 via-sky-400 to-indigo-400';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className={`h-1 w-full bg-gradient-to-r ${topAccent}`} />
        <div className="p-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </span>
              <span className="truncate">Order {data.orderNumber}</span>
              {data.orderType && (
                <Badge variant={data.orderType === 'inbound' ? 'default' : 'secondary'}>{titleCase(data.orderType)}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {data.status && (
                <Badge variant="outline" className="bg-foreground/5 text-muted-foreground border-foreground/15">
                  Portal: {titleCase(data.status)}
                </Badge>
              )}
              {data.wmsStatus && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:border-blue-400/20">
                  WMS: {titleCase(data.wmsStatus)}
                </Badge>
              )}
              {data.deliveryStatus && (
                <Badge variant="outline" className="bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/20">
                  {titleCase(data.deliveryStatus)}
                </Badge>
              )}
              {/* Allow edit only for portal draft/failed */}
              {data.source !== 'operations' && data.status && ['draft','failed'].includes(String(data.status).toLowerCase()) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/client/orders?edit=${encodeURIComponent(data.orderNumber)}`)}
                >
                  Edit Order
                </Button>
              )}
              {/* Allow delete only for portal draft/failed */}
              {data.source !== 'operations' && data.status && ['draft','failed'].includes(String(data.status).toLowerCase()) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">Delete Order</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete order?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action is permanent and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-rose-600 hover:bg-rose-700"
                        onClick={async () => {
                          const ownerId = clientInfo?.owner_id;
                          if (!ownerId) return;
                          const res = await deletePortalOrder(ownerId, data.orderNumber);
                          if (res.success) {
                            toast({ title: 'Order deleted', description: `Order ${data.orderNumber} was deleted.` });
                            router.push('/client');
                          } else {
                            toast({ variant: 'destructive', title: 'Delete failed', description: res.error || 'Unable to delete order.' });
                          }
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Addresses */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 inline-flex items-center justify-center">
                    <MapPin className="h-3.5 w-3.5" />
                  </span>
                  {data.orderType === 'inbound' ? 'Ship From' : 'Ship To'}
                </h4>
                <div className="text-sm space-y-1">
                  {data.recipient?.name && <p className="font-medium">{data.recipient.name}</p>}
                  {data.recipient?.companyName && <p className="text-muted-foreground">{data.recipient.companyName}</p>}
                  <div className="text-muted-foreground">
                    {data.recipient?.line1 && <p>{data.recipient.line1}</p>}
                    {data.recipient?.line2 && <p>{data.recipient.line2}</p>}
                    {(data.recipient?.city || data.recipient?.state || data.recipient?.zipCode) && (
                      <p>
                        {data.recipient?.city}{data.recipient?.city && data.recipient?.state ? ', ' : ''}{data.recipient?.state} {data.recipient?.zipCode}
                      </p>
                    )}
                    {data.recipient?.country && <p>{data.recipient.country}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 inline-flex items-center justify-center">
                    <Package className="h-3.5 w-3.5" />
                  </span>
                  Billing
                </h4>
                <div className="text-sm space-y-1">
                  {data.billing?.name && <p className="font-medium">{data.billing.name}</p>}
                  {data.billing?.companyName && <p className="text-muted-foreground">{data.billing.companyName}</p>}
                  <div className="text-muted-foreground">
                    {data.billing?.line1 && <p>{data.billing.line1}</p>}
                    {data.billing?.line2 && <p>{data.billing.line2}</p>}
                    {(data.billing?.city || data.billing?.state || data.billing?.zipCode) && (
                      <p>
                        {data.billing?.city}{data.billing?.city && data.billing?.state ? ', ' : ''}{data.billing?.state} {data.billing?.zipCode}
                      </p>
                    )}
                    {data.billing?.country && <p>{data.billing.country}</p>}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 inline-flex items-center justify-center">
                  <Truck className="h-3.5 w-3.5" />
                </span>
                Shipping
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Carrier</div>
                  <div>{data.carrier || 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Service</div>
                  <div>{data.serviceType || 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">ETA</div>
                  <div>{fmtDate(data.estimatedDeliveryDate)}</div>
                </div>
              </div>

              {data.trackingNumbers && data.trackingNumbers.length > 0 && (
                <div className="text-sm">
                  <div className="text-muted-foreground mb-1">Tracking</div>
                  <div className="flex flex-wrap gap-2">
                    {data.trackingNumbers.map((tn, i) => (
                      <Badge key={i} variant="outline" className="inline-flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" /> {tn}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Dates */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              Timeline
            </h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{fmtDate(data.orderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fulfillment</span>
                <span>{fmtDate(data.fulfillmentDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Delivery</span>
                <span>{fmtDate(data.estimatedDeliveryDate)}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="font-medium">Materials {data.lineItems ? `(${data.lineItems.length})` : ''}</h4>
          {data.lineItems && data.lineItems.length > 0 ? (
            <div className="space-y-2">
              {data.lineItems.map((li) => (
                <div key={li.lineNumber} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{li.materialCode}</div>
                      <div className="text-sm text-muted-foreground truncate">{li.materialName}</div>
                      <div className="text-xs text-muted-foreground">
                        {li.batchNumber && <>Lot: {li.batchNumber}</>} {li.licensePlate && <>• LP: {li.licensePlate}</>}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{li.quantity.toLocaleString()} {li.uom}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No materials found</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
