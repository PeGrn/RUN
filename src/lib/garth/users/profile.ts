import { client as defaultClient, Client } from "../http";
import { camelToSnakeDict } from "../utils";

export class UserProfile {
  id!: number;
  profile_id!: number;
  garmin_guid!: string;
  display_name!: string;
  full_name!: string;
  user_name!: string;
  profile_image_type: string | null = null;
  profile_image_url_large: string | null = null;
  profile_image_url_medium: string | null = null;
  profile_image_url_small: string | null = null;
  location: string | null = null;
  facebook_url: string | null = null;
  twitter_url: string | null = null;
  personal_website: string | null = null;
  motivation: string | null = null;
  bio: string | null = null;
  primary_activity: string | null = null;
  favorite_activity_types!: string[];
  running_training_speed!: number;
  cycling_training_speed!: number;
  favorite_cycling_activity_types!: string[];
  cycling_classification: string | null = null;
  cycling_max_avg_power!: number;
  swimming_training_speed!: number;
  profile_visibility!: string;
  activity_start_visibility!: string;
  activity_map_visibility!: string;
  course_visibility!: string;
  activity_heart_rate_visibility!: string;
  activity_power_visibility!: string;
  badge_visibility!: string;
  show_age!: boolean;
  show_weight!: boolean;
  show_height!: boolean;
  show_weight_class!: boolean;
  show_age_range!: boolean;
  show_gender!: boolean;
  show_activity_class!: boolean;
  show_vo_2_max!: boolean;
  show_personal_records!: boolean;
  show_last_12_months!: boolean;
  show_lifetime_totals!: boolean;
  show_upcoming_events!: boolean;
  show_recent_favorites!: boolean;
  show_recent_device!: boolean;
  show_recent_gear!: boolean;
  show_badges!: boolean;
  other_activity: string | null = null;
  other_primary_activity: string | null = null;
  other_motivation: string | null = null;
  user_roles!: string[];
  name_approved!: boolean;
  user_profile_full_name!: string;
  make_golf_scorecards_private!: boolean;
  allow_golf_live_scoring!: boolean;
  allow_golf_scoring_by_connections!: boolean;
  user_level!: number;
  user_point!: number;
  level_update_date!: string;
  level_is_viewed!: boolean;
  level_point_threshold!: number;
  user_point_offset!: number;
  user_pro!: boolean;

  constructor(data: any = {}) {
    Object.assign(this, data);
  }

  static async get(options: { client?: Client } = {}): Promise<UserProfile> {
    const client = options.client || defaultClient;
    const profile = await client.connectapi("/userprofile-service/socialProfile");

    if (typeof profile !== "object" || profile === null) {
      throw new Error("Expected object from /userprofile-service/socialProfile");
    }

    const snakeCasedProfile = camelToSnakeDict(profile);
    return new UserProfile(snakeCasedProfile);
  }
}
