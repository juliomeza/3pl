
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
import { useOutboundInventory } from '@/hooks/use-outbound-inventory';
import { useMaterialLots } from '@/hooks/use-material-lots';
import { useLicensePlates } from '@/hooks/use-license-plates';
import { useToast } from '@/hooks/use-toast';

interface LineItem {
  id: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  uom: string;
  batchNumber?: string;
  serialNumber?: string;
  availableAmount?: number;
  licensePlate?: string;
  lot?: string;
}

interface AddressData {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrderFormData {
  orderType: 'inbound' | 'outbound' | '';
  projectId: string;
  orderNumber: string;
  shipmentNumber: string;
  recipientName: string;
  recipientAddress: AddressData;
  billingAccountName: string;
  billingAddress: AddressData;
  carrierId: string;
  carrierServiceTypeId: string;
  estimatedDeliveryDate: string;
  lineItems: LineItem[];
  status: 'draft' | 'submitted';
}


const AddressInput = ({ 
  value, 
  onChange, 
  label,
  id 
}: { 
  value: AddressData, 
  onChange: (value: AddressData) => void, 
  label: string,
  id: string
}) => {
  const autocompleteRef = useRef<any>(null);
  const line1Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initAutocomplete = () => {
      console.log('🚀 Initializing autocomplete for', id); // Debug log
      if (!line1Ref.current) {
        console.log('❌ No line1Ref.current'); 
        return;
      }
      if (!(window as any).google?.maps?.places) {
        console.log('❌ Google Maps Places not available');
        return;
      }

      // Clear any existing autocomplete
      if (autocompleteRef.current) {
        console.log('🧹 Clearing existing autocomplete');
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      console.log('✅ Creating Google Places Autocomplete'); // Debug log

      const autocomplete = new (window as any).google.maps.places.Autocomplete(line1Ref.current, {
        types: ['address'],
        componentRestrictions: { country: "us" },
        fields: ['address_components', 'formatted_address']
      });

      console.log('✅ Autocomplete created:', autocomplete); // Debug log

      const handlePlaceChanged = () => {
        console.log('🎯 PLACE CHANGED EVENT FIRED!'); // Debug log
        const place = autocomplete.getPlace();
        console.log('📍 Place selected:', place); // Debug log
        
        if (!place) {
          console.log('❌ No place object');
          return;
        }
        
        if (!place.address_components) {
          console.log('❌ No address_components in place');
          return;
        }

        const components = place.address_components;
        console.log('🏠 Address components:', components); // Debug log
        
        // Parse Google Places components
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';
        let country = '';

        components.forEach((component: any) => {
          const types = component.types;
          console.log('🔍 Component:', component.long_name, 'Types:', types); // Debug log
          
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          } else if (types.includes('route')) {
            route = component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (types.includes('postal_code')) {
            zipCode = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          }
        });

        const newAddress: AddressData = {
          line1: `${streetNumber} ${route}`.trim(),
          line2: value.line2, // Keep existing line2
          city,
          state,
          zipCode,
          country
        };

        console.log('🏡 New address data:', newAddress); // Debug log
        console.log('📞 Calling onChange...'); // Debug log
        onChange(newAddress);
        console.log('✅ onChange called!'); // Debug log
      };

      autocomplete.addListener('place_changed', handlePlaceChanged);
      console.log('👂 Event listener added'); // Debug log
      autocompleteRef.current = autocomplete;
    };

    // Only initialize once when component mounts
    console.log('🔍 Checking if Google Maps is available...');
    if ((window as any).google?.maps?.places) {
      console.log('✅ Google Maps available immediately');
      initAutocomplete();
    } else {
      console.log('⏳ Waiting for Google Maps to load...');
      const checkGoogle = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          console.log('✅ Google Maps loaded!');
          clearInterval(checkGoogle);
          initAutocomplete();
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }

    return () => {
      if ((window as any).google && autocompleteRef.current) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const handleFieldChange = (field: keyof AddressData, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">{label}</h4>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`${id}-line1`}>Address Line 1 *</Label>
          <Input
            ref={line1Ref}
            id={`${id}-line1`}
            value={value.line1}
            onChange={(e) => handleFieldChange('line1', e.target.value)}
            placeholder="Start typing an address..."
            autoComplete="off"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`${id}-line2`}>Address Line 2</Label>
          <Input
            id={`${id}-line2`}
            value={value.line2}
            onChange={(e) => handleFieldChange('line2', e.target.value)}
            placeholder="Apt, Suite, Unit, etc. (optional)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`${id}-city`}>City *</Label>
            <Input
              id={`${id}-city`}
              value={value.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="City"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${id}-state`}>State *</Label>
            <Input
              id={`${id}-state`}
              value={value.state}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              placeholder="State"
              maxLength={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${id}-zip`}>ZIP Code *</Label>
            <Input
              id={`${id}-zip`}
              value={value.zipCode}
              onChange={(e) => handleFieldChange('zipCode', e.target.value)}
              placeholder="ZIP Code"
              maxLength={10}
            />
          </div>
        </div>
      </div>
    </div>
  );
};


export function CreateOrderForm() {
  // Get client info for owner filtering
  const { ownerId } = useClientInfo();
  
  // Toast notifications
  const { toast } = useToast();
  
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
    recipientAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    billingAccountName: '',
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    carrierId: '',
    carrierServiceTypeId: '',
    estimatedDeliveryDate: '',
    lineItems: [],
    status: 'draft'
  });

  // Load carrier service types from database (filtered by selected carrier)
  const { serviceTypes, loading: serviceTypesLoading, error: serviceTypesError } = useCarrierServiceTypesForOrders(formData.carrierId);

  // Load available inventory for outbound orders (filtered by project)
  const { inventory, loading: inventoryLoading, error: inventoryError } = useOutboundInventory(
    ownerId, 
    formData.orderType === 'outbound' ? formData.projectId : undefined
  );

  const [newLineItem, setNewLineItem] = useState<Partial<LineItem>>({
    materialCode: '',
    quantity: undefined,
    uom: '',
    batchNumber: '',
    serialNumber: '',
    licensePlate: ''
  });

  // Load lots for selected material (for outbound orders)
  const { lots, loading: lotsLoading, error: lotsError } = useMaterialLots(
    ownerId,
    formData.orderType === 'outbound' && newLineItem.materialCode ? newLineItem.materialCode : undefined,
    formData.orderType === 'outbound' ? formData.projectId : undefined
  );

  // Load license plates for selected material and lot (for outbound orders)
  const { licensePlates, loading: licensePlatesLoading, error: licensePlatesError } = useLicensePlates(
    ownerId,
    formData.orderType === 'outbound' && newLineItem.materialCode ? newLineItem.materialCode : undefined,
    formData.orderType === 'outbound' && newLineItem.batchNumber ? newLineItem.batchNumber : undefined,
    formData.orderType === 'outbound' ? formData.projectId : undefined
  );

  // Validation functions for each step
  const isStep1Valid = () => {
    const isRecipientAddressValid = formData.recipientAddress.line1 && 
                                   formData.recipientAddress.city && 
                                   formData.recipientAddress.state && 
                                   formData.recipientAddress.zipCode;
    
    const isBillingAddressValid = formData.billingAddress.line1 && 
                                 formData.billingAddress.city && 
                                 formData.billingAddress.state && 
                                 formData.billingAddress.zipCode;

    return !!(formData.orderType && 
           formData.projectId && 
           formData.recipientName && 
           isRecipientAddressValid &&
           formData.billingAccountName && 
           isBillingAddressValid &&
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
    // Validate material code
    if (!newLineItem.materialCode) {
      toast({
        variant: "destructive",
        title: "Material Required",
        description: "Please select a material before adding to the order.",
      });
      return;
    }

    // Validate quantity
    if (!newLineItem.quantity || newLineItem.quantity <= 0) {
      toast({
        variant: "destructive",
        title: "Quantity Required",
        description: "Please enter a valid quantity greater than 0.",
      });
      return;
    }
    
    // For outbound orders, find material in inventory
    if (formData.orderType === 'outbound') {
      const inventoryItem = inventory.find(item => item.material_code === newLineItem.materialCode);
      if (!inventoryItem) return;

      // Check if requested quantity is available
      const requestedQty = newLineItem.quantity || 1;
      
      // Hierarchical validation: License Plate > Lot > Material
      if (newLineItem.licensePlate) {
        // If license plate is selected, validate against license plate-specific quantity
        const selectedLicensePlate = licensePlates.find(lp => lp.license_plate_code === newLineItem.licensePlate);
        if (selectedLicensePlate) {
          // Calculate remaining quantity for this specific license plate
          const usedFromLicensePlate = formData.lineItems
            .filter(item => item.materialCode === inventoryItem.material_code && item.licensePlate === newLineItem.licensePlate)
            .reduce((sum, item) => sum + item.quantity, 0);
          
          const remainingLicensePlateQty = Math.max(0, selectedLicensePlate.total_available_amount - usedFromLicensePlate);
          
          if (requestedQty > remainingLicensePlateQty) {
            toast({
              variant: "destructive",
              title: "Insufficient License Plate Inventory",
              description: `Only ${remainingLicensePlateQty.toLocaleString()} ${inventoryItem.uom} remaining in license plate ${newLineItem.licensePlate}${usedFromLicensePlate > 0 ? ` (${usedFromLicensePlate.toLocaleString()} already used from this license plate)` : ''}`,
            });
            return;
          }
        }
      } else if (newLineItem.batchNumber) {
        // If lot is selected but no license plate, validate against lot-specific quantity
        const selectedLot = lots.find(lot => lot.lot_code === newLineItem.batchNumber);
        if (selectedLot) {
          // Calculate remaining quantity for this specific lot
          const usedFromLot = formData.lineItems
            .filter(item => item.materialCode === inventoryItem.material_code && item.batchNumber === newLineItem.batchNumber)
            .reduce((sum, item) => sum + item.quantity, 0);
          
          const remainingLotQty = Math.max(0, selectedLot.total_available_amount - usedFromLot);
          
          if (requestedQty > remainingLotQty) {
            toast({
              variant: "destructive",
              title: "Insufficient Lot Inventory",
              description: `Only ${remainingLotQty.toLocaleString()} ${inventoryItem.uom} remaining in lot ${newLineItem.batchNumber}${usedFromLot > 0 ? ` (${usedFromLot.toLocaleString()} already used from this lot)` : ''}`,
            });
            return;
          }
        }
      } else {
        // If no lot or license plate selected, validate against total material quantity
        const remainingQty = getRemainingQuantity(inventoryItem.material_code, inventoryItem.total_available_amount);
        
        if (requestedQty > remainingQty) {
          const usedQty = inventoryItem.total_available_amount - remainingQty;
          toast({
            variant: "destructive",
            title: "Insufficient Inventory",
            description: `Only ${remainingQty.toLocaleString()} ${inventoryItem.uom} remaining for ${inventoryItem.material_code}${usedQty > 0 ? ` (${usedQty.toLocaleString()} already used in this order)` : ''}`,
          });
          return;
        }
      }

      const lineItem: LineItem = {
        id: Date.now().toString(),
        materialCode: newLineItem.materialCode,
        materialName: inventoryItem.material_name,
        quantity: requestedQty,
        uom: newLineItem.uom || inventoryItem.uom,
        batchNumber: newLineItem.batchNumber || undefined,
        serialNumber: newLineItem.serialNumber || undefined,
        licensePlate: newLineItem.licensePlate || undefined,
        availableAmount: inventoryItem.total_available_amount
      };

      setFormData(prev => ({
        ...prev,
        lineItems: [...prev.lineItems, lineItem]
      }));

      toast({
        title: "Material Added",
        description: `${lineItem.quantity} ${lineItem.uom} of ${lineItem.materialCode} added to order`,
      });
    } else {
      // For inbound orders, we'll handle this later (no inventory check needed)
      const lineItem: LineItem = {
        id: Date.now().toString(),
        materialCode: newLineItem.materialCode,
        materialName: newLineItem.materialCode, // For now, use code as name for inbound
        quantity: newLineItem.quantity || 1,
        uom: newLineItem.uom || 'EA',
        batchNumber: newLineItem.batchNumber || undefined,
        serialNumber: newLineItem.serialNumber || undefined
      };

      setFormData(prev => ({
        ...prev,
        lineItems: [...prev.lineItems, lineItem]
      }));
    }

    // Reset new line item
    setNewLineItem({
      materialCode: '',
      quantity: undefined,
      uom: '',
      batchNumber: '',
      serialNumber: '',
      licensePlate: ''
    });
  };

  const removeLineItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }));
  };

  // Calculate remaining available quantity for a material considering already added line items
  const getRemainingQuantity = (materialCode: string, totalAvailable: number): number => {
    const usedQuantity = formData.lineItems
      .filter(item => item.materialCode === materialCode)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    return Math.max(0, totalAvailable - usedQuantity);
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
        recipientAddress: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        },
        billingAccountName: '',
        billingAddress: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        },
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name *</Label>
                    <Input
                      id="recipientName"
                      value={formData.recipientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                      placeholder="Enter recipient name"
                    />
                  </div>
                  <AddressInput
                    id="recipient"
                    label={formData.orderType === 'inbound' ? 'Ship From Address' : 'Ship To Address'}
                    value={formData.recipientAddress}
                    onChange={(value) => setFormData(prev => ({ ...prev, recipientAddress: value }))}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingAccountName">Billing Account Name *</Label>
                    <Input
                      id="billingAccountName"
                      value={formData.billingAccountName}
                      onChange={(e) => setFormData(prev => ({ ...prev, billingAccountName: e.target.value }))}
                      placeholder="Enter billing account name"
                    />
                  </div>
                  <AddressInput
                    id="billing"
                    label="Billing Address"
                    value={formData.billingAddress}
                    onChange={(value) => setFormData(prev => ({ ...prev, billingAddress: value }))}
                  />
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
              <div className="grid grid-cols-1 md:grid-cols-10 gap-3">
                <div className="md:col-span-3">
                  <Label htmlFor="materialCode">Material *</Label>
                  <Select value={newLineItem.materialCode} onValueChange={(value) => {
                    if (formData.orderType === 'outbound') {
                      const inventoryItem = inventory.find(item => item.material_code === value);
                      setNewLineItem(prev => ({ 
                        ...prev, 
                        materialCode: value,
                        uom: inventoryItem?.uom || prev.uom
                      }));
                    } else {
                      // For inbound, just set the code
                      setNewLineItem(prev => ({ 
                        ...prev, 
                        materialCode: value
                      }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        formData.orderType === 'outbound' 
                          ? (inventoryLoading ? "Loading inventory..." : "Select material")
                          : "Enter material code"
                      }>
                        {newLineItem.materialCode && formData.orderType === 'outbound' && (() => {
                          const selectedItem = inventory.find(item => item.material_code === newLineItem.materialCode);
                          const truncatedDescription = selectedItem?.material_description && selectedItem.material_description.length > 18 
                            ? selectedItem.material_description.substring(0, 18) + '...'
                            : selectedItem?.material_description;
                          
                          const remainingQty = selectedItem ? getRemainingQuantity(selectedItem.material_code, selectedItem.total_available_amount) : 0;
                          
                          return (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{newLineItem.materialCode}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {truncatedDescription}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-blue-600 text-xs">
                                {remainingQty.toLocaleString()} {selectedItem?.uom}
                              </span>
                            </div>
                          );
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {formData.orderType === 'outbound' ? (
                        inventoryLoading ? (
                          <SelectItem value="loading" disabled>Loading inventory...</SelectItem>
                        ) : inventoryError ? (
                          <SelectItem value="error" disabled>Error loading inventory</SelectItem>
                        ) : inventory.length === 0 ? (
                          <SelectItem value="empty" disabled>No inventory available</SelectItem>
                        ) : (
                          inventory.map(item => {
                            const remainingQty = getRemainingQuantity(item.material_code, item.total_available_amount);
                            const usedQty = item.total_available_amount - remainingQty;
                            
                            return (
                              <SelectItem key={item.material_code} value={item.material_code}>
                                <div>
                                  <div className="font-medium">{item.material_code}</div>
                                  <div className="text-sm text-muted-foreground">{item.material_description}</div>
                                  <div className="text-xs text-blue-600">
                                    Available: {remainingQty.toLocaleString()} {item.uom}
                                    {usedQty > 0 && (
                                      <span className="text-orange-600 ml-1">
                                        ({usedQty.toLocaleString()} used)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })
                        )
                      ) : (
                        <SelectItem value="manual" disabled>Enter material code manually below</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {formData.orderType === 'inbound' && (
                    <Input
                      className="mt-2"
                      placeholder="Enter material code"
                      value={newLineItem.materialCode || ''}
                      onChange={(e) => setNewLineItem(prev => ({ 
                        ...prev, 
                        materialCode: e.target.value 
                      }))}
                    />
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="lot">Lot (Optional)</Label>
                  {formData.orderType === 'outbound' && newLineItem.materialCode ? (
                    <Select 
                      value={newLineItem.batchNumber || ''} 
                      onValueChange={(value) => setNewLineItem(prev => ({ ...prev, batchNumber: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          lotsLoading ? "Loading lots..." : "Select lot"
                        }>
                          {newLineItem.batchNumber && (() => {
                            const selectedLot = lots.find(lot => lot.lot_code === newLineItem.batchNumber);
                            if (!selectedLot) return null;
                            
                            // Calculate remaining quantity for this specific lot
                            const usedFromLot = formData.lineItems
                              .filter(item => item.materialCode === newLineItem.materialCode && item.batchNumber === selectedLot.lot_code)
                              .reduce((sum, item) => sum + item.quantity, 0);
                            
                            const remainingLotQty = Math.max(0, selectedLot.total_available_amount - usedFromLot);
                            
                            return (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{selectedLot.lot_code}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-blue-600 text-xs">
                                  {remainingLotQty.toLocaleString()} {selectedLot.uom}
                                </span>
                              </div>
                            );
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {lotsLoading ? (
                          <SelectItem value="loading" disabled>Loading lots...</SelectItem>
                        ) : lotsError ? (
                          <SelectItem value="error" disabled>Error loading lots</SelectItem>
                        ) : lots.length === 0 ? (
                          <SelectItem value="empty" disabled>No lots available</SelectItem>
                        ) : (
                          lots.map(lot => {
                            // Calculate used quantity for this specific lot
                            const usedFromLot = formData.lineItems
                              .filter(item => item.materialCode === newLineItem.materialCode && item.batchNumber === lot.lot_code)
                              .reduce((sum, item) => sum + item.quantity, 0);
                            
                            const remainingLotQty = Math.max(0, lot.total_available_amount - usedFromLot);
                            
                            return (
                              <SelectItem key={lot.lot_code} value={lot.lot_code}>
                                <div>
                                  <div className="font-medium">{lot.lot_code}</div>
                                  <div className="text-xs text-blue-600">
                                    Available: {remainingLotQty.toLocaleString()} {lot.uom}
                                    {usedFromLot > 0 && (
                                      <span className="text-orange-600 ml-1">
                                        ({usedFromLot.toLocaleString()} used)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="lot"
                      value={newLineItem.batchNumber || ''}
                      onChange={(e) => setNewLineItem(prev => ({ ...prev, batchNumber: e.target.value }))}
                      placeholder="Lot #"
                    />
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="licensePlate">License Plate (Optional)</Label>
                  {formData.orderType === 'outbound' && newLineItem.materialCode ? (
                    <Select 
                      value={newLineItem.licensePlate || ''} 
                      onValueChange={(value) => setNewLineItem(prev => ({ ...prev, licensePlate: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          licensePlatesLoading ? "Loading license plates..." : "Select license plate"
                        }>
                          {newLineItem.licensePlate && (() => {
                            const selectedLicensePlate = licensePlates.find(lp => lp.license_plate_code === newLineItem.licensePlate);
                            if (!selectedLicensePlate) return null;
                            
                            // Calculate remaining quantity for this specific license plate
                            const usedFromLicensePlate = formData.lineItems
                              .filter(item => item.materialCode === newLineItem.materialCode && item.licensePlate === selectedLicensePlate.license_plate_code)
                              .reduce((sum, item) => sum + item.quantity, 0);
                            
                            const remainingLicensePlateQty = Math.max(0, selectedLicensePlate.total_available_amount - usedFromLicensePlate);
                            
                            return (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{selectedLicensePlate.license_plate_code}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-blue-600 text-xs">
                                  {remainingLicensePlateQty.toLocaleString()} {selectedLicensePlate.uom}
                                </span>
                              </div>
                            );
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {licensePlatesLoading ? (
                          <SelectItem value="loading" disabled>Loading license plates...</SelectItem>
                        ) : licensePlatesError ? (
                          <SelectItem value="error" disabled>Error loading license plates</SelectItem>
                        ) : licensePlates.length === 0 ? (
                          <SelectItem value="empty" disabled>No license plates available</SelectItem>
                        ) : (
                          licensePlates.map(licensePlate => {
                            // Calculate used quantity for this specific license plate
                            const usedFromLicensePlate = formData.lineItems
                              .filter(item => item.materialCode === newLineItem.materialCode && item.licensePlate === licensePlate.license_plate_code)
                              .reduce((sum, item) => sum + item.quantity, 0);
                            
                            const remainingLicensePlateQty = Math.max(0, licensePlate.total_available_amount - usedFromLicensePlate);
                            
                            return (
                              <SelectItem key={licensePlate.license_plate_code} value={licensePlate.license_plate_code}>
                                <div>
                                  <div className="font-medium">{licensePlate.license_plate_code}</div>
                                  <div className="text-xs text-blue-600">
                                    Available: {remainingLicensePlateQty.toLocaleString()} {licensePlate.uom}
                                    {usedFromLicensePlate > 0 && (
                                      <span className="text-orange-600 ml-1">
                                        ({usedFromLicensePlate.toLocaleString()} used)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="licensePlate"
                      value={newLineItem.licensePlate || ''}
                      onChange={(e) => setNewLineItem(prev => ({ ...prev, licensePlate: e.target.value }))}
                      placeholder="License Plate #"
                    />
                  )}
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
                      quantity: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Enter quantity"
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

                <div className="flex items-end justify-end">
                  <Button
                    onClick={addLineItem}
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-full p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Plus className="w-5 h-5" />
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
                            {formData.orderType === 'outbound' && item.availableAmount && (() => {
                              const inventoryItem = inventory.find(inv => inv.material_code === item.materialCode);
                              const currentRemainingQty = inventoryItem ? getRemainingQuantity(item.materialCode, inventoryItem.total_available_amount) : 0;
                              
                              return (
                                <div className="text-xs text-blue-600">
                                  Available: {currentRemainingQty.toLocaleString()} {item.uom}
                                </div>
                              );
                            })()}
                          </div>
                          <Badge variant="outline">
                            {item.quantity.toLocaleString()} {item.uom}
                          </Badge>
                          {item.batchNumber && (
                            <Badge variant="secondary">
                              Lot: {item.batchNumber}
                            </Badge>
                          )}
                          {item.licensePlate && (
                            <Badge variant="secondary">
                              LP: {item.licensePlate}
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
                  <div className="text-muted-foreground">
                    <p>{formData.recipientAddress.line1}</p>
                    {formData.recipientAddress.line2 && <p>{formData.recipientAddress.line2}</p>}
                    <p>{formData.recipientAddress.city}, {formData.recipientAddress.state} {formData.recipientAddress.zipCode}</p>
                    <p>{formData.recipientAddress.country}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Billing Address</h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{formData.billingAccountName}</p>
                  <div className="text-muted-foreground">
                    <p>{formData.billingAddress.line1}</p>
                    {formData.billingAddress.line2 && <p>{formData.billingAddress.line2}</p>}
                    <p>{formData.billingAddress.city}, {formData.billingAddress.state} {formData.billingAddress.zipCode}</p>
                    <p>{formData.billingAddress.country}</p>
                  </div>
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
                        {formData.orderType === 'outbound' && item.availableAmount && (() => {
                          const inventoryItem = inventory.find(inv => inv.material_code === item.materialCode);
                          const currentRemainingQty = inventoryItem ? getRemainingQuantity(item.materialCode, inventoryItem.total_available_amount) : 0;
                          
                          return (
                            <div className="text-xs text-blue-600">
                              Available: {currentRemainingQty.toLocaleString()} {item.uom}
                            </div>
                          );
                        })()}
                      </div>
                      <Badge variant="outline">
                        {item.quantity.toLocaleString()} {item.uom}
                      </Badge>
                      {item.batchNumber && (
                        <Badge variant="secondary">
                          Lot: {item.batchNumber}
                        </Badge>
                      )}
                      {item.licensePlate && (
                        <Badge variant="secondary">
                          LP: {item.licensePlate}
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
