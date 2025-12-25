import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProfilePageClient } from "./profile-page-client";
import { getUserGarminStatus } from "@/actions/garmin";

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get Garmin connection status
  const garminStatus = await getUserGarminStatus();

  return (
    <ProfilePageClient
      garminStatus={garminStatus}
    />
  );
}
