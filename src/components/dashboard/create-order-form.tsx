
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Package, Truck, MapPin, CheckCircle, ArrowLeft, ArrowRight, Eye } from 'lucide-react';
import { OrderStepIndicator } from './order-step-indicator';
import { useHeaderControls } from '@/app/client/layout';
import { useProjectsForOrders } from '@/hooks/use-projects-for-orders';
import { useCarriersForOrders } from '@/hooks/use-carriers-for-orders';
import { useCarrierServiceTypesForOrders } from '@/hooks/use-carrier-service-types-for-orders';
import { useClientInfo } from '@/hooks/use-client-info';

interface LineItem {
  id: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  uom: string;
  batchNumber?: string;
  serialNumber?: string;
}

interface AddressComponent {
  street_number: string;
  route: string;
  locality: string;
  administrative_area_level_1: string;
  country: string;
  postal_code: string;
}

interface OrderFormData {
  orderType: 'inbound' | 'outbound' | '';
  projectId: string;
  orderNumber: string;
  shipmentNumber: string;
  recipientName: string;
  recipientAddress: string;
  billingAccountName: string;
  billingAddress: string;
  carrierId: string;
  carrierServiceTypeId: string;
  estimatedDeliveryDate: string;
  lineItems: LineItem[];
  status: 'draft' | 'submitted';
}

const mockMaterials = [
  { code: 'MAT-001', name: 'Steel Pipe 6"', uom: 'EA' },
  { code: 'MAT-002', name: 'Copper Wire 12AWG', uom: 'FT' },
  { code: 'MAT-003', name: 'Concrete Mix 80lb', uom: 'BAG' },
  { code: 'MAT-004', name: 'PVC Fitting 2"', uom: 'EA' }
];

const AutocompleteInput = ({ value, onChange, placeholder }: { value: string, onChange: (value: string) => void, placeholder: string }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: "us" }, // Restrict to US for now, can be dynamic
      fields: ['address_components', 'formatted_address']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        onChange(place.formatted_address);
      }
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
};


export function CreateOrderForm() {
  // Get client info for owner filtering
  const { ownerId } = useClientInfo();
  
  // Load projects from database
  const { projects, loading: projectsLoading, error: projectsError } = useProjectsForOrders(ownerId);
  
  // Load carriers from database
  const { carriers, loading: carriersLoading, error: carriersError } = useCarriersForOrders();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OrderFormData>({
    orderType: '',
    projectId: '',
    orderNumber: '',
    shipmentNumber: '',
    recipientName: '',
    recipientAddress: '',
    billingAccountName: '',
    billingAddress: '',
    carrierId: '',
    carrierServiceTypeId: '',
    estimatedDeliveryDate: '',
    lineItems: [],
    status: 'draft'
  });

  // Load carrier service types from database (filtered by selected carrier)
  const { serviceTypes, loading: serviceTypesLoading, error: serviceTypesError } = useCarrierServiceTypesForOrders(formData.carrierId);

  const [newLineItem, setNewLineItem] = useState<Partial<LineItem>>({
    materialCode: '',
    quantity: 1,
    uom: '',
    batchNumber: '',
    serialNumber: ''
  });

  // Validation functions for each step
  const isStep1Valid = () => {
    return !!(formData.orderType && 
           formData.projectId && 
           formData.recipientName && 
           formData.recipientAddress && 
           formData.billingAccountName && 
           formData.billingAddress && 
           formData.carrierId && 
           formData.carrierServiceTypeId);
  };

  const isStep2Valid = () => {
    return formData.lineItems.length > 0;
  };

  const canGoToStep = (step: number) => {
    if (step === 1) return true;
    if (step === 2) return isStep1Valid();
    if (step === 3) return isStep1Valid() && isStep2Valid();
    return false;
  };

  // Header controls
  const { setCenterContent, setRightContent } = useHeaderControls();

  // Auto-select first project when projects load
  useEffect(() => {
    if (projects.length > 0 && !formData.projectId && !projectsLoading) {
      setFormData(prev => ({ ...prev, projectId: projects[0].id }));
    }
  }, [projects, formData.projectId, projectsLoading]);

  // Effect to set header content
  useEffect(() => {
    setCenterContent(
      <OrderStepIndicator 
        currentStep={currentStep}
        canGoToStep={canGoToStep}
        onStepClick={handleStepClick}
      />
    );
    setRightContent(null);

    // Cleanup on unmount
    return () => {
      setCenterContent(null);
      setRightContent(null);
    };
  }, [currentStep, formData, setCenterContent, setRightContent]);

  const handleStepClick = (step: number) => {
    if (canGoToStep(step)) {
      setCurrentStep(step);
    }
  };

  const handleNext = () => {
    if (currentStep < 3 && canGoToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addLineItem = () => {
    if (!newLineItem.materialCode || !newLineItem.quantity) return;
    
    const material = mockMaterials.find(m => m.code === newLineItem.materialCode);
    if (!material) return;

    const lineItem: LineItem = {
      id: Date.now().toString(),
      materialCode: newLineItem.materialCode,
      materialName: material.name,
      quantity: newLineItem.quantity || 1,
      uom: newLineItem.uom || material.uom,
      batchNumber: newLineItem.batchNumber || undefined,
      serialNumber: newLineItem.serialNumber || undefined
    };

    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, lineItem]
    }));

    // Reset new line item
    setNewLineItem({
      materialCode: '',
      quantity: 1,
      uom: '',
      batchNumber: '',
      serialNumber: ''
    });
  };

  const removeLineItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }));
  };

  const handleSave = (status: 'draft' | 'submitted') => {
    const updatedData = { ...formData, status };
    console.log('Saving order:', updatedData);
    // TODO: Implement actual save logic
    alert(`Order ${status} successfully!`);
    
    if (status === 'submitted') {
      // Reset form after successful submission
      setFormData({
        orderType: '',
        projectId: '',
        orderNumber: '',
        shipmentNumber: '',
        recipientName: '',
        recipientAddress: '',
        billingAccountName: '',
        billingAddress: '',
        carrierId: '',
        carrierServiceTypeId: '',
        estimatedDeliveryDate: '',
        lineItems: [],
        status: 'draft'
      });
      setCurrentStep(1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Order Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Type & Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderType">Order Type *</Label>
                  <Select value={formData.orderType} onValueChange={(value: 'inbound' | 'outbound') => 
                    setFormData(prev => ({ ...prev, orderType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Inbound (Purchase Order)
                        </div>
                      </SelectItem>
                      <SelectItem value="outbound">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Outbound (Sales Order)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select 
                    value={formData.projectId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
                    disabled={currentStep > 2}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={projectsLoading ? "Loading..." : "Select project"} />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsLoading ? (
                        <SelectItem value="loading" disabled>Loading projects...</SelectItem>
                      ) : projectsError ? (
                        <SelectItem value="error" disabled>Error loading projects</SelectItem>
                      ) : projects.length === 0 ? (
                        <SelectItem value="empty" disabled>No projects found</SelectItem>
                      ) : (
                        projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {currentStep > 2 && (
                    <p className="text-xs text-muted-foreground">
                      Project cannot be changed after materials are selected
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
                    placeholder="Auto-generated if empty"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipmentNumber">Shipment Number</Label>
                  <Input
                    id="shipmentNumber"
                    value={formData.shipmentNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipmentNumber: e.target.value }))}
                    placeholder="Enter shipment number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {formData.orderType === 'inbound' ? 'Ship From' : 'Ship To'} Address
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name *</Label>
                    <Input
                      id="recipientName"
                      value={formData.recipientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                      placeholder="Enter recipient name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientAddress">Address *</Label>
                    <AutocompleteInput
                      value={formData.recipientAddress}
                      onChange={(value) => setFormData(prev => ({ ...prev, recipientAddress: value }))}
                      placeholder="Start typing an address..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Billing Address</h4>
                  <div className="space-y-2">
                    <Label htmlFor="billingAccountName">Billing Account Name *</Label>
                    <Input
                      id="billingAccountName"
                      value={formData.billingAccountName}
                      onChange={(e) => setFormData(prev => ({ ...prev, billingAccountName: e.target.value }))}
                      placeholder="Enter billing account name"
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="billingAddress">Billing Address *</Label>
                     <AutocompleteInput
                      value={formData.billingAddress}
                      onChange={(value) => setFormData(prev => ({ ...prev, billingAddress: value }))}
                      placeholder="Start typing an address..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier *</Label>
                  <Select value={formData.carrierId} onValueChange={(value) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      carrierId: value,
                      carrierServiceTypeId: '' // Reset service type when carrier changes
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder={carriersLoading ? "Loading..." : "Select carrier"} />
                    </SelectTrigger>
                    <SelectContent>
                      {carriersLoading ? (
                        <SelectItem value="loading" disabled>Loading carriers...</SelectItem>
                      ) : carriersError ? (
                        <SelectItem value="error" disabled>Error loading carriers</SelectItem>
                      ) : carriers.length === 0 ? (
                        <SelectItem value="empty" disabled>No carriers found</SelectItem>
                      ) : (
                        carriers.map(carrier => (
                          <SelectItem key={carrier.id} value={carrier.id}>
                            {carrier.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select 
                    value={formData.carrierServiceTypeId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, carrierServiceTypeId: value }))}
                    disabled={!formData.carrierId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.carrierId ? "Select carrier first" :
                        serviceTypesLoading ? "Loading..." : 
                        "Select service"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {!formData.carrierId ? (
                        <SelectItem value="no-carrier" disabled>Select a carrier first</SelectItem>
                      ) : serviceTypesLoading ? (
                        <SelectItem value="loading" disabled>Loading service types...</SelectItem>
                      ) : serviceTypesError ? (
                        <SelectItem value="error" disabled>Error loading service types</SelectItem>
                      ) : serviceTypes.length === 0 ? (
                        <SelectItem value="empty" disabled>No service types found</SelectItem>
                      ) : (
                        serviceTypes.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDeliveryDate">Estimated Delivery Date</Label>
                  <Input
                    id="estimatedDeliveryDate"
                    type="date"
                    value={formData.estimatedDeliveryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDeliveryDate: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Select Materials */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Select Materials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Selected Project</p>
                  <p className="text-lg">{projects.find(p => p.id === formData.projectId)?.name || 'No project selected'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Order Type</p>
                  <Badge variant={formData.orderType === 'inbound' ? 'default' : 'secondary'}>
                    {formData.orderType === 'inbound' ? 'Inbound' : 'Outbound'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 border border-dashed border-gray-300 rounded-lg">
              <h4 className="font-medium text-sm">Add Material</h4>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="materialCode">Material *</Label>
                  <Select value={newLineItem.materialCode} onValueChange={(value) => {
                    const material = mockMaterials.find(m => m.code === value);
                    setNewLineItem(prev => ({ 
                      ...prev, 
                      materialCode: value,
                      uom: material?.uom || prev.uom
                    }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockMaterials.map(material => (
                        <SelectItem key={material.code} value={material.code}>
                          <div>
                            <div className="font-medium">{material.code}</div>
                            <div className="text-sm text-muted-foreground">{material.name}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newLineItem.quantity || ''}
                    onChange={(e) => setNewLineItem(prev => ({ 
                      ...prev, 
                      quantity: parseInt(e.target.value) || 1 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="uom">UOM</Label>
                  <Input
                    id="uom"
                    value={newLineItem.uom || ''}
                    onChange={(e) => setNewLineItem(prev => ({ ...prev, uom: e.target.value }))}
                    placeholder="Unit"
                  />
                </div>

                <div>
                  <Label htmlFor="batch">Batch (Optional)</Label>
                  <Input
                    id="batch"
                    value={newLineItem.batchNumber || ''}
                    onChange={(e) => setNewLineItem(prev => ({ ...prev, batchNumber: e.target.value }))}
                    placeholder="Batch #"
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={addLineItem} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {formData.lineItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Materials List ({formData.lineItems.length})</h4>
                <div className="space-y-2">
                  {formData.lineItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium">{item.materialCode}</div>
                            <div className="text-sm text-muted-foreground">{item.materialName}</div>
                          </div>
                          <Badge variant="outline">
                            {item.quantity} {item.uom}
                          </Badge>
                          {item.batchNumber && (
                            <Badge variant="secondary">
                              Batch: {item.batchNumber}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.lineItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No materials added yet</p>
                <p className="text-sm">Add materials to continue to review</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Review Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Order Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant={formData.orderType === 'inbound' ? 'default' : 'secondary'}>
                      {formData.orderType === 'inbound' ? 'Inbound' : 'Outbound'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project:</span>
                    <span>{projects.find(p => p.id === formData.projectId)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Number:</span>
                    <span>{formData.orderNumber || 'Auto-generated'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipment Number:</span>
                    <span>{formData.shipmentNumber || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Shipping Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carrier:</span>
                    <span>{carriers.find(c => c.id === formData.carrierId)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span>{serviceTypes.find(s => s.id === formData.carrierServiceTypeId)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Delivery:</span>
                    <span>{formData.estimatedDeliveryDate || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">
                  {formData.orderType === 'inbound' ? 'Ship From' : 'Ship To'} Address
                </h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{formData.recipientName}</p>
                  <p className="text-muted-foreground whitespace-pre-line">{formData.recipientAddress}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Billing Address</h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{formData.billingAccountName}</p>
                  <p className="text-muted-foreground whitespace-pre-line">{formData.billingAddress}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Materials ({formData.lineItems.length})</h4>
              <div className="space-y-2">
                {formData.lineItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">{item.materialCode}</div>
                        <div className="text-sm text-muted-foreground">{item.materialName}</div>
                      </div>
                      <Badge variant="outline">
                        {item.quantity} {item.uom}
                      </Badge>
                      {item.batchNumber && (
                        <Badge variant="secondary">
                          Batch: {item.batchNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex items-center gap-4">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          Step {currentStep} of 3
          {currentStep === 2 && ` • ${formData.lineItems.length} materials added`}
        </div>

        <div className="flex items-center gap-2">
          {currentStep < 3 && (
            <Button 
              onClick={handleNext}
              disabled={!canGoToStep(currentStep + 1)}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {currentStep === 3 && (
            <>
              <Button 
                variant="outline" 
                onClick={() => handleSave('draft')}
              >
                Save as Draft
              </Button>
              <Button 
                onClick={() => handleSave('submitted')}
                disabled={!isStep1Valid() || !isStep2Valid()}
              >
                Submit Order
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
