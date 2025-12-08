'use server';

import { clerkClient, auth } from '@clerk/nextjs/server';
import { isAdmin, isCoachOrAdmin } from '@/lib/auth';
import type { UserRole, UserStatus } from '@/lib/auth';
import { resend, FROM_EMAIL } from '@/lib/resend';
import ApprovalEmail from '@/emails/approval-email';
import { revalidatePath } from 'next/cache';

export interface UserWithMetadata {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
}

/**
 * Récupère tous les utilisateurs (admin/coach seulement)
 */
export async function getAllUsers() {
  try {
    // Vérifier les permissions
    const hasPermission = await isCoachOrAdmin();
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized' };
    }

    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      limit: 100,
      orderBy: '-created_at',
    });

    const usersWithMetadata: UserWithMetadata[] = users.map((user) => {
      const metadata = (user.publicMetadata || {}) as Partial<{ role: UserRole; status: UserStatus }>;
      const adminEmail = process.env.ADMIN_EMAIL || 'pauletiennegrn@gmail.com';
      const isAdminUser = user.emailAddresses[0]?.emailAddress === adminEmail;

      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        role: isAdminUser ? 'admin' : (metadata.role || 'athlete'),
        status: isAdminUser ? 'approved' : (metadata.status || 'pending'),
        createdAt: user.createdAt,
      };
    });

    return { success: true, users: usersWithMetadata };
  } catch (error) {
    console.error('Error getting users:', error);
    return { success: false, error: 'Failed to get users' };
  }
}

/**
 * Récupère uniquement les utilisateurs approuvés (pour l'envoi d'emails)
 */
export async function getApprovedUsers() {
  try {
    // Vérifier les permissions
    const hasPermission = await isCoachOrAdmin();
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized' };
    }

    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      limit: 100,
      orderBy: 'first_name',
    });

    const approvedUsers = users
      .map((user) => {
        const metadata = (user.publicMetadata || {}) as Partial<{ role: UserRole; status: UserStatus }>;
        const adminEmail = process.env.ADMIN_EMAIL || 'pauletiennegrn@gmail.com';
        const isAdminUser = user.emailAddresses[0]?.emailAddress === adminEmail;

        return {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          role: isAdminUser ? 'admin' : (metadata.role || 'athlete'),
          status: isAdminUser ? 'approved' : (metadata.status || 'pending'),
          createdAt: user.createdAt,
        };
      })
      .filter((user) => user.status === 'approved'); // Filtrer uniquement les approuvés

    return { success: true, users: approvedUsers };
  } catch (error) {
    console.error('Error getting approved users:', error);
    return { success: false, error: 'Failed to get approved users' };
  }
}

/**
 * Approuve un utilisateur (coach/admin seulement)
 */
export async function approveUser(userId: string) {
  try {
    // Vérifier les permissions
    const hasPermission = await isCoachOrAdmin();
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!userId || typeof userId !== 'string') {
      return { success: false, error: 'Invalid user ID' };
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = (user.publicMetadata || {}) as Partial<{ role: UserRole; status: UserStatus }>;

    // Mettre à jour le statut de l'utilisateur
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        status: 'approved',
      },
    });

    // Envoyer un email de confirmation
    const userEmail = user.emailAddresses[0]?.emailAddress;
    const userName = user.firstName || '';
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (userEmail && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: userEmail,
          subject: 'Votre demande d\'accès a été approuvée ! 🎉',
          react: ApprovalEmail({ userName, loginUrl }),
        });
        console.log(`✅ Email d'approbation envoyé à ${userEmail}`);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
        // Ne pas bloquer l'approbation si l'email échoue
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error approving user:', error);
    return { success: false, error: 'Failed to approve user' };
  }
}

/**
 * Refuse/révoque un utilisateur (admin seulement)
 */
export async function revokeUser(userId: string) {
  try {
    // Vérifier les permissions (admin seulement)
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!userId || typeof userId !== 'string') {
      return { success: false, error: 'Invalid user ID' };
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = (user.publicMetadata || {}) as Partial<{ role: UserRole; status: UserStatus }>;

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        status: 'pending',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error revoking user:', error);
    return { success: false, error: 'Failed to revoke user' };
  }
}

/**
 * Change le rôle d'un utilisateur (admin seulement)
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    // Vérifier les permissions (admin seulement)
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!userId || typeof userId !== 'string') {
      return { success: false, error: 'Invalid user ID' };
    }

    if (!['athlete', 'coach', 'admin'].includes(newRole)) {
      return { success: false, error: 'Invalid role' };
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = (user.publicMetadata || {}) as Partial<{ role: UserRole; status: UserStatus }>;

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        role: newRole,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

/**
 * Met à jour la VMA de l'utilisateur
 */
export async function updateUserVma(vma: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Non autorisé' };

    const client = await clerkClient();
    
    // 1. Récupérer les métadonnées existantes pour ne pas les perdre
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata || {};

    // 2. Mettre à jour avec la nouvelle VMA
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        vma: vma,
      },
    });

    revalidatePath('/'); // Rafraîchir la page d'accueil
    return { success: true };
  } catch (error) {
    console.error('Error updating VMA:', error);
    return { success: false, error: 'Erreur lors de la mise à jour de la VMA' };
  }
}