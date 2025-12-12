import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Routes publiques (accessibles sans authentification)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
]);

// Routes qui nécessitent d'être approuvé
const requiresApproval = createRouteMatcher([
  '/planning(.*)',
  '/training(.*)',
  '/sessions(.*)',
  '/dashboard(.*)',
  '/activity(.*)',
]);

// Routes admin uniquement
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

// Email de l'admin
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'pauletiennegrn@gmail.com';

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Si la route est publique ET que l'utilisateur n'est pas connecté, laisser passer
  if (isPublicRoute(req) && !userId) {
    return NextResponse.next();
  }

  // Si l'utilisateur n'est pas connecté sur une route non publique, rediriger vers sign-in
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Récupérer les données complètes de l'utilisateur depuis Clerk
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // Récupérer l'email de l'utilisateur
  const userEmail = user.emailAddresses[0]?.emailAddress;

  // Si c'est l'admin, tout permettre
  if (userEmail === ADMIN_EMAIL) {
    return NextResponse.next();
  }

  // Récupérer les métadonnées
  const metadata = (user.publicMetadata as any) || {};
  const role = metadata.role || 'athlete';
  const status = metadata.status || 'pending';

  // Si l'utilisateur essaie d'accéder à /admin sans être admin
  if (isAdminRoute(req) && role !== 'admin' && role !== 'coach') {
    return NextResponse.redirect(new URL('/planning', req.url));
  }

  // Si l'utilisateur n'est pas approuvé
  if (status === 'pending') {
    // Sauf s'il est déjà sur la page d'attente, rediriger vers /waiting
    if (!req.nextUrl.pathname.startsWith('/waiting')) {
      return NextResponse.redirect(new URL('/waiting', req.url));
    }
  }

  // Si l'utilisateur est approuvé et essaie d'accéder à /waiting, rediriger vers la page d'accueil
  if (status === 'approved' && req.nextUrl.pathname.startsWith('/waiting')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
