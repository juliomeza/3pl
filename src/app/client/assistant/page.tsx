'use client';

import SharedAssistantPage from '@/components/dashboard/shared-assistant-page';
import { useHeaderControls } from '../layout';

export default function ClientAssistantPage() {
  const { setLeftContent, setRightContent } = useHeaderControls();

  return (
    <SharedAssistantPage 
      role="client"
      onLeftContentChange={setLeftContent}
      onRightContentChange={setRightContent}
    />
  );
}
