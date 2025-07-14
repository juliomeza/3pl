
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun } from 'lucide-react';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    const user = await signInWithGoogle();
    if (user) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Sun className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="font-headline text-2xl">Log in to LogiFlow</CardTitle>
          <CardDescription>
            Choose a provider below to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 62.3l-66.5 64.6C305.5 99.6 280.5 87 248 87c-73.2 0-133.1 60-133.1 133.1s59.9 133.1 133.1 133.1c76.1 0 124.3-54.4 128.6-109.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
            Sign in with Google
          </Button>
          <Button variant="outline" className="w-full" disabled>
             <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="microsoft" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M0 32h192v192H0V32zm0 256h192v192H0V288zM256 32h192v192H256V32zm0 256h192v192H256V288z"></path></svg>
            Sign in with Microsoft (soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
