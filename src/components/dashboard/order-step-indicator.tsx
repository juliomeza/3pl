'use client';

import { Package, Plus, Eye, CheckCircle } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  icon: any;
}

interface OrderStepIndicatorProps {
  currentStep: number;
  canGoToStep: (step: number) => boolean;
  onStepClick: (step: number) => void;
}

const steps: Step[] = [
  { number: 1, title: 'Order Information', icon: Package },
  { number: 2, title: 'Select Materials', icon: Plus },
  { number: 3, title: 'Review & Submit', icon: Eye }
];

export function OrderStepIndicator({ currentStep, canGoToStep, onStepClick }: OrderStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div 
            className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors ${
              currentStep === step.number 
                ? 'bg-primary text-primary-foreground' 
                : canGoToStep(step.number)
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            onClick={() => onStepClick(step.number)}
          >
            {currentStep > step.number ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <step.icon className="w-5 h-5" />
            )}
            <span className="font-medium text-sm">{step.title}</span>
          </div>
          {index < steps.length - 1 && (
            <div className="w-12 h-px bg-border mx-4" />
          )}
        </div>
      ))}
    </div>
  );
}
