"use server";

import { ensureAuthenticated } from "./auth";
import { client } from "@/lib/garth";
import { UserProfile } from "@/lib/garth/users/profile";

export async function getUserProfile() {
  try {
    await ensureAuthenticated();

    const profile = await UserProfile.get({ client });

    return {
      success: true,
      data: {
        id: profile.id,
        profile_id: profile.profile_id,
        garmin_guid: profile.garmin_guid,
        display_name: profile.display_name,
        full_name: profile.full_name,
        user_name: profile.user_name,
        profile_image_type: profile.profile_image_type,
        profile_image_url_large: profile.profile_image_url_large,
        profile_image_url_medium: profile.profile_image_url_medium,
        profile_image_url_small: profile.profile_image_url_small,
        location: profile.location,
        facebook_url: profile.facebook_url,
        twitter_url: profile.twitter_url,
        personal_website: profile.personal_website,
        motivation: profile.motivation,
        bio: profile.bio,
        primary_activity: profile.primary_activity,
        favorite_activity_types: profile.favorite_activity_types,
        running_training_speed: profile.running_training_speed,
        cycling_training_speed: profile.cycling_training_speed,
        favorite_cycling_activity_types: profile.favorite_cycling_activity_types,
        cycling_classification: profile.cycling_classification,
        cycling_max_avg_power: profile.cycling_max_avg_power,
        swimming_training_speed: profile.swimming_training_speed,
        profile_visibility: profile.profile_visibility,
        activity_start_visibility: profile.activity_start_visibility,
        activity_map_visibility: profile.activity_map_visibility,
        course_visibility: profile.course_visibility,
        activity_heart_rate_visibility: profile.activity_heart_rate_visibility,
        activity_power_visibility: profile.activity_power_visibility,
        badge_visibility: profile.badge_visibility,
        show_age: profile.show_age,
        show_weight: profile.show_weight,
        show_height: profile.show_height,
        show_weight_class: profile.show_weight_class,
        show_age_range: profile.show_age_range,
        show_gender: profile.show_gender,
        show_activity_class: profile.show_activity_class,
        show_vo_2_max: profile.show_vo_2_max,
        show_personal_records: profile.show_personal_records,
        show_last_12_months: profile.show_last_12_months,
        show_lifetime_totals: profile.show_lifetime_totals,
        show_upcoming_events: profile.show_upcoming_events,
        show_recent_favorites: profile.show_recent_favorites,
        show_recent_device: profile.show_recent_device,
        show_recent_gear: profile.show_recent_gear,
        show_badges: profile.show_badges,
        other_activity: profile.other_activity,
        other_primary_activity: profile.other_primary_activity,
        other_motivation: profile.other_motivation,
        user_roles: profile.user_roles,
        name_approved: profile.name_approved,
        user_profile_full_name: profile.user_profile_full_name,
        make_golf_scorecards_private: profile.make_golf_scorecards_private,
        allow_golf_live_scoring: profile.allow_golf_live_scoring,
        allow_golf_scoring_by_connections: profile.allow_golf_scoring_by_connections,
        user_level: profile.user_level,
        user_point: profile.user_point,
        level_update_date: profile.level_update_date,
        level_is_viewed: profile.level_is_viewed,
        level_point_threshold: profile.level_point_threshold,
        user_point_offset: profile.user_point_offset,
        user_pro: profile.user_pro,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch user profile",
    };
  }
}

export async function getBasicProfile() {
  try {
    await ensureAuthenticated();

    const profile = await UserProfile.get({ client });

    return {
      success: true,
      data: {
        display_name: profile.display_name,
        full_name: profile.full_name,
        user_name: profile.user_name,
        profile_image_url_medium: profile.profile_image_url_medium,
        location: profile.location,
        bio: profile.bio,
        primary_activity: profile.primary_activity,
        user_level: profile.user_level,
        user_point: profile.user_point,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch basic profile",
    };
  }
}
