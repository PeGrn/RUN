"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  Activity, 
  Dumbbell, 
  Home, 
  Menu, 
  History, 
  CalendarDays, 
  Shield, 
  LogOut, 
  X // Import de l'icône X pour fermer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  // SheetHeader et Title ne sont plus strictement nécessaires si on fait un menu full-top propre
} from "@/components/ui/sheet";
import { UserButton, useUser, useClerk } from "@clerk/nextjs";
import type { UserRole, UserStatus } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useState } from "react";

// --- 1. NavLinks (Inchangé) ---
interface NavLinksProps {
  mobile?: boolean;
  onNavigate?: () => void;
  role: string;
  status: string;
  isGarminAuthenticated: boolean;
}

const NavLinks = ({ 
  mobile = false, 
  onNavigate, 
  role, 
  status, 
  isGarminAuthenticated 
}: NavLinksProps) => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
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
};

// --- Composant Principal ---
export function HeaderClerk() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const metadata = (user?.publicMetadata || {}) as Partial<{ role: UserRole; status: UserStatus }>;
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'pauletiennegrn@gmail.com';
  const isAdminUser = user?.emailAddresses[0]?.emailAddress === adminEmail;

  const role = isAdminUser ? 'admin' : (metadata.role || 'athlete');
  const status = isAdminUser ? 'approved' : (metadata.status || 'pending');
  const isGarminAuthenticated = user?.publicMetadata?.garminAuthenticated === true;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    setIsOpen(false);
  };

  return (
    <header role="banner" className="fixed top-0 z-[100] w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3 flex-shrink-0 transition-opacity hover:opacity-90 z-[101]">
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
              ASUL Team
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-1 rounded-full border border-border/50 bg-background/50 px-3 py-1.5 shadow-sm backdrop-blur-sm">
            <NavLinks
              role={role}
              status={status}
              isGarminAuthenticated={isGarminAuthenticated}
            />
          </nav>

          {/* User Button Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <UserButton 
                afterSignOutUrl="/"
                userProfileMode="navigation"
                userProfileUrl="/user-profile"
                appearance={{
                    elements: {
                        avatarBox: "h-9 w-9 border border-border"
                    }
                }}
            />
          </div>

          {/* Mobile Menu Trigger & Sheet */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden z-[101]">
              <Button variant="ghost" size="icon" className="flex-shrink-0 -mr-2">
                {/* On change l'icône selon si c'est ouvert ou fermé */}
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            
            {/* side="top" : Le menu descend du haut.
                pt-[80px] : Laisse la place pour le header fixe (64px + marge) afin de ne pas cacher le logo.
            */}
            <SheetContent side="top" className="w-full pt-[80px] pb-6 border-b border-border/50 bg-background/95 backdrop-blur-xl">

              <nav aria-label="Navigation mobile" className="container mx-auto flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <NavLinks
                      mobile
                      onNavigate={() => setIsOpen(false)}
                      role={role}
                      status={status}
                      isGarminAuthenticated={isGarminAuthenticated}
                    />
                  </div>

                <div className="pt-4 border-t border-border/50 flex flex-col gap-4">
                  {user && (
                    <div className="flex flex-col gap-3">
                        <Link 
                            href="/user-profile" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors"
                        >
                            <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border">
                                <Image 
                                    src={user.imageUrl} 
                                    alt="Profile" 
                                    fill 
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-sm font-medium">{user.fullName || user.username}</span>
                                <span className="text-xs text-muted-foreground">Gérer mon compte</span>
                            </div>
                        </Link>
                        
                        <Button 
                            variant="outline" 
                            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={handleSignOut}
                        >
                            <LogOut className="h-4 w-4" />
                            Se déconnecter
                        </Button>
                    </div>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}