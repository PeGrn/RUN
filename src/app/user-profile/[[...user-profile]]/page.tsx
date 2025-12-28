import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cable } from "lucide-react";
import Image from "next/image";

const UserProfilePage = () => {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Bouton de connexion Garmin - Mobile First */}
      <div className="w-full px-3 py-6 sm:px-4 sm:py-8 md:py-10">
        <div className="flex justify-center">
          <Link href="/profile" className="w-full max-w-md sm:max-w-sm md:max-w-md">
            <Button
              variant="outline"
              className="w-full h-auto py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/40 dark:hover:to-cyan-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
            >
              <Image
                src="/Garminconnect.svg"
                alt="Garmin"
                width={20}
                height={20}
                className="opacity-90 sm:w-6 sm:h-6"
              />
              <span className="font-medium text-sm sm:text-base">
                Connecter mon compte Garmin
              </span>
              <Cable className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Profil Clerk */}
      <div className="w-full flex justify-center px-3 sm:px-4">
        <UserProfile path="/user-profile" />
      </div>
    </div>
  );
};

export default UserProfilePage;