
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Trash2, Package, Truck, MapPin, CheckCircle, ArrowLeft, ArrowRight, Eye, CreditCard } from 'lucide-react';
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
import { saveOrder } from '@/app/actions';
import { useAuth } from '@/context/auth-context';

interface LineItem {
  id: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  uom: string;
  uomShort?: string;
  batchNumber?: string;
  serialNumber?: string;
  availableAmount?: number;
  licensePlate?: string;
  lot?: string;
}

interface AddressData {
  title: string;
  firstName: string;
  lastName: string;
  companyName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrderFormData {
  id?: number; // Add order ID to track existing orders
  orderType: 'inbound' | 'outbound' | '';
  projectId: string;
  orderNumber: string;
  referenceNumber: string;
  recipientAddress: AddressData;
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
  id,
  showErrors = false
}: { 
  value: AddressData, 
  onChange: (value: AddressData) => void, 
  label: string,
  id: string,
  showErrors?: boolean
}) => {
  const autocompleteRef = useRef<any>(null);
  const line1Ref = useRef<HTMLInputElement>(null);
  const savedValuesRef = useRef<AddressData>(value);
  
  // Always keep the latest values in the ref
  useEffect(() => {
    savedValuesRef.current = value;
  }, [value, id]);

  useEffect(() => {
    const initAutocomplete = () => {
      if (!line1Ref.current) {
        return;
      }
      if (!(window as any).google?.maps?.places) {
        return;
      }

      // Clear any existing autocomplete
      if (autocompleteRef.current) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }


      const autocomplete = new (window as any).google.maps.places.Autocomplete(line1Ref.current, {
        types: ['address'],
        componentRestrictions: { country: "us" },
        fields: ['address_components', 'formatted_address']
      });


      const handlePlaceChanged = () => {
        const place = autocomplete.getPlace();
        
        if (!place) {
          return;
        }
        
        if (!place.address_components) {
          return;
        }

        const components = place.address_components;
        
        // Parse Google Places components
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';
        let country = '';

        components.forEach((component: any) => {
          const types = component.types;
          
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
            country = component.short_name;
          }
        });

        // Use the saved values from ref instead of the current (potentially reset) value prop
        const savedValues = savedValuesRef.current;
        
        const newAddress: AddressData = {
          title: savedValues.title || '', // Keep existing title from saved ref
          firstName: savedValues.firstName || '', // Keep existing firstName from saved ref
          lastName: savedValues.lastName || '', // Keep existing lastName from saved ref
          companyName: savedValues.companyName || '', // Keep existing companyName from saved ref
          line1: `${streetNumber} ${route}`.trim(),
          line2: savedValues.line2 || '', // Keep existing line2 from saved ref
          city,
          state,
          zipCode,
          country
        };

        onChange(newAddress);
      };

      autocomplete.addListener('place_changed', handlePlaceChanged);
      autocompleteRef.current = autocomplete;
    };

    // Only initialize once when component mounts
    if ((window as any).google?.maps?.places) {
      initAutocomplete();
    } else {
      const checkGoogle = setInterval(() => {
        if ((window as any).google?.maps?.places) {
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

  const isShip = id === 'recipient' || label.toLowerCase().includes('ship');
  const chipClasses = isShip
    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : 'bg-violet-500/10 text-violet-700 dark:text-violet-300';
  const borderClasses = isShip ? 'border-emerald-300/70' : 'border-violet-300/70';

  // Simple required mapping for both address blocks
  const req = {
    firstName: !value.firstName,
    lastName: !value.lastName,
    line1: !value.line1,
    city: !value.city,
    state: !value.state,
    zipCode: !value.zipCode,
  };

  return (
    <div className={`space-y-3 pl-3 border-l-4 ${borderClasses} rounded-sm`}>
      <div className="flex items-center gap-2">
        <span className={`h-6 w-6 rounded-full inline-flex items-center justify-center ${chipClasses}`}>
          {isShip ? (
            <MapPin className="h-3.5 w-3.5" />
          ) : (
            <CreditCard className="h-3.5 w-3.5" />
          )}
        </span>
        <h4 className="font-semibold text-sm">{label}</h4>
      </div>
      
      {/* Name Fields */}
      <div className="space-y-3">
        {/* Title, First Name, Last Name in same row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`${id}-title`}>Title</Label>
            <Input
              id={`${id}-title`}
              value={value.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Mr/Mrs/Ms/Dr"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${id}-firstName`} className={showErrors && req.firstName ? 'text-red-600' : ''}>First Name *</Label>
            <Input
              id={`${id}-firstName`}
              value={value.firstName || ''}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              placeholder="First name"
              className={showErrors && req.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {showErrors && req.firstName && (
              <p className="text-xs text-red-600">Required</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${id}-lastName`} className={showErrors && req.lastName ? 'text-red-600' : ''}>Last Name *</Label>
            <Input
              id={`${id}-lastName`}
              value={value.lastName || ''}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              placeholder="Last name"
              className={showErrors && req.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {showErrors && req.lastName && (
              <p className="text-xs text-red-600">Required</p>
            )}
          </div>
        </div>
        
        {/* Company Name on separate row for more space */}
        <div className="space-y-2">
          <Label htmlFor={`${id}-companyName`}>Company Name</Label>
          <Input
            id={`${id}-companyName`}
            value={value.companyName || ''}
            onChange={(e) => handleFieldChange('companyName', e.target.value)}
            placeholder="Company (optional)"
          />
        </div>
        
        {/* Address Fields - Line 1 and Line 2 in same row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`${id}-line1`} className={showErrors && req.line1 ? 'text-red-600' : ''}>Address Line 1 *</Label>
            <Input
              ref={line1Ref}
              id={`${id}-line1`}
              value={value.line1 || ''}
              onChange={(e) => handleFieldChange('line1', e.target.value)}
              placeholder="Start typing an address..."
              autoComplete="off"
              className={showErrors && req.line1 ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {showErrors && req.line1 && (
              <p className="text-xs text-red-600">Required</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${id}-line2`}>Address Line 2</Label>
            <Input
              id={`${id}-line2`}
              value={value.line2 || ''}
              onChange={(e) => handleFieldChange('line2', e.target.value)}
              placeholder="Apt, Suite, Unit, etc. (optional)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`${id}-city`} className={showErrors && req.city ? 'text-red-600' : ''}>City *</Label>
            <Input
              id={`${id}-city`}
              value={value.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="City"
              className={showErrors && req.city ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {showErrors && req.city && (
              <p className="text-xs text-red-600">Required</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${id}-state`} className={showErrors && req.state ? 'text-red-600' : ''}>State *</Label>
            <Input
              id={`${id}-state`}
              value={value.state || ''}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              placeholder="State"
              maxLength={2}
              className={showErrors && req.state ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {showErrors && req.state && (
              <p className="text-xs text-red-600">Required</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${id}-zip`} className={showErrors && req.zipCode ? 'text-red-600' : ''}>ZIP Code *</Label>
            <Input
              id={`${id}-zip`}
              value={value.zipCode || ''}
              onChange={(e) => handleFieldChange('zipCode', e.target.value)}
              placeholder="ZIP Code"
              maxLength={10}
              className={showErrors && req.zipCode ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {showErrors && req.zipCode && (
              <p className="text-xs text-red-600">Required</p>
            )}
          </div>
        </div>
      </div>
  </div>
  );
};


export function CreateOrderForm({ editOrderNumber }: { editOrderNumber?: string }) {
  // Get client info for project filtering
  const { ownerId, projectIds } = useClientInfo();
  
  // Get authenticated user info
  const { user } = useAuth();
  
  // Toast notifications
  const { toast } = useToast();
  
  // Load allowed projects from database
  const { projects, loading: projectsLoading, error: projectsError } = useProjectsForOrders(projectIds);
  
  // Load carriers from database
  const { carriers, loading: carriersLoading, error: carriersError } = useCarriersForOrders();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showStep1Errors, setShowStep1Errors] = useState(false);
  const basicInfoRef = useRef<HTMLDivElement>(null);
  const addressesRef = useRef<HTMLDivElement>(null);
  const shippingRef = useRef<HTMLDivElement>(null);
  const [inlineSaveMessage, setInlineSaveMessage] = useState<string | null>(null);
  const [highlightOrderNumber, setHighlightOrderNumber] = useState(false);
  const savedHashRef = useRef<string>('');
  const showOrderNumberInlineOnceRef = useRef<boolean>(false);
  const computeFormHash = (fd: OrderFormData) => {
    return JSON.stringify({
      orderType: fd.orderType,
      projectId: fd.projectId,
      orderNumber: fd.orderNumber,
      referenceNumber: fd.referenceNumber,
      recipientAddress: fd.recipientAddress,
      billingAddress: fd.billingAddress,
      carrierId: fd.carrierId,
      carrierServiceTypeId: fd.carrierServiceTypeId,
      estimatedDeliveryDate: fd.estimatedDeliveryDate,
      lineItems: fd.lineItems.map(li => ({
        materialCode: li.materialCode,
        quantity: li.quantity,
        uom: li.uom,
        batchNumber: li.batchNumber,
        licensePlate: li.licensePlate,
        serialNumber: li.serialNumber
      }))
    });
  };
  const [formData, setFormData] = useState<OrderFormData>({
    id: undefined, // Track order ID for updates
    orderType: '',
    projectId: '',
    orderNumber: '',
    referenceNumber: '',
    recipientAddress: {
      title: '',
      firstName: '',
      lastName: '',
      companyName: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    billingAddress: {
      title: '',
      firstName: '',
      lastName: '',
      companyName: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    carrierId: '',
    carrierServiceTypeId: '',
    estimatedDeliveryDate: '',
    lineItems: [],
    status: 'draft'
  });
  // If editing an existing order, load it once ownerId is available
  useEffect(() => {
    async function loadForEdit() {
      if (!ownerId || !editOrderNumber) return;
      const { getPortalOrderForEdit } = await import('@/app/actions');
      try {
        const loaded = await getPortalOrderForEdit(ownerId, editOrderNumber);
  if (loaded) {
          setFormData({
            id: loaded.id,
            orderType: loaded.orderType,
            projectId: loaded.projectId,
            orderNumber: loaded.orderNumber,
            referenceNumber: loaded.referenceNumber || '',
            recipientAddress: loaded.recipientAddress,
            billingAddress: loaded.billingAddress,
            carrierId: loaded.carrierId || '',
            carrierServiceTypeId: loaded.carrierServiceTypeId || '',
            estimatedDeliveryDate: loaded.estimatedDeliveryDate || '',
            lineItems: loaded.lineItems as any,
            status: loaded.status
          });
          // Initialize saved hash to the loaded state (clean)
          savedHashRef.current = computeFormHash({
            id: loaded.id,
            orderType: loaded.orderType,
            projectId: loaded.projectId,
            orderNumber: loaded.orderNumber,
            referenceNumber: loaded.referenceNumber || '',
            recipientAddress: loaded.recipientAddress,
            billingAddress: loaded.billingAddress,
            carrierId: loaded.carrierId || '',
            carrierServiceTypeId: loaded.carrierServiceTypeId || '',
            estimatedDeliveryDate: loaded.estimatedDeliveryDate || '',
            lineItems: loaded.lineItems as any,
            status: loaded.status
          } as OrderFormData);
        }
      } catch (e) {
        console.error('Failed to load order for edit', e);
      }
    }
    loadForEdit();
  }, [ownerId, editOrderNumber]);

  // Load carrier service types from database (filtered by selected carrier)
  const { serviceTypes, loading: serviceTypesLoading, error: serviceTypesError } = useCarrierServiceTypesForOrders(formData.carrierId);

  // Load available inventory for outbound orders (filtered by allowed projects)
  const { inventory, loading: inventoryLoading, error: inventoryError } = useOutboundInventory(
    ownerId, 
    projectIds,
    formData.orderType === 'outbound' ? formData.projectId : undefined
  );

  const [newLineItem, setNewLineItem] = useState<Partial<LineItem>>({
    materialCode: '',
    quantity: undefined,
    uom: '',
    uomShort: '',
    batchNumber: '',
    serialNumber: '',
    licensePlate: ''
  });
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);

  // Load lots for selected material (for outbound orders, filtered by allowed projects)
  const { lots, loading: lotsLoading, error: lotsError } = useMaterialLots(
    ownerId,
    formData.orderType === 'outbound' && newLineItem.materialCode ? newLineItem.materialCode : '',
    projectIds,
    formData.orderType === 'outbound' ? formData.projectId : undefined
  );

  // Load license plates for selected material and lot (for outbound orders, filtered by allowed projects)
  const { licensePlates, loading: licensePlatesLoading, error: licensePlatesError } = useLicensePlates(
    ownerId,
    formData.orderType === 'outbound' && newLineItem.materialCode ? newLineItem.materialCode : '',
    projectIds,
    formData.orderType === 'outbound' ? formData.projectId : undefined,
    formData.orderType === 'outbound' && newLineItem.batchNumber ? newLineItem.batchNumber : undefined
  );

  // Validation functions for each step
  const isStep1Valid = () => {
    const isRecipientNameValid = formData.recipientAddress.firstName && 
                                formData.recipientAddress.lastName;
    
    const isRecipientAddressValid = formData.recipientAddress.line1 && 
                                   formData.recipientAddress.city && 
                                   formData.recipientAddress.state && 
                                   formData.recipientAddress.zipCode;
    
    const isBillingNameValid = formData.billingAddress.firstName && 
                              formData.billingAddress.lastName;
    
    const isBillingAddressValid = formData.billingAddress.line1 && 
                                 formData.billingAddress.city && 
                                 formData.billingAddress.state && 
                                 formData.billingAddress.zipCode;

    return !!(formData.orderType && 
           formData.projectId && 
           isRecipientNameValid &&
           isRecipientAddressValid &&
           isBillingNameValid && 
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

  // Build a human-readable list of missing fields for Step 1
  const getStep1MissingFields = (): string[] => {
    const missing: string[] = [];
    if (!formData.orderType) missing.push('Order Type');
    if (!formData.projectId) missing.push('Project');

    // Recipient
    if (!formData.recipientAddress.firstName) missing.push('Ship To: First Name');
    if (!formData.recipientAddress.lastName) missing.push('Ship To: Last Name');
    if (!formData.recipientAddress.line1) missing.push('Ship To: Address Line 1');
    if (!formData.recipientAddress.city) missing.push('Ship To: City');
    if (!formData.recipientAddress.state) missing.push('Ship To: State');
    if (!formData.recipientAddress.zipCode) missing.push('Ship To: ZIP Code');

    // Billing
    if (!formData.billingAddress.firstName) missing.push('Billing: First Name');
    if (!formData.billingAddress.lastName) missing.push('Billing: Last Name');
    if (!formData.billingAddress.line1) missing.push('Billing: Address Line 1');
    if (!formData.billingAddress.city) missing.push('Billing: City');
    if (!formData.billingAddress.state) missing.push('Billing: State');
    if (!formData.billingAddress.zipCode) missing.push('Billing: ZIP Code');

    // Shipping
    if (!formData.carrierId) missing.push('Carrier');
    if (!formData.carrierServiceTypeId) missing.push('Service Type');

    return missing;
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
    // Custom validation feedback on Step 1
    if (currentStep === 1 && !canGoToStep(2)) {
      setShowStep1Errors(true);
      const missing = getStep1MissingFields();
      // Friendly toast summary
      toast({
        variant: 'destructive',
        title: 'Missing required fields',
        description: missing.slice(0, 3).join(', ') + (missing.length > 3 ? `, and ${missing.length - 3} more...` : ''),
      });

      // Scroll to the most relevant section
      const basicFields = ['Order Type', 'Project'];
      const addressFields = missing.filter(m => m.startsWith('Ship To') || m.startsWith('Billing'));
      if (missing.some(m => basicFields.includes(m))) {
        basicInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (addressFields.length > 0) {
        addressesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        shippingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

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
        uomShort: inventoryItem.uom_short,
        batchNumber: newLineItem.batchNumber || undefined,
        serialNumber: newLineItem.serialNumber || undefined,
        licensePlate: newLineItem.licensePlate || undefined,
        availableAmount: inventoryItem.total_available_amount
      };

      setFormData(prev => ({
        ...prev,
        lineItems: [lineItem, ...prev.lineItems]
      }));
      setLastAddedItemId(lineItem.id);
      setTimeout(() => setLastAddedItemId(null), 1200);
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
        lineItems: [lineItem, ...prev.lineItems]
      }));
      setLastAddedItemId(lineItem.id);
      setTimeout(() => setLastAddedItemId(null), 1200);
    }

    // Reset new line item
    setNewLineItem({
      materialCode: '',
      quantity: undefined,
      uom: '',
      uomShort: '',
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

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (!ownerId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to determine client ownership. Please refresh and try again.",
      });
      return;
    }

    try {
      const userName = user?.displayName || user?.email || 'Unknown User';
      const result = await saveOrder(formData, formData.lineItems, ownerId, status, userName);
      
      if (result.success) {
        // Update order id after first save
        
        // Store the order ID for future updates
        if (!formData.id && result.orderId) {
          setFormData(prev => ({ ...prev, id: result.orderId }));
        }
        // If backend returned an order number, sync it and highlight once on first assignment
        let nextForm = formData;
        if (result.orderNumber && !formData.orderNumber) {
          nextForm = { ...formData, orderNumber: result.orderNumber! } as OrderFormData;
          setFormData(nextForm);
          setHighlightOrderNumber(true);
          setTimeout(() => setHighlightOrderNumber(false), 1800);
          // Allow showing order number inline only once
          showOrderNumberInlineOnceRef.current = true;
        }
        // Draft UX: no toast; show inline helper and disable Save until next edit
        if (status === 'draft') {
          setInlineSaveMessage('Draft saved');
          setTimeout(() => {
            setInlineSaveMessage(null);
            // After first inline show, never show number again
            showOrderNumberInlineOnceRef.current = false;
          }, 2500);
          // Mark form as clean (use the possibly updated form with order number)
          savedHashRef.current = computeFormHash(nextForm);
        }
        
        if (status === 'submitted') {
          // Reset form after successful submission
          setFormData({
            id: undefined,
            orderType: '',
            projectId: '',
            orderNumber: '',
            referenceNumber: '',
            recipientAddress: {
              title: '',
              firstName: '',
              lastName: '',
              companyName: '',
              line1: '',
              line2: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'US'
            },
            billingAddress: {
              title: '',
              firstName: '',
              lastName: '',
              companyName: '',
              line1: '',
              line2: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'US'
            },
            carrierId: '',
            carrierServiceTypeId: '',
            estimatedDeliveryDate: '',
            lineItems: [],
            status: 'draft'
          });
          setCurrentStep(1);
          savedHashRef.current = computeFormHash({
            id: undefined,
            orderType: '',
            projectId: '',
            orderNumber: '',
            referenceNumber: '',
            recipientAddress: {
              title: '', firstName: '', lastName: '', companyName: '', line1: '', line2: '', city: '', state: '', zipCode: '', country: 'US'
            },
            billingAddress: {
              title: '', firstName: '', lastName: '', companyName: '', line1: '', line2: '', city: '', state: '', zipCode: '', country: 'US'
            },
            carrierId: '', carrierServiceTypeId: '', estimatedDeliveryDate: '', lineItems: [], status: 'draft'
          } as any);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to save order. Please try again.",
        });
      }
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  // Determine if there are unsaved changes
  const currentHash = computeFormHash(formData);
  const isDirty = currentHash !== savedHashRef.current;

  return (
    <div className="space-y-6">
      {/* Step 1: Order Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card className="overflow-hidden" ref={basicInfoRef}>
            <CardHeader className="p-0">
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
              <div className="p-6">
                <CardTitle className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </span>
                  Order Type & Basic Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderType" className={showStep1Errors && !formData.orderType ? 'text-red-600' : ''}>Order Type *</Label>
                  <Select value={formData.orderType} onValueChange={(value: 'inbound' | 'outbound') => 
                    setFormData(prev => ({ ...prev, orderType: value }))
                  }>
                    <SelectTrigger className={showStep1Errors && !formData.orderType ? 'border-red-500 focus-visible:ring-red-500' : ''}>
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
                  <Label htmlFor="project" className={showStep1Errors && !formData.projectId ? 'text-red-600' : ''}>Project *</Label>
                  <Select 
                    value={formData.projectId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
                    disabled={currentStep > 2}
                  >
                    <SelectTrigger className={showStep1Errors && !formData.projectId ? 'border-red-500 focus-visible:ring-red-500' : ''}>
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
                    value={formData.orderNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
                    placeholder="Auto-generated if empty"
                    className={highlightOrderNumber ? 'ring-2 ring-emerald-400 animate-pulse' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number (PO Number)</Label>
                  <Input
                    id="referenceNumber"
                    value={formData.referenceNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    placeholder="Enter reference or PO number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden" ref={addressesRef}>
            <CardHeader className="p-0">
              <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-violet-400" />
              <div className="p-6">
                <CardTitle className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </span>
                  Addresses
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <AddressInput
                    id="recipient"
                    label={formData.orderType === 'inbound' ? 'Ship From Address' : 'Ship To Address'}
                    value={formData.recipientAddress}
                    onChange={(value) => setFormData(prev => ({ ...prev, recipientAddress: value }))}
                    showErrors={showStep1Errors && (
                      !formData.recipientAddress.firstName ||
                      !formData.recipientAddress.lastName ||
                      !formData.recipientAddress.line1 ||
                      !formData.recipientAddress.city ||
                      !formData.recipientAddress.state ||
                      !formData.recipientAddress.zipCode
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <AddressInput
                    id="billing"
                    label="Billing Name"
                    value={formData.billingAddress}
                    onChange={(value) => setFormData(prev => ({ ...prev, billingAddress: value }))}
                    showErrors={showStep1Errors && (
                      !formData.billingAddress.firstName ||
                      !formData.billingAddress.lastName ||
                      !formData.billingAddress.line1 ||
                      !formData.billingAddress.city ||
                      !formData.billingAddress.state ||
                      !formData.billingAddress.zipCode
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden" ref={shippingRef}>
            <CardHeader className="p-0">
              <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-400 to-slate-400" />
              <div className="p-6">
                <CardTitle className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 inline-flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </span>
                  Shipping Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier" className={showStep1Errors && !formData.carrierId ? 'text-red-600' : ''}>Carrier *</Label>
                  <Select value={formData.carrierId} onValueChange={(value) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      carrierId: value,
                      carrierServiceTypeId: '' // Reset service type when carrier changes
                    }))
                  }>
                    <SelectTrigger className={showStep1Errors && !formData.carrierId ? 'border-red-500 focus-visible:ring-red-500' : ''}>
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
                  <Label htmlFor="serviceType" className={showStep1Errors && !formData.carrierServiceTypeId ? 'text-red-600' : ''}>Service Type *</Label>
                  <Select 
                    value={formData.carrierServiceTypeId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, carrierServiceTypeId: value }))}
                    disabled={!formData.carrierId}
                  >
                    <SelectTrigger className={showStep1Errors && !formData.carrierServiceTypeId ? 'border-red-500 focus-visible:ring-red-500' : ''}>
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
                    value={formData.estimatedDeliveryDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDeliveryDate: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {showStep1Errors && !isStep1Valid() && (
            <Alert variant="destructive">
              <AlertTitle>Missing required fields</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1">
                  {getStep1MissingFields().map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Step 2: Select Materials */}
      {currentStep === 2 && (
        <Card className="overflow-hidden">
          <CardHeader className="p-0">
            <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-400" />
            <div className="p-6">
              <CardTitle className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 inline-flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </span>
                Select Materials
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-card/50">
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

            <div className="space-y-4 p-4 border border-dashed rounded-lg bg-card/50">
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
                        uom: inventoryItem?.uom || prev.uom,
                        uomShort: inventoryItem?.uom_short
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
                    <div key={item.id} className={`flex items-center justify-between p-3 border rounded-lg bg-card/50 ${lastAddedItemId === item.id ? 'ring-1 ring-green-300/70' : ''}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-medium">{item.materialCode}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{item.materialName}</span>
                          <Badge variant="outline">{item.quantity.toLocaleString()} {item.uom}</Badge>
                          {item.batchNumber && (
                            <Badge variant="secondary">Lot: {item.batchNumber}</Badge>
                          )}
                          {item.licensePlate && (
                            <Badge variant="secondary">LP: {item.licensePlate}</Badge>
                          )}
                        </div>
                        {formData.orderType === 'outbound' && item.availableAmount && (() => {
                          const inventoryItem = inventory.find(inv => inv.material_code === item.materialCode);
                          const currentRemainingQty = inventoryItem ? getRemainingQuantity(item.materialCode, inventoryItem.total_available_amount) : 0;
                          return (
                            <div className="text-xs text-muted-foreground mt-1">
                              Available: <span className="text-blue-600">{currentRemainingQty.toLocaleString()} {item.uom}</span>
                            </div>
                          );
                        })()}
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
        <Card className="overflow-hidden">
          <CardHeader className="p-0">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-slate-400 to-zinc-300 dark:from-indigo-400 dark:via-slate-600 dark:to-zinc-700" />
            <div className="p-6">
              <CardTitle className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </span>
                Review Order
              </CardTitle>
            </div>
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
                    <span className="text-muted-foreground">Reference Number:</span>
                    <span>{formData.referenceNumber || 'Not specified'}</span>
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
                  <p className="font-medium">
                    {formData.recipientAddress.title && `${formData.recipientAddress.title} `}
                    {formData.recipientAddress.firstName} {formData.recipientAddress.lastName}
                  </p>
                  {formData.recipientAddress.companyName && (
                    <p className="text-muted-foreground">{formData.recipientAddress.companyName}</p>
                  )}
                  <div className="text-muted-foreground">
                    <p>{formData.recipientAddress.line1}</p>
                    {formData.recipientAddress.line2 && <p>{formData.recipientAddress.line2}</p>}
                    <p>{formData.recipientAddress.city}, {formData.recipientAddress.state} {formData.recipientAddress.zipCode}</p>
                    <p>{formData.recipientAddress.country}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Billing Name</h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {formData.billingAddress.title && `${formData.billingAddress.title} `}
                    {formData.billingAddress.firstName} {formData.billingAddress.lastName}
                  </p>
                  {formData.billingAddress.companyName && (
                    <p className="text-muted-foreground">{formData.billingAddress.companyName}</p>
                  )}
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
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
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

      {/* Navigation - transparent footer with only buttons and step count */}
      <div className="pt-2">
        <div className="flex items-center justify-between p-4">
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
            {formData.orderNumber && ` • Order: ${formData.orderNumber}`}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 3 && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground min-w-[160px] text-right">
                    {inlineSaveMessage ? (
                      <>
                        {inlineSaveMessage}
                        {showOrderNumberInlineOnceRef.current && formData.orderNumber ? ` • ${formData.orderNumber}` : ''}
                      </>
                    ) : ''}
                  </span>
                  <Button 
                    variant="outline"
                    onClick={() => handleSave('draft')}
                    disabled={!isDirty}
                  >
                    Save as Draft
                  </Button>
                </div>
                <Button 
                  onClick={handleNext}
                  disabled={currentStep === 2 ? !canGoToStep(3) : false}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground min-w-[160px] text-right">
                    {inlineSaveMessage ? (
                      <>
                        {inlineSaveMessage}
                        {showOrderNumberInlineOnceRef.current && formData.orderNumber ? ` • ${formData.orderNumber}` : ''}
                      </>
                    ) : ''}
                  </span>
                  <Button 
                    variant="outline" 
                    onClick={() => handleSave('draft')}
                    disabled={!isDirty}
                  >
                    Save as Draft
                  </Button>
                </div>
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
    </div>
  );
}
