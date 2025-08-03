'use client';

import SharedAssistantPage from '@/components/dashboard/shared-assistant-page';
import { useHeaderControls } from '../layout';

export default function EmployeeAssistantPage() {
  const { setLeftContent, setRightContent } = useHeaderControls();

  return (
    <SharedAssistantPage 
      role="employee"
      onLeftContentChange={setLeftContent}
      onRightContentChange={setRightContent}
    />
  );
}
