import { redirect } from "next/navigation";
import {
  getGarminAuth,
  getBasicProfile,
  getRecentActivities,
  getDailySteps,
  getDailyStress,
} from "@/actions/garmin";
import Link from "next/link";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const auth = await getGarminAuth();

  if (!auth.isAuthenticated) {
    redirect("/login");
  }

  const [profileResult, activitiesResult, stepsResult, stressResult] =
    await Promise.all([
      getBasicProfile(),
      getRecentActivities(10),
      getDailySteps(new Date(), 7),
      getDailyStress(new Date(), 7),
    ]);

  const profile = profileResult.success ? profileResult.data : null;
  // Fallback to empty array if data is undefined
  const activities = (activitiesResult.success && activitiesResult.data) ? activitiesResult.data : [];
  const steps = (stepsResult.success && stepsResult.data) ? stepsResult.data : [];
  const stress = (stressResult.success && stressResult.data) ? stressResult.data : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="bg-white dark:bg-zinc-800 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex justify-between items-start sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 truncate">
                  Activités Garmin
                </h1>
                {profile && (
                  <div>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 truncate">
                    Bonjour, {profile.full_name}
                  </p>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 truncate">
                    Localisation : {profile.location || "Non renseigné"}
                  </p>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Activités récentes */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-700">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Activités récentes
            </h2>
          </div>

          {activities && activities.length > 0 ? (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {activities.map((activity: any) => (
                <Link
                  key={activity.activity_id}
                  href={`/activity/${activity.activity_id}`}
                  className="block px-4 sm:px-6 py-3 sm:py-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm sm:text-base text-zinc-900 dark:text-zinc-50 truncate">
                        {activity.activity_name}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">
                        {activity.activity_type?.type_key || "Activity"} •{" "}
                        {new Date(activity.start_time_local).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                    {activity.distance && (
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Distance:
                        </span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-50">
                          {(activity.distance / 1000).toFixed(2)} km
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Durée:
                      </span>
                      <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-50">
                        {Math.floor(activity.duration / 60)}min
                      </span>
                    </div>

                    {activity.average_hr && (
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          FC moy:
                        </span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-50">
                          {activity.average_hr} bpm
                        </span>
                      </div>
                    )}

                    {activity.calories && (
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Calories:
                        </span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-50">
                          {activity.calories} kcal
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-500">
              Aucune activité récente
            </div>
          )}
        </div>
      </main>
    </div>
  );
}