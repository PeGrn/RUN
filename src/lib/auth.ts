import { auth, currentUser } from '@clerk/nextjs/server';

// Types pour les rôles et statuts
export type UserRole = 'athlete' | 'coach' | 'admin';
export type UserStatus = 'pending' | 'approved';

export interface UserMetadata {
  role: UserRole;
  status: UserStatus;
}

// Email de l'admin configuré
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'pauletiennegrn@gmail.com';

/**
 * Récupère les métadonnées de l'utilisateur connecté
 */
export async function getUserMetadata(): Promise<UserMetadata | null> {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  // Si c'est l'admin, on le définit automatiquement
  if (user.emailAddresses[0]?.emailAddress === ADMIN_EMAIL) {
    return {
      role: 'admin',
      status: 'approved',
    };
  }

  const metadata = user.publicMetadata as Partial<UserMetadata>;

  // Par défaut : athlete pending
  return {
    role: metadata.role || 'athlete',
    status: metadata.status || 'pending',
  };
}

/**
 * Vérifie si l'utilisateur est approuvé
 */
export async function isUserApproved(): Promise<boolean> {
  const metadata = await getUserMetadata();
  return metadata?.status === 'approved';
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const metadata = await getUserMetadata();
  return metadata?.role === role;
}

/**
 * Vérifie si l'utilisateur a au moins un des rôles spécifiés
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const metadata = await getUserMetadata();
  return metadata ? roles.includes(metadata.role) : false;
}

/**
 * Vérifie si l'utilisateur est admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Vérifie si l'utilisateur est coach ou admin
 */
export async function isCoachOrAdmin(): Promise<boolean> {
  return hasAnyRole(['coach', 'admin']);
}

/**
 * Récupère l'ID de l'utilisateur connecté
 */
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
