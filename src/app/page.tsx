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
import { Header } from "@/components/header";

export default async function Home() {
  const auth = await getGarminAuth();

  return (
    <>
      <Header isAuthenticated={auth.isAuthenticated} />
      <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8">
        <div className="max-w-6xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Bienvenue sur Running Data
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Créez des plans d'entraînement personnalisés et suivez vos
              performances avec Garmin
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Card className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
              <Link href="/training" className="block h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Dumbbell className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">
                      Créer un entraînement
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-base">
                    Construisez des plans d'entraînement VMA personnalisés avec
                    notre outil intuitif de glisser-déposer. Exportez-les en PDF
                    pour les utiliser lors de vos séances.
                  </CardDescription>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Calcul automatique des allures VMA</p>
                    <p>• Interface drag & drop intuitive</p>
                    <p>• Export PDF pour vos entraînements</p>
                    <p>• Visualisation graphique des séances</p>
                  </div>
                  <Button className="w-full group-hover:translate-x-1 transition-transform">
                    Commencer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
              <Link
                href={auth.isAuthenticated ? "/dashboard" : "/login"}
                className="block h-full"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Activity className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">
                      Métriques Garmin
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-base">
                    {auth.isAuthenticated
                      ? "Accédez à vos données Garmin : activités, métriques, cartes et analyses détaillées de vos performances."
                      : "Connectez-vous à votre compte Garmin pour accéder à vos activités, métriques et analyses détaillées."}
                  </CardDescription>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Activités et historique complet</p>
                    <p>• Cartes et itinéraires détaillés</p>
                    <p>• Métriques de performance</p>
                    <p>• Stress et récupération</p>
                  </div>
                  <Button className="w-full group-hover:translate-x-1 transition-transform">
                    {auth.isAuthenticated ? "Voir le dashboard" : "Se connecter"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
