// Export all Garmin server actions from a single entry point

// Authentication
export {
  loginToGarmin,
  loginToGarminWithMFA,
  logoutFromGarmin,
  getGarminAuth,
} from "./auth";

// Stats
export {
  getDailySteps,
  getWeeklySteps,
  getDailyStress,
  getWeeklyStress,
  getAllStats,
} from "./stats";

// Data
export {
  getWeightForDay,
  getWeightRange,
  getWeightList,
} from "./data";

// Profile
export {
  getUserProfile,
  getBasicProfile,
} from "./profile";

// Activities
export {
  getActivities,
  getActivitiesByDateRange,
  getActivityDetails,
  getActivitySplits,
  getActivityMetrics,
  getActivityWeather,
  getActivityGear,
  getFullActivity,
  downloadActivityGPX,
  downloadActivityTCX,
  downloadActivityFIT,
  getRecentActivities,
} from "./activities";

// Upload
export {
  uploadWorkoutToGarmin,
  uploadWorkoutToGarminBase64,
} from "./upload";

// Workout
export {
  createGarminWorkout,
  scheduleGarminWorkout,
} from "./workout";

// User Authentication
export {
  connectUserGarmin,
  disconnectUserGarmin,
  getUserGarminStatus,
} from "./user-auth";
