import { currentUser } from '@clerk/nextjs/server';
import { getUserMetadata } from '@/lib/auth';
import { Clock, UserCheck, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export default async function WaitingPage() {
  const user = await currentUser();
  const metadata = await getUserMetadata();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 sm:p-12 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Clock className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">
            Bienvenue {user?.firstName || 'Athlète'} !
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            Votre demande d&apos;accès est en cours de validation.
          </p>

          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <UserCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="font-semibold mb-2">Prochaines étapes</h3>
                <p className="text-sm text-muted-foreground">
                  Un coach ou administrateur doit approuver votre compte avant que vous puissiez accéder à l&apos;application.
                  Vous recevrez un email de confirmation une fois votre compte approuvé.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="font-semibold mb-2">Compte créé avec</h3>
                <p className="text-sm text-muted-foreground">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Un mail vous sera envoyé quand votre compte sera approuvé.
          </p>

          <SignOutButton>
            <Button variant="outline" size="lg">
              Se déconnecter
            </Button>
          </SignOutButton>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Statut actuel : <span className="font-semibold text-orange-600">En attente d&apos;approbation</span>
          </p>
        </div>
      </div>
    </div>
  );
}
