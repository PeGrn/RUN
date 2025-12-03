"use server";

import { ensureAuthenticated } from "./auth";
import { client } from "@/lib/garth";
import { WeightData } from "@/lib/garth/data/weight";

// Weight Actions

export async function getWeightForDay(day: Date | string) {
  try {
    await ensureAuthenticated();

    const weight = await WeightData.get(day, { client });

    if (!weight) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: {
        sample_pk: weight.sample_pk,
        calendar_date: weight.calendar_date.toISOString(),
        weight: weight.weight,
        source_type: weight.source_type,
        weight_delta: weight.weight_delta,
        timestamp_gmt: weight.timestamp_gmt,
        datetime_utc: weight.datetime_utc.toISOString(),
        datetime_local: weight.datetime_local.toISOString(),
        bmi: weight.bmi,
        body_fat: weight.body_fat,
        body_water: weight.body_water,
        bone_mass: weight.bone_mass,
        muscle_mass: weight.muscle_mass,
        physique_rating: weight.physique_rating,
        visceral_fat: weight.visceral_fat,
        metabolic_age: weight.metabolic_age,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch weight data",
    };
  }
}

export async function getWeightRange(end?: Date | string, days: number = 7) {
  try {
    await ensureAuthenticated();

    const weights = await WeightData.listRange(end || null, days, { client });

    return {
      success: true,
      data: weights.map((weight) => ({
        sample_pk: weight.sample_pk,
        calendar_date: weight.calendar_date.toISOString(),
        weight: weight.weight,
        source_type: weight.source_type,
        weight_delta: weight.weight_delta,
        timestamp_gmt: weight.timestamp_gmt,
        datetime_utc: weight.datetime_utc.toISOString(),
        datetime_local: weight.datetime_local.toISOString(),
        bmi: weight.bmi,
        body_fat: weight.body_fat,
        body_water: weight.body_water,
        bone_mass: weight.bone_mass,
        muscle_mass: weight.muscle_mass,
        physique_rating: weight.physique_rating,
        visceral_fat: weight.visceral_fat,
        metabolic_age: weight.metabolic_age,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch weight range",
    };
  }
}

export async function getWeightList(end?: Date | string, days: number = 7) {
  try {
    await ensureAuthenticated();

    const weights = await WeightData.list(end || null, days, { client });

    return {
      success: true,
      data: weights.map((weight) => ({
        sample_pk: weight.sample_pk,
        calendar_date: weight.calendar_date.toISOString(),
        weight: weight.weight,
        source_type: weight.source_type,
        weight_delta: weight.weight_delta,
        timestamp_gmt: weight.timestamp_gmt,
        datetime_utc: weight.datetime_utc.toISOString(),
        datetime_local: weight.datetime_local.toISOString(),
        bmi: weight.bmi,
        body_fat: weight.body_fat,
        body_water: weight.body_water,
        bone_mass: weight.bone_mass,
        muscle_mass: weight.muscle_mass,
        physique_rating: weight.physique_rating,
        visceral_fat: weight.visceral_fat,
        metabolic_age: weight.metabolic_age,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch weight list",
    };
  }
}
