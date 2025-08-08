import { Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmployeeManagementPage() {
  return (
    <div className="p-6 md:p-8">
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center">
              <Wrench className="h-4 w-4" />
            </span>
            Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            <p>This section is under construction.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
