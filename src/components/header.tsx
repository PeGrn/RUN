"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Dumbbell, Home, LogIn, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
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

  const NavLinks = ({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) => (
    <>
      <Link href="/" onClick={onNavigate}>
        <Button
          variant={isActive("/") ? "default" : "ghost"}
          size={mobile ? "lg" : "sm"}
          className={mobile ? "w-full justify-start gap-3" : "gap-2"}
        >
          <Home className="h-4 w-4" />
          Accueil
        </Button>
      </Link>

      <Link href="/training" onClick={onNavigate}>
        <Button
          variant={isActive("/training") ? "default" : "ghost"}
          size={mobile ? "lg" : "sm"}
          className={mobile ? "w-full justify-start gap-3" : "gap-2"}
        >
          <Dumbbell className="h-4 w-4" />
          {mobile ? "Créer un entraînement" : "Entraînement"}
        </Button>
      </Link>

      {isAuthenticated ? (
        <Link href="/dashboard" onClick={onNavigate}>
          <Button
            variant={
              isActive("/dashboard") || pathname.startsWith("/activity")
                ? "default"
                : "ghost"
            }
            size={mobile ? "lg" : "sm"}
            className={mobile ? "w-full justify-start gap-3" : "gap-2"}
          >
            <Activity className="h-4 w-4" />
            {mobile ? "Métriques Garmin" : "Métriques"}
          </Button>
        </Link>
      ) : (
        <Link href="/login" onClick={onNavigate}>
          <Button
            variant={isActive("/login") ? "default" : "ghost"}
            size={mobile ? "lg" : "sm"}
            className={mobile ? "w-full justify-start gap-3" : "gap-2"}
          >
            <LogIn className="h-4 w-4" />
            {mobile ? "Connexion Garmin" : "Connexion"}
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="font-bold text-base sm:text-lg">Running Data</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLinks />
          </nav>

          {/* Desktop Logout Button */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-2">
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

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Running Data
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-8">
                <SheetClose asChild>
                  <div className="flex flex-col gap-2">
                    <NavLinks mobile onNavigate={() => {}} />
                  </div>
                </SheetClose>

                {isAuthenticated && (
                  <div className="pt-4 mt-4 border-t">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleLogout}
                      disabled={loading}
                      className="w-full justify-start gap-3"
                    >
                      <LogOut className="h-4 w-4" />
                      {loading ? "Déconnexion..." : "Déconnexion"}
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
