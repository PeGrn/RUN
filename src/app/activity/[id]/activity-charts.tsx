"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ComposedChart,
  Legend,
} from "recharts";
import { Activity, TrendingDown, TrendingUp, Heart, Zap, Gauge, TrendingUpDown } from "lucide-react";

// Composant de tooltip personnalisé
const CustomTooltip = ({ active, payload, label, formatAllure }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        <div className="font-semibold">{label}</div>
        {payload.map((entry: any, index: number) => {
          let displayValue = entry.value;
          let unit = "";

          // Format selon le type de donnée
          if (entry.dataKey === "allure") {
            displayValue = formatAllure(entry.value);
            unit = "";
          } else if (entry.dataKey === "fc" || entry.dataKey === "fcMax") {
            displayValue = Math.round(entry.value);
            unit = " bpm";
          } else if (entry.dataKey === "vitesse") {
            displayValue = parseFloat(entry.value).toFixed(1);
            unit = " km/h";
          } else if (entry.dataKey === "cadence") {
            displayValue = Math.round(entry.value);
            unit = " spm";
          } else if (entry.dataKey === "denivele") {
            displayValue = parseFloat(entry.value).toFixed(1);
            unit = " m";
          } else if (entry.dataKey.includes("Norm")) {
            displayValue = Math.round(entry.value);
            unit = "%";
          } else {
            displayValue = typeof entry.value === "number" ? Math.round(entry.value) : entry.value;
          }

          return (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.name || entry.dataKey}
                </span>
              </div>
              <span className="font-mono text-sm font-semibold">
                {displayValue}{unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface Lap {
  lap_index: number;
  distance: number;
  duration: number;
  average_hr?: number;
  max_hr?: number;
  average_speed?: number;
  average_run_cadence?: number;
  elevation_gain?: number;
  calories?: number;
}

interface ActivityChartsProps {
  laps: Lap[];
  activityName: string;
}

export function ActivityCharts({ laps, activityName }: ActivityChartsProps) {
  // Fonction pour formatter l'allure
  const formatAllure = (decimalMinutes: number) => {
    if (!decimalMinutes || decimalMinutes === 0) return "N/A";
    const minutes = Math.floor(decimalMinutes);
    const seconds = Math.round((decimalMinutes % 1) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
  };

  // Préparer les données pour les graphiques
  const chartData = laps.map((lap) => {
    const paceSecPerKm = lap.average_speed ? 1000 / lap.average_speed : 0;
    const paceMinutes = Math.floor(paceSecPerKm / 60);
    const paceSeconds = Math.floor(paceSecPerKm % 60);
    const paceDecimal = paceMinutes + paceSeconds / 60;

    return {
      tour: `T${lap.lap_index + 1}`,
      tourNumber: lap.lap_index + 1,
      fc: lap.average_hr || 0,
      fcMax: lap.max_hr || 0,
      allure: paceDecimal,
      allureFormatted: `${paceMinutes}:${paceSeconds.toString().padStart(2, "0")} /km`,
      vitesse: lap.average_speed ? parseFloat((lap.average_speed * 3.6).toFixed(1)) : 0, // km/h
      cadence: lap.average_run_cadence ? Math.round(lap.average_run_cadence) : 0,
      denivele: lap.elevation_gain || 0,
      distance: lap.distance / 1000,
      calories: lap.calories || 0,
    };
  });

  // Calculer les zones de FC
  const maxHR = Math.max(...laps.map(l => l.max_hr || 0).filter(hr => hr > 0));
  const hrZones = chartData.reduce((acc, lap) => {
    if (lap.fc === 0) return acc;
    const percentage = (lap.fc / maxHR) * 100;
    let zone = "";

    if (percentage < 60) zone = "Zone 1";
    else if (percentage < 70) zone = "Zone 2";
    else if (percentage < 80) zone = "Zone 3";
    else if (percentage < 90) zone = "Zone 4";
    else zone = "Zone 5";

    acc[zone] = (acc[zone] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hrZonesData = Object.entries(hrZones).map(([zone, count]) => ({
    zone,
    tours: count,
    fill: zone.includes("1") ? "#10b981" :
          zone.includes("2") ? "#3b82f6" :
          zone.includes("3") ? "#f59e0b" :
          zone.includes("4") ? "#f97316" :
          "#ef4444",
  }));

  // Normaliser les données pour le graphique de performance globale (échelle 0-100)
  const normalizedData = chartData.map(d => {
    const maxFC = Math.max(...chartData.map(c => c.fc));
    const minFC = Math.min(...chartData.filter(c => c.fc > 0).map(c => c.fc));
    const maxCadence = Math.max(...chartData.map(c => c.cadence));
    const minCadence = Math.min(...chartData.filter(c => c.cadence > 0).map(c => c.cadence));
    const maxAllure = Math.max(...chartData.filter(c => c.allure > 0).map(c => c.allure));
    const minAllure = Math.min(...chartData.filter(c => c.allure > 0).map(c => c.allure));

    return {
      ...d,
      fcNorm: d.fc > 0 ? ((d.fc - minFC) / (maxFC - minFC)) * 100 : 0,
      cadenceNorm: d.cadence > 0 ? ((d.cadence - minCadence) / (maxCadence - minCadence)) * 100 : 0,
      allureNorm: d.allure > 0 ? 100 - ((d.allure - minAllure) / (maxAllure - minAllure)) * 100 : 0, // Inversé car moins = mieux
    };
  });

  // Calculer la corrélation FC vs Allure
  const validData = chartData.filter(d => d.fc > 0 && d.allure > 0);
  const avgFC = validData.reduce((sum, d) => sum + d.fc, 0) / validData.length;
  const avgAllure = validData.reduce((sum, d) => sum + d.allure, 0) / validData.length;

  // Statistiques
  const avgPace = chartData.reduce((sum, d) => sum + d.allure, 0) / chartData.filter(d => d.allure > 0).length;
  const avgHR = chartData.reduce((sum, d) => sum + d.fc, 0) / chartData.filter(d => d.fc > 0).length;
  const avgCadence = chartData.reduce((sum, d) => sum + d.cadence, 0) / chartData.filter(d => d.cadence > 0).length;

  // Tendance de l'allure
  const validPaceData = chartData.filter(d => d.allure > 0);
  const firstHalfAvg = validPaceData.slice(0, Math.floor(validPaceData.length / 2))
    .reduce((sum, d) => sum + d.allure, 0) / Math.floor(validPaceData.length / 2);
  const secondHalfAvg = validPaceData.slice(Math.floor(validPaceData.length / 2))
    .reduce((sum, d) => sum + d.allure, 0) / (validPaceData.length - Math.floor(validPaceData.length / 2));
  const paceTrend = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  const chartConfig = {
    fc: {
      label: "FC (bpm)",
      color: "#ef4444",
    },
    fcMax: {
      label: "FC Max",
      color: "#dc2626",
    },
    allure: {
      label: "Allure (min/km)",
      color: "#3b82f6",
    },
    vitesse: {
      label: "Vitesse (km/h)",
      color: "#06b6d4",
    },
    cadence: {
      label: "Cadence (spm)",
      color: "#8b5cf6",
    },
    denivele: {
      label: "Dénivelé (m)",
      color: "#14b8a6",
    },
    fcNorm: {
      label: "FC",
      color: "#ef4444",
    },
    cadenceNorm: {
      label: "Cadence",
      color: "#8b5cf6",
    },
    allureNorm: {
      label: "Vitesse",
      color: "#3b82f6",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {/* Graphique FC vs Allure (Corrélation) */}
      <Card className="border-2 border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpDown className="h-5 w-5 text-purple-500" />
            Corrélation FC vs Allure
          </CardTitle>
          <CardDescription>
            Comment votre fréquence cardiaque évolue avec votre allure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fcGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="tour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                label={{ value: 'FC (bpm)', angle: -90, position: 'insideLeft', style: { fill: '#ef4444' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                reversed={true}
                label={{ value: 'Allure (min/km)', angle: 90, position: 'insideRight', style: { fill: '#3b82f6' } }}
                tickFormatter={(value) => {
                  const min = Math.floor(value);
                  const sec = Math.round((value % 1) * 60);
                  return `${min}:${sec.toString().padStart(2, "0")}`;
                }}
              />
              <ChartTooltip content={<CustomTooltip formatAllure={formatAllure} />} />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="fc"
                stroke="#ef4444"
                fill="url(#fcGradient)"
                strokeWidth={3}
                name="FC"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="allure"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Allure"
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Graphique Cadence vs Allure */}
      <Card className="border-2 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-purple-500" />
            Cadence vs Allure
          </CardTitle>
          <CardDescription>
            Relation entre votre cadence et votre vitesse de course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cadenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="tour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[140, 200]}
                label={{ value: 'Cadence (spm)', angle: -90, position: 'insideLeft', style: { fill: '#8b5cf6' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                label={{ value: 'Vitesse (km/h)', angle: 90, position: 'insideRight', style: { fill: '#06b6d4' } }}
              />
              <ChartTooltip content={<CustomTooltip formatAllure={formatAllure} />} />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cadence"
                stroke="#8b5cf6"
                fill="url(#cadenceGradient)"
                strokeWidth={3}
                name="Cadence"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="vitesse"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ fill: '#06b6d4', r: 4 }}
                activeDot={{ r: 6 }}
                name="Vitesse"
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Performance Globale Multi-Métriques */}
      <Card className="border-2 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Performance Globale Multi-Métriques
          </CardTitle>
          <CardDescription>
            Vue normalisée de toutes vos métriques (échelle 0-100)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <AreaChart
              data={normalizedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fcNormGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="cadenceNormGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="allureNormGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="tour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, 100]}
              />
              <ChartTooltip content={<CustomTooltip formatAllure={formatAllure} />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="fcNorm"
                stroke="#ef4444"
                fill="url(#fcNormGradient)"
                strokeWidth={2}
                name="FC"
              />
              <Area
                type="monotone"
                dataKey="cadenceNorm"
                stroke="#8b5cf6"
                fill="url(#cadenceNormGradient)"
                strokeWidth={2}
                name="Cadence"
              />
              <Area
                type="monotone"
                dataKey="allureNorm"
                stroke="#3b82f6"
                fill="url(#allureNormGradient)"
                strokeWidth={2}
                name="Vitesse"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Graphique de Fréquence Cardiaque Coloré */}
      <Card className="border-2 border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Évolution de la Fréquence Cardiaque
          </CardTitle>
          <CardDescription>
            FC moyenne: {Math.round(avgHR)} bpm | FC max: {maxHR} bpm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillFC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="fillFCMax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="tour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <ChartTooltip content={<CustomTooltip formatAllure={formatAllure} />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="fcMax"
                stroke="#dc2626"
                fill="url(#fillFCMax)"
                strokeWidth={2}
                name="FC Max"
              />
              <Area
                type="monotone"
                dataKey="fc"
                stroke="#ef4444"
                fill="url(#fillFC)"
                strokeWidth={3}
                name="FC Moyenne"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Graphique d'Allure Coloré */}
      <Card className="border-2 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Évolution de l'Allure par Tour
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            Allure moyenne: {Math.floor(avgPace)}:{Math.round((avgPace % 1) * 60).toString().padStart(2, "0")} /km
            {paceTrend !== 0 && (
              <span className={`flex items-center ${paceTrend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {paceTrend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(paceTrend).toFixed(1)}% {paceTrend > 0 ? 'plus lent' : 'plus rapide'} en 2ème moitié
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="allureGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="tour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                reversed={true}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                tickFormatter={(value) => {
                  const min = Math.floor(value);
                  const sec = Math.round((value % 1) * 60);
                  return `${min}:${sec.toString().padStart(2, "0")}`;
                }}
              />
              <ChartTooltip content={<CustomTooltip formatAllure={formatAllure} />} />
              <Line
                type="monotone"
                dataKey="allure"
                stroke="url(#allureGradient)"
                strokeWidth={4}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7, fill: '#ec4899' }}
                name="Allure"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Graphique des Zones de FC Coloré */}
      {hrZonesData.length > 0 && (
        <Card className="border-2 border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Distribution des Zones de Fréquence Cardiaque
            </CardTitle>
            <CardDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Zone 1: &lt;60%</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Zone 2: 60-70%</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Zone 3: 70-80%</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Zone 4: 80-90%</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Zone 5: &gt;90%</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                tours: {
                  label: "Tours",
                },
              }}
            >
              <BarChart
                data={hrZonesData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="zone"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<CustomTooltip formatAllure={formatAllure} />} />
                <Bar dataKey="tours" radius={[8, 8, 0, 0]} name="Nombre de tours" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Dénivelé et Effort */}
      {chartData.some(d => d.denivele > 0) && (
        <Card className="border-2 border-teal-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-500" />
              Dénivelé et Fréquence Cardiaque
            </CardTitle>
            <CardDescription>
              Impact du dénivelé sur votre effort cardiaque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="tour"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  label={{ value: 'Dénivelé (m)', angle: -90, position: 'insideLeft', style: { fill: '#14b8a6' } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  label={{ value: 'FC (bpm)', angle: 90, position: 'insideRight', style: { fill: '#ef4444' } }}
                />
                <ChartTooltip content={<CustomTooltip formatAllure={formatAllure} />} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="denivele"
                  fill="#14b8a6"
                  radius={[8, 8, 0, 0]}
                  name="Dénivelé"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="fc"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', r: 4 }}
                  name="FC"
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
