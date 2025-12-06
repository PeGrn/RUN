import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

const ADMIN_EMAIL = 'pauletiennegrn@gmail.com';

export async function POST(req: Request) {
  try {
    const { type, data } = await req.json();

    // Quand un utilisateur est créé
    if (type === 'user.created') {
      const userId = data.id;
      const userEmail = data.email_addresses?.[0]?.email_address;

      // Si c'est l'admin, définir automatiquement les métadonnées
      if (userEmail === ADMIN_EMAIL) {
        const client = await clerkClient();
        await client.users.updateUser(userId, {
          publicMetadata: {
            role: 'admin',
            status: 'approved',
          },
        });

        console.log(`Admin user created and configured: ${userEmail}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
