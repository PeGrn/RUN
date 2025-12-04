"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Dumbbell, Home, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutFromGarmin } from "@/actions/garmin";
import { useState } from "react";

interface HeaderProps {
  isAuthenticated?: boolean;
}

export function Header({ isAuthenticated = false }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleLogout = async () => {
    setLoading(true);
    await logoutFromGarmin();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6" />
            <span className="font-bold text-lg">Running Data</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Accueil
              </Button>
            </Link>

            <Link href="/training">
              <Button
                variant={isActive("/training") ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Dumbbell className="h-4 w-4" />
                Créer un entraînement
              </Button>
            </Link>

            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button
                  variant={
                    isActive("/dashboard") || pathname.startsWith("/activity")
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  className="gap-2"
                >
                  <Activity className="h-4 w-4" />
                  Métriques Garmin
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  variant={isActive("/login") ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Connexion Garmin
                </Button>
              </Link>
            )}
          </nav>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {loading ? "Déconnexion..." : "Déconnexion"}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
