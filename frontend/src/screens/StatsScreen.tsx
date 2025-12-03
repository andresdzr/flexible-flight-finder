import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchStatistics } from "@/services/api";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ResponsiveCalendar } from "@nivo/calendar";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import {
  Calendar,
  TrendingDown,
  BarChart3,
  PieChart,
  RefreshCw,
  Filter,
} from "lucide-react";

export default function StatsScreen() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [refresh, setRefresh] = useState(false);

  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["statistics", startDate, endDate, refresh],
    queryFn: () =>
      fetchStatistics(startDate || undefined, endDate || undefined, refresh),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = () => {
    setRefresh(true);
    refetch().finally(() => setRefresh(false));
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setRefresh(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Loading statistics...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-screen">
            <Card className="p-8 max-w-md">
              <p className="text-red-600 dark:text-red-400">
                Error loading statistics:{" "}
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Transform calendar data for Nivo
  const calendarData = stats.calendar_data.map((day) => ({
    day: day.date,
    value: day.median_price,
  }));

  // Transform cheapest routes for bar chart
  const routesData = stats.cheapest_routes.map((route) => ({
    route: `${route.origin.name} → ${route.destination.name}`,
    "Median Price": route.median_price,
    "Min Price": route.min_price,
    "Avg Price": route.avg_price,
  }));

  // Transform weekday data for line chart
  const weekdayLineData = [
    {
      id: "Average Price",
      data: stats.weekday_stats.map((day) => ({
        x: day.weekday.substring(0, 3),
        y: day.avg_price,
      })),
    },
    {
      id: "Median Price",
      data: stats.weekday_stats.map((day) => ({
        x: day.weekday.substring(0, 3),
        y: day.median_price,
      })),
    },
  ];

  // Transform monthly data for line chart
  const monthlyLineData = [
    {
      id: "Average Price",
      data: stats.monthly_stats.map((month) => ({
        x: `${month.month_name.substring(0, 3)} ${month.year}`,
        y: month.avg_price,
      })),
    },
    {
      id: "Median Price",
      data: stats.monthly_stats.map((month) => ({
        x: `${month.month_name.substring(0, 3)} ${month.year}`,
        y: month.median_price,
      })),
    },
  ];

  // Transform price distribution for pie chart
  const priceDistData = stats.price_distribution.map((bucket) => ({
    id: bucket.bucket,
    label: bucket.bucket,
    value: bucket.count,
    percentage: bucket.percentage,
  }));

  const dateRange =
    stats.metadata.date_range_start && stats.metadata.date_range_end
      ? `${stats.metadata.date_range_start} to ${stats.metadata.date_range_end}`
      : "All dates";

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <Breadcrumb
                items={[{ label: "Statistics Dashboard" }]}
                className="mb-3"
              />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Flight Statistics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover the cheapest flight deals and pricing trends
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Filters and Controls */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <Filter className="inline w-4 h-4 mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <Filter className="inline w-4 h-4 mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </Card>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>
                {stats.metadata.total_flights.toLocaleString()} flights
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              <span>{stats.metadata.total_routes} routes</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{dateRange}</span>
            </div>
            {stats.metadata.cache_hit && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <span>✓ Cached data</span>
              </div>
            )}
          </div>
        </header>

        {/* Visualizations Grid */}
        <div className="space-y-8">
          {/* Calendar Heatmap */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Calendar className="w-6 h-6" />
              Daily Median Prices - Calendar Heatmap
            </h2>
            <div className="h-[300px]">
              <ResponsiveCalendar
                data={calendarData}
                from={stats.metadata.date_range_start}
                to={stats.metadata.date_range_end}
                emptyColor="#eeeeee"
                colors={["#2ecab0ff", "#97e3d5", "#e8c1a0", "#f47560"]}
                margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                yearSpacing={40}
                monthBorderColor="#ffffff"
                dayBorderWidth={2}
                dayBorderColor="#ffffff"
                legends={[
                  {
                    anchor: "bottom-right",
                    direction: "row",
                    translateY: 36,
                    itemCount: 4,
                    itemWidth: 42,
                    itemHeight: 36,
                    itemsSpacing: 14,
                    itemDirection: "right-to-left",
                  },
                ]}
                theme={{
                  text: {
                    fill: "currentColor",
                  },
                  tooltip: {
                    container: {
                      background: "var(--tooltip-bg, #ffffff)",
                      color: "var(--tooltip-text, #333333)",
                      fontSize: 12,
                      borderRadius: "4px",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
                      padding: "5px 9px",
                    },
                  },
                }}
              />
            </div>
          </Card>

          {/* Top 20 Cheapest Routes */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <TrendingDown className="w-6 h-6" />
              Top 20 Cheapest Routes by Median Price
            </h2>
            <div className="h-[600px]">
              <ResponsiveBar
                data={routesData}
                keys={["Min Price", "Median Price", "Avg Price"]}
                indexBy="route"
                margin={{ top: 50, right: 130, bottom: 150, left: 60 }}
                padding={0.3}
                layout="vertical"
                valueScale={{ type: "linear" }}
                indexScale={{ type: "band", round: true }}
                colors={{ scheme: "nivo" }}
                borderColor={{
                  from: "color",
                  modifiers: [["darker", 1.6]],
                }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: "Route",
                  legendPosition: "middle",
                  legendOffset: 120,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "Price (€)",
                  legendPosition: "middle",
                  legendOffset: -50,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{
                  from: "color",
                  modifiers: [["darker", 1.6]],
                }}
                legends={[
                  {
                    dataFrom: "keys",
                    anchor: "bottom-right",
                    direction: "column",
                    justify: false,
                    translateX: 120,
                    translateY: 0,
                    itemsSpacing: 2,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: "left-to-right",
                    itemOpacity: 0.85,
                    symbolSize: 20,
                    effects: [
                      {
                        on: "hover",
                        style: {
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]}
                theme={{
                  axis: {
                    ticks: {
                      text: {
                        fill: "currentColor",
                      },
                    },
                    legend: {
                      text: {
                        fill: "currentColor",
                      },
                    },
                  },
                  legends: {
                    text: {
                      fill: "currentColor",
                    },
                  },
                  tooltip: {
                    container: {
                      background: "var(--tooltip-bg, #ffffff)",
                      color: "var(--tooltip-text, #333333)",
                      fontSize: 12,
                      borderRadius: "4px",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
                      padding: "5px 9px",
                    },
                  },
                }}
              />
            </div>
          </Card>

          {/* Two Column Layout for Smaller Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekday Trends */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <BarChart3 className="w-6 h-6" />
                Price Trends by Weekday
              </h2>
              <div className="h-[300px]">
                <ResponsiveLine
                  data={weekdayLineData}
                  margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                  xScale={{ type: "point" }}
                  yScale={{
                    type: "linear",
                    min: "auto",
                    max: "auto",
                    stacked: false,
                    reverse: false,
                  }}
                  yFormat=" >-.2f"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Weekday",
                    legendOffset: 36,
                    legendPosition: "middle",
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Price (€)",
                    legendOffset: -50,
                    legendPosition: "middle",
                  }}
                  pointSize={10}
                  pointColor={{ theme: "background" }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: "serieColor" }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  legends={[
                    {
                      anchor: "bottom-right",
                      direction: "column",
                      justify: false,
                      translateX: 100,
                      translateY: 0,
                      itemsSpacing: 0,
                      itemDirection: "left-to-right",
                      itemWidth: 80,
                      itemHeight: 20,
                      itemOpacity: 0.75,
                      symbolSize: 12,
                      symbolShape: "circle",
                      symbolBorderColor: "rgba(0, 0, 0, .5)",
                      effects: [
                        {
                          on: "hover",
                          style: {
                            itemBackground: "rgba(0, 0, 0, .03)",
                            itemOpacity: 1,
                          },
                        },
                      ],
                    },
                  ]}
                  theme={{
                    axis: {
                      ticks: {
                        text: {
                          fill: "currentColor",
                        },
                      },
                      legend: {
                        text: {
                          fill: "currentColor",
                        },
                      },
                    },
                    legends: {
                      text: {
                        fill: "currentColor",
                      },
                    },
                    tooltip: {
                      container: {
                        background: "var(--tooltip-bg, #ffffff)",
                        color: "var(--tooltip-text, #333333)",
                        fontSize: 12,
                        borderRadius: "4px",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
                        padding: "5px 9px",
                      },
                    },
                  }}
                />
              </div>
            </Card>

            {/* Price Distribution Pie Chart */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <PieChart className="w-6 h-6" />
                Price Distribution
              </h2>
              <div className="h-[300px]">
                <ResponsivePie
                  data={priceDistData}
                  margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  borderWidth={1}
                  borderColor={{
                    from: "color",
                    modifiers: [["darker", 0.2]],
                  }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="currentColor"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: "color" }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{
                    from: "color",
                    modifiers: [["darker", 2]],
                  }}
                  tooltip={({ datum }) => (
                    <div
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                      style={{
                        padding: "9px 12px",
                        borderRadius: "4px",
                      }}
                    >
                      <strong>{datum.label}</strong>
                      <br />
                      Count: {datum.value.toLocaleString()}
                      <br />
                      Percentage: {datum.data.percentage}%
                    </div>
                  )}
                  legends={[
                    {
                      anchor: "bottom",
                      direction: "row",
                      justify: false,
                      translateX: 0,
                      translateY: 40,
                      itemsSpacing: 0,
                      itemWidth: 80,
                      itemHeight: 18,
                      itemTextColor: "currentColor",
                      itemDirection: "left-to-right",
                      itemOpacity: 1,
                      symbolSize: 18,
                      symbolShape: "circle",
                      effects: [
                        {
                          on: "hover",
                          style: {
                            itemTextColor: "currentColor",
                          },
                        },
                      ],
                    },
                  ]}
                  theme={{
                    legends: {
                      text: {
                        fill: "currentColor",
                      },
                    },
                  }}
                />
              </div>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Calendar className="w-6 h-6" />
              Monthly Price Trends
            </h2>
            <div className="h-[400px]">
              <ResponsiveLine
                data={monthlyLineData}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: "point" }}
                yScale={{
                  type: "linear",
                  min: "auto",
                  max: "auto",
                  stacked: false,
                  reverse: false,
                }}
                yFormat=" >-.2f"
                curve="catmullRom"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: "Month",
                  legendOffset: 46,
                  legendPosition: "middle",
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "Price (€)",
                  legendOffset: -50,
                  legendPosition: "middle",
                }}
                pointSize={10}
                pointColor={{ theme: "background" }}
                pointBorderWidth={2}
                pointBorderColor={{ from: "serieColor" }}
                pointLabelYOffset={-12}
                useMesh={true}
                legends={[
                  {
                    anchor: "bottom-right",
                    direction: "column",
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: "left-to-right",
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: "circle",
                    symbolBorderColor: "rgba(0, 0, 0, .5)",
                    effects: [
                      {
                        on: "hover",
                        style: {
                          itemBackground: "rgba(0, 0, 0, .03)",
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]}
                theme={{
                  axis: {
                    ticks: {
                      text: {
                        fill: "currentColor",
                      },
                    },
                    legend: {
                      text: {
                        fill: "currentColor",
                      },
                    },
                  },
                  legends: {
                    text: {
                      fill: "currentColor",
                    },
                  },
                  tooltip: {
                    container: {
                      background: "var(--tooltip-bg, #ffffff)",
                      color: "var(--tooltip-text, #333333)",
                      fontSize: 12,
                      borderRadius: "4px",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
                      padding: "5px 9px",
                    },
                  },
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
