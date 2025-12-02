import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  Map,
  BarChart3,
  ArrowRight,
  TrendingDown,
  Calendar,
  PieChart,
} from "lucide-react";
import { FlightFinder } from "@/components/FlightFinder";

export default function MainScreen() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-start mb-12">
          <div>
            <Breadcrumb items={[{ label: "Home" }]} className="mb-3" />
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3">
              Flexible Flight Finder
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Discover the best flight deals across Europe with interactive maps
              and comprehensive statistics
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="inline-block bg-blue-100 dark:bg-blue-900 rounded-full px-6 py-2 mb-6">
            <span className="text-blue-800 dark:text-blue-200 font-semibold">
              Analyzing 100,000+ flight routes
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Find Your Next Adventure at the Best Price
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore interactive visualizations, compare prices across routes,
            and discover the cheapest times to fly to your dream destination.
          </p>
        </div>

        {/* Flight Finder */}
        <FlightFinder />

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Map Explorer Card */}
          <Link to="/map" className="group">
            <Card className="p-8 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:scale-110 transition-transform">
                  <Map className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    Interactive Map Explorer
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Visualize flight routes on an interactive map
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>See all available routes from any city</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Compare prices across destinations</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Find the cheapest flights for each route</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>View detailed flight information</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Start Exploring →
                </span>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                    Maps
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                    Routes
                  </span>
                </div>
              </div>
            </Card>
          </Link>

          {/* Statistics Dashboard Card */}
          <Link to="/stats" className="group">
            <Card className="p-8 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-purple-500 dark:hover:border-purple-400">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    Statistics Dashboard
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Analyze pricing trends and discover the best deals
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Calendar heatmap of daily prices</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Top 20 cheapest routes ranked</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Price trends by day and month</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Filter by custom date ranges</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  View Statistics →
                </span>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                    Charts
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                    Analytics
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center">
            <div className="inline-flex p-3 bg-green-100 dark:bg-green-900 rounded-lg mb-4">
              <TrendingDown className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Best Price Guarantee
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Find the absolute cheapest flights with our comprehensive price
              analysis and comparison tools.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="inline-flex p-3 bg-orange-100 dark:bg-orange-900 rounded-lg mb-4">
              <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Date Flexibility
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              View prices across entire calendar months to find the best dates
              for your trip with ease.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="inline-flex p-3 bg-pink-100 dark:bg-pink-900 rounded-lg mb-4">
              <PieChart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Smart Analytics
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Leverage data-driven insights to understand pricing patterns and
              make informed decisions.
            </p>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>
            Powered by real flight data • Updated regularly • European routes
            only
          </p>
        </div>
      </div>
    </div>
  );
}
