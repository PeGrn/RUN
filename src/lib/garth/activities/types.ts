// Activity Types and Interfaces

export interface ActivitySummary {
  activityId: number;
  activityName: string;
  description: string | null;
  startTimeLocal: string;
  startTimeGMT: string;
  activityType: {
    typeId: number;
    typeKey: string;
    parentTypeId: number;
  };
  distance: number | null;
  duration: number;
  elapsedDuration: number;
  movingDuration: number;
  elevationGain: number | null;
  elevationLoss: number | null;
  averageSpeed: number | null;
  maxSpeed: number | null;
  averageHR: number | null;
  maxHR: number | null;
  averageRunningCadenceInStepsPerMinute: number | null;
  maxRunningCadenceInStepsPerMinute: number | null;
  steps: number | null;
  calories: number | null;
  bmrCalories: number | null;
  averageTemperature: number | null;
  maxTemperature: number | null;
  minTemperature: number | null;
  trainingEffect: number | null;
  aerobicTrainingEffect: number | null;
  anaerobicTrainingEffect: number | null;
  strokes: number | null;
  avgStrokes: number | null;
  maxStrokes: number | null;
  avgPower: number | null;
  maxPower: number | null;
  normalizedPower: number | null;
  leftBalance: number | null;
  rightBalance: number | null;
  vO2MaxValue: number | null;
  locationName: string | null;
  lapCount: number;
  favorite: boolean;
  pr: boolean;
  autoCalcCalories: boolean;
  hasPolyline: boolean;
  hasImages: boolean;
  hasVideo: boolean;
  moderateIntensityMinutes: number;
  vigorousIntensityMinutes: number;
  purposeful: boolean;
}

export interface ActivityLap {
  lapIndex: number;
  startTimeGMT: string;
  startTimeLocal: string;
  distance: number;
  duration: number;
  elapsedDuration: number;
  movingDuration: number;
  averageSpeed: number | null;
  maxSpeed: number | null;
  averageHR: number | null;
  maxHR: number | null;
  calories: number | null;
  averageRunningCadenceInStepsPerMinute: number | null;
  maxRunningCadenceInStepsPerMinute: number | null;
  avgPower: number | null;
  maxPower: number | null;
  elevationGain: number | null;
  elevationLoss: number | null;
  startLatitude: number | null;
  startLongitude: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
  messageIndex: number;
  totalExerciseReps: number;
  intensity: string;
  lapTrigger: string;
}

export interface ActivitySplit {
  distance: number;
  duration: number;
  movingDuration: number;
  elevationGain: number | null;
  elevationLoss: number | null;
  averageSpeed: number | null;
  averageHR: number | null;
  averageRunningCadenceInStepsPerMinute: number | null;
  calories: number | null;
  avgPower: number | null;
  splitType: string;
}

export interface ActivityDetailMetrics {
  metricsCount: number;
  metrics: Array<{
    metricsIndex: number;
    metrics: Array<{
      key: string;
      value?: number | string;
      averageValue?: number;
      maxValue?: number;
      minValue?: number;
    }>;
  }>;
}

export interface ActivityGearData {
  gearId: string;
  displayName: string;
  imageUrl: string | null;
  distance: number;
}

export interface ActivityWeatherData {
  temp: number;
  apparentTemp: number;
  dewPoint: number;
  relativeHumidity: number;
  windDirection: number;
  windDirectionCompassPoint: string;
  windSpeed: number;
  windGust: number;
  latitude: number;
  longitude: number;
  weatherStationDTO: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  } | null;
  weatherTypeDTO: {
    weatherTypePk: {
      weatherType: number;
    };
    desc: string;
    image: string;
  } | null;
  issueDate: string;
}

export interface ActivityDetails {
  activityId: number;
  activityName: string;
  description: string | null;
  startTimeLocal: string;
  startTimeGMT: string;
  activityType: {
    typeId: number;
    typeKey: string;
  };
  distance: number | null;
  duration: number;
  movingDuration: number;
  elapsedDuration: number;
  elevationGain: number | null;
  elevationLoss: number | null;
  averageSpeed: number | null;
  maxSpeed: number | null;
  startLatitude: number | null;
  startLongitude: number | null;
  averageHR: number | null;
  maxHR: number | null;
  averageRunningCadenceInStepsPerMinute: number | null;
  maxRunningCadenceInStepsPerMinute: number | null;
  steps: number | null;
  calories: number | null;
  bmrCalories: number | null;
  avgPower: number | null;
  maxPower: number | null;
  normalizedPower: number | null;
  trainingEffect: number | null;
  aerobicTrainingEffect: number | null;
  anaerobicTrainingEffect: number | null;
  minTemperature: number | null;
  maxTemperature: number | null;
  avgTemperature: number | null;
  vO2MaxValue: number | null;
  lapCount: number;
  laps: ActivityLap[];
  splits: ActivitySplit[];
  gearVO: ActivityGearData | null;
  metadataDTO: ActivityDetailMetrics | null;
  summaryDTO: {
    startTimeLocal: string;
    startTimeGMT: string;
    distance: number;
    duration: number;
    elapsedDuration: number;
    movingDuration: number;
    averageSpeed: number | null;
    maxSpeed: number | null;
    averageHR: number | null;
    maxHR: number | null;
  } | null;
}
