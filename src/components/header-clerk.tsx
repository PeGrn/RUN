"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Activity, Dumbbell, Home, Menu, History, CalendarDays, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { UserButton, useUser } from "@clerk/nextjs";
import type { UserRole, UserStatus } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function HeaderClerk() {
  const pathname = usePathname();
  const { user } = useUser();

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Récupérer les métadonnées de l'utilisateur
  const metadata = (user?.publicMetadata || {}) as Partial<{ role: UserRole; status: UserStatus }>;
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'pauletiennegrn@gmail.com';
  const isAdminUser = user?.emailAddresses[0]?.emailAddress === adminEmail;

  const role = isAdminUser ? 'admin' : (metadata.role || 'athlete');
  const status = isAdminUser ? 'approved' : (metadata.status || 'pending');

  // Déterminer si l'utilisateur est authentifié Garmin
  const isGarminAuthenticated = user?.publicMetadata?.garminAuthenticated === true;

  const NavLinks = ({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) => (
    <>
      <Link href="/" onClick={onNavigate}>
        <Button
          variant={isActive("/") ? "secondary" : "ghost"}
          size={mobile ? "lg" : "sm"}
          className={cn(
            mobile ? "w-full justify-start gap-3 text-base" : "gap-2 text-sm font-medium",
            isActive("/") && !mobile && "bg-secondary/50 text-secondary-foreground shadow-sm"
          )}
        >
          <Home className="h-4 w-4" />
          Accueil
        </Button>
      </Link>

      {/* Planning - accessible par tous les utilisateurs approuvés */}
      {status === 'approved' && (
        <Link href="/planning" onClick={onNavigate}>
          <Button
            variant={isActive("/planning") ? "secondary" : "ghost"}
            size={mobile ? "lg" : "sm"}
            className={cn(
              mobile ? "w-full justify-start gap-3 text-base" : "gap-2 text-sm font-medium",
              isActive("/planning") && !mobile && "bg-secondary/50 text-secondary-foreground shadow-sm"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Planning
          </Button>
        </Link>
      )}

      {/* Training - accessible par tous, mais fonctionnalités limitées pour les athlètes */}
      {status === 'approved' && (
        <Link href="/training" onClick={onNavigate}>
          <Button
            variant={isActive("/training") ? "secondary" : "ghost"}
            size={mobile ? "lg" : "sm"}
            className={cn(
              mobile ? "w-full justify-start gap-3 text-base" : "gap-2 text-sm font-medium",
              isActive("/training") && !mobile && "bg-secondary/50 text-secondary-foreground shadow-sm"
            )}
          >
            <Dumbbell className="h-4 w-4" />
            {mobile ? "Créer un entraînement" : "Entraînement"}
          </Button>
        </Link>
      )}

      {/* Sessions - uniquement pour les coachs et admins */}
      {status === 'approved' && (role === 'coach' || role === 'admin') && (
        <Link href="/sessions" onClick={onNavigate}>
          <Button
            variant={isActive("/sessions") ? "secondary" : "ghost"}
            size={mobile ? "lg" : "sm"}
            className={cn(
              mobile ? "w-full justify-start gap-3 text-base" : "gap-2 text-sm font-medium",
              isActive("/sessions") && !mobile && "bg-secondary/50 text-secondary-foreground shadow-sm"
            )}
          >
            <History className="h-4 w-4" />
            Historique
          </Button>
        </Link>
      )}

      {/* Dashboard Garmin - accessible par tous les utilisateurs approuvés */}
      {status === 'approved' && isGarminAuthenticated && (
        <Link href="/dashboard" onClick={onNavigate}>
          <Button
            variant={isActive("/dashboard") || pathname.startsWith("/activity") ? "secondary" : "ghost"}
            size={mobile ? "lg" : "sm"}
            className={cn(
              mobile ? "w-full justify-start gap-3 text-base" : "gap-2 text-sm font-medium",
              (isActive("/dashboard") || pathname.startsWith("/activity")) && !mobile && "bg-secondary/50 text-secondary-foreground shadow-sm"
            )}
          >
            <Activity className="h-4 w-4" />
            {mobile ? "Métriques Garmin" : "Métriques"}
          </Button>
        </Link>
      )}

      {/* Admin - uniquement pour les coachs et admins */}
      {status === 'approved' && (role === 'coach' || role === 'admin') && (
        <Link href="/admin" onClick={onNavigate}>
          <Button
            variant={isActive("/admin") ? "secondary" : "ghost"}
            size={mobile ? "lg" : "sm"}
            className={cn(
              mobile ? "w-full justify-start gap-3 text-base" : "gap-2 text-sm font-medium",
              isActive("/admin") && !mobile && "bg-secondary/50 text-secondary-foreground shadow-sm"
            )}
          >
            <Shield className="h-4 w-4" />
            {mobile ? "Administration" : "Admin"}
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo & Brand */}
          <Link href="/" className="group flex items-center gap-3 flex-shrink-0 transition-opacity hover:opacity-90">
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 transition-transform duration-300 group-hover:scale-105">
               <Image 
                 src="/LOGO_ASUL_BRON.png" 
                 alt="Logo ASUL Bron" 
                 fill
                 className="object-contain"
                 priority
               />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              ESL Team
            </span>
          </Link>

          {/* Desktop Navigation - Pill Shape */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/50 bg-background/50 px-3 py-1.5 shadow-sm backdrop-blur-sm">
            <NavLinks />
          </nav>

          {/* Desktop User Button */}
          <div className="hidden md:flex items-center gap-2">
            <UserButton 
                afterSignOutUrl="/"
                appearance={{
                    elements: {
                        avatarBox: "h-9 w-9 border border-border"
                    }
                }}
            />
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="flex-shrink-0 -mr-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l-border/50 bg-background/95 backdrop-blur-xl">
              <SheetHeader className="border-b border-border/50 pb-6 mb-6">
                <SheetTitle className="flex items-center gap-3">
                   <div className="relative h-8 w-8">
                    <Image 
                        src="/LOGO_ASUL_BRON.png" 
                        alt="Logo" 
                        fill
                        className="object-contain"
                    />
                  </div>
                  <span className="font-bold text-xl tracking-tight">ESL Team</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2">
                <SheetClose asChild>
                  <div className="flex flex-col gap-2">
                    <NavLinks mobile onNavigate={() => {}} />
                  </div>
                </SheetClose>

                <div className="pt-6 mt-6 border-t border-border/50 flex justify-center">
                  <UserButton 
                    afterSignOutUrl="/" 
                    showName={true}
                    appearance={{
                        elements: {
                            userButtonBox: "flex flex-row-reverse gap-2",
                            userButtonOuterIdentifier: "font-medium"
                        }
                    }}
                  />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}