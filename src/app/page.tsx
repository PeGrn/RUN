import Link from "next/link";
import { getGarminAuth } from "@/actions/garmin";
import { Activity, Dumbbell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  const auth = await getGarminAuth();

  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8 sm:p-8">
        <div className="max-w-6xl w-full space-y-6 sm:space-y-8">
          <div className="text-center space-y-3 sm:space-y-4 px-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Bienvenue sur Running Data
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Créez des plans d'entraînement personnalisés et suivez vos
              performances avec Garmin
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mt-8 sm:mt-12">
            <Card className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary active:scale-[0.98]">
              <Link href="/training" className="block h-full">
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl">
                      Créer un entraînement
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <CardDescription className="text-sm sm:text-base leading-relaxed">
                    Construisez des plans d'entraînement VMA personnalisés avec
                    notre outil intuitif de glisser-déposer. Exportez-les en PDF
                    pour les utiliser lors de vos séances.
                  </CardDescription>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <p>• Calcul automatique des allures VMA</p>
                    <p>• Interface drag & drop intuitive</p>
                    <p>• Export PDF pour vos entraînements</p>
                    <p>• Visualisation graphique des séances</p>
                  </div>
                  <Button className="w-full group-hover:translate-x-1 transition-transform mt-4">
                    Commencer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary active:scale-[0.98]">
              <Link
                href={auth.isAuthenticated ? "/dashboard" : "/login"}
                className="block h-full"
              >
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl">
                      Métriques Garmin
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <CardDescription className="text-sm sm:text-base leading-relaxed">
                    {auth.isAuthenticated
                      ? "Accédez à vos données Garmin : activités, métriques, cartes et analyses détaillées de vos performances."
                      : "Connectez-vous à votre compte Garmin pour accéder à vos activités, métriques et analyses détaillées."}
                  </CardDescription>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <p>• Activités et historique complet</p>
                    <p>• Cartes et itinéraires détaillés</p>
                    <p>• Métriques de performance</p>
                    <p>• Stress et récupération</p>
                  </div>
                  <Button className="w-full group-hover:translate-x-1 transition-transform mt-4">
                    {auth.isAuthenticated ? "Voir le dashboard" : "Se connecter"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </main>
  );
}
