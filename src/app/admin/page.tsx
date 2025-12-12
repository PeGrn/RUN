import { getAllUsers } from '@/actions/users';
import { UsersManagement } from '@/components/admin/users-management';
import { VmaStats } from '@/components/admin/vma-stats';
import { Shield, Users, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const result = await getAllUsers();

  if (!result.success) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Accès refusé</h1>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide">
                Administration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 sm:mb-3 md:mb-4">
              Tableau de bord Admin
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl">
              Statistiques de l&apos;équipe et gestion des utilisateurs
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Statistiques
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gestion des utilisateurs
              </TabsTrigger>
            </TabsList>

            {/* Onglet Statistiques */}
            <TabsContent value="stats" className="space-y-6">
              <VmaStats users={result.users || []} />
            </TabsContent>

            {/* Onglet Gestion des utilisateurs */}
            <TabsContent value="users" className="space-y-6">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{result.users?.length || 0} utilisateur(s) total</span>
                </div>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-2 text-xs sm:text-sm text-orange-600">
                  <span className="font-medium">
                    {result.users?.filter(u => u.status === 'pending').length || 0} en attente
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                  <span className="font-medium">
                    {result.users?.filter(u => u.status === 'approved').length || 0} approuvés
                  </span>
                </div>
              </div>

              <UsersManagement users={result.users || []} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
