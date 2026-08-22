import { useEffect, useState } from "react";
import { Package, Tag, MapPin, Users, Star, FileText, Video, TrendingUp, Eye, MousePointer, Clock, Activity, ArrowUp, ArrowDown, Calendar, BarChart3, Settings2, ExternalLink } from "lucide-react";
import { apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useGoogleAnalytics, GAData } from "@/hooks/useGoogleAnalytics";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DashboardStats {
  products: number;
  categories: number;
  cities: number;
  users: number;
  reviews: number;
  blogPosts: number;
  videoReviews: number;
  creators: number;
  brands: number;
  cocktails: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(142 76% 36%)', 'hsl(38 92% 50%)', 'hsl(280 65% 60%)'];

const AdminDashboard = () => {
  const { settings: gaSettings, isConfigured: gaConfigured, fetchAnalyticsData } = useGoogleAnalytics();
  const [gaData, setGaData] = useState<GAData | null>(null);
  const [gaLoading, setGaLoading] = useState(false);
  
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    categories: 0,
    cities: 0,
    users: 0,
    reviews: 0,
    blogPosts: 0,
    videoReviews: 0,
    creators: 0,
    brands: 0,
    cocktails: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [reviewTrends, setReviewTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  // Fetch Google Analytics data
  useEffect(() => {
    const loadGAData = async () => {
      if (!gaConfigured) return;
      
      setGaLoading(true);
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const days = daysMap[timeRange] || 7;
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const data = await fetchAnalyticsData(startDate, endDate);
      if (data) {
        setGaData(data);
        // Transform GA daily data for charts
        if (data.dailyData && data.dailyData.length > 0) {
          const formatted = data.dailyData.slice(-7).map((d) => {
            const date = new Date(d.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
            return {
              day: date.toLocaleDateString('en-US', { weekday: 'short' }),
              pageViews: d.pageViews,
              uniqueVisitors: d.uniqueVisitors,
              sessions: d.sessions,
            };
          });
          setWeeklyData(formatted);
        }
      }
      setGaLoading(false);
    };

    loadGAData();
  }, [gaConfigured, timeRange, fetchAnalyticsData]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      const [
        products,
        categories,
        cities,
        users,
        reviews,
        blogPosts,
        videoReviews,
        creators,
        brands,
        cocktails,
        recentReviews,
        recentBlogPosts,
        categoryStats,
      ] = await Promise.all([
        apiClient.from("products").select("id", { count: "exact", head: true }),
        apiClient.from("categories").select("id", { count: "exact", head: true }),
        apiClient.from("cities").select("id", { count: "exact", head: true }),
        apiClient.from("profiles").select("id", { count: "exact", head: true }),
        apiClient.from("product_reviews").select("id", { count: "exact", head: true }),
        apiClient.from("blog_posts").select("id", { count: "exact", head: true }),
        apiClient.from("video_reviews").select("id", { count: "exact", head: true }),
        apiClient.from("video_creators").select("id", { count: "exact", head: true }),
        apiClient.from("brand_spotlights").select("id", { count: "exact", head: true }),
        apiClient.from("cocktails").select("id", { count: "exact", head: true }),
        apiClient.from("product_reviews").select("id, created_at, title, reviewer_name, rating").order("created_at", { ascending: false }).limit(5),
        apiClient.from("blog_posts").select("id, created_at, title").order("created_at", { ascending: false }).limit(3),
        apiClient.from("categories").select("name, products(id)"),
      ]);

      setStats({
        products: products.count || 0,
        categories: categories.count || 0,
        cities: cities.count || 0,
        users: users.count || 0,
        reviews: reviews.count || 0,
        blogPosts: blogPosts.count || 0,
        videoReviews: videoReviews.count || 0,
        creators: creators.count || 0,
        brands: brands.count || 0,
        cocktails: cocktails.count || 0,
      });

      // Combine recent activity
      const activity: RecentActivity[] = [];
      if (recentReviews.data) {
        recentReviews.data.forEach((r) => {
          activity.push({
            id: r.id,
            type: "review",
            title: r.title || `${r.rating}★ review by ${r.reviewer_name || "Anonymous"}`,
            timestamp: r.created_at,
          });
        });
      }
      if (recentBlogPosts.data) {
        recentBlogPosts.data.forEach((p) => {
          activity.push({
            id: p.id,
            type: "blog",
            title: p.title,
            timestamp: p.created_at,
          });
        });
      }
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activity.slice(0, 8));

      // Process category data
      if (categoryStats.data) {
        setCategoryData(
          categoryStats.data
            .map((c: any) => ({
              name: c.name,
              value: c.products?.length || 0,
            }))
            .filter((c: any) => c.value > 0)
            .sort((a: any, b: any) => b.value - a.value)
            .slice(0, 6)
        );
      }

      // Generate sample data if GA not connected
      if (!gaConfigured) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        setWeeklyData(
          days.map((day, i) => ({
            day,
            pageViews: Math.floor(Math.random() * 400 + 200 + (i === 5 || i === 6 ? 150 : 0)),
            uniqueVisitors: Math.floor(Math.random() * 200 + 100 + (i === 5 || i === 6 ? 80 : 0)),
            sessions: Math.floor(Math.random() * 150 + 80),
          }))
        );
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      setMonthlyData(
        months.map((month, i) => ({
          month,
          users: Math.floor(50 + i * 15 + Math.random() * 30),
          reviews: Math.floor(20 + i * 8 + Math.random() * 15),
          products: Math.floor(30 + i * 10 + Math.random() * 20),
        }))
      );

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      setReviewTrends(
        days.map((day) => ({
          day,
          positive: Math.floor(Math.random() * 20 + 10),
          neutral: Math.floor(Math.random() * 10 + 5),
          negative: Math.floor(Math.random() * 5 + 2),
        }))
      );

      setLoading(false);
    };

    fetchDashboardData();
  }, [gaConfigured]);

  const statCards = [
    { label: "Products", value: stats.products, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+12%" },
    { label: "Categories", value: stats.categories, icon: Tag, color: "text-green-500", bg: "bg-green-500/10", trend: "+3%" },
    { label: "Users", value: stats.users, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", trend: "+28%" },
    { label: "Reviews", value: stats.reviews, icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10", trend: "+15%" },
    { label: "Blog Posts", value: stats.blogPosts, icon: FileText, color: "text-pink-500", bg: "bg-pink-500/10", trend: "+8%" },
    { label: "Video Reviews", value: stats.videoReviews, icon: Video, color: "text-red-500", bg: "bg-red-500/10", trend: "+22%" },
    { label: "Creators", value: stats.creators, icon: TrendingUp, color: "text-cyan-500", bg: "bg-cyan-500/10", trend: "+5%" },
    { label: "Cocktails", value: stats.cocktails, icon: BarChart3, color: "text-orange-500", bg: "bg-orange-500/10", trend: "+18%" },
  ];

  const chartConfig = {
    pageViews: { label: "Page Views", color: "hsl(var(--primary))" },
    uniqueVisitors: { label: "Unique Visitors", color: "hsl(var(--accent))" },
    sessions: { label: "Sessions", color: "hsl(142 76% 36%)" },
    users: { label: "Users", color: "hsl(var(--primary))" },
    reviews: { label: "Reviews", color: "hsl(var(--accent))" },
    products: { label: "Products", color: "hsl(142 76% 36%)" },
    positive: { label: "Positive", color: "hsl(142 76% 36%)" },
    neutral: { label: "Neutral", color: "hsl(38 92% 50%)" },
    negative: { label: "Negative", color: "hsl(0 84% 60%)" },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Analytics and insights for your platform</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="gap-1 px-3 py-1">
            <Activity className="w-3 h-3 animate-pulse text-green-500" />
            Live
          </Badge>
        </div>
      </div>

      {/* Google Analytics Status Banner */}
      {!gaConfigured && (
        <Alert className="border-blue-500/50 bg-blue-500/5">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Connect Google Analytics to see real traffic data. Currently showing sample data.
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/settings" className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Setup GA4
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {gaConfigured && gaData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-medium">Page Views</span>
              </div>
              <p className="text-2xl font-bold">{gaData.pageViews.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium">Unique Visitors</span>
              </div>
              <p className="text-2xl font-bold">{gaData.uniqueVisitors.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <MousePointer className="w-4 h-4" />
                <span className="text-xs font-medium">Sessions</span>
              </div>
              <p className="text-2xl font-bold">{gaData.sessions.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Bounce Rate</span>
              </div>
              <p className="text-2xl font-bold">{gaData.bounceRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ArrowUp className="w-3 h-3" />
                  {stat.trend}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Traffic Overview - Full Width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Traffic Overview
                </CardTitle>
                <CardDescription>Website visits and engagement metrics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="fillPageViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area type="monotone" dataKey="pageViews" stroke="hsl(var(--primary))" fill="url(#fillPageViews)" strokeWidth={2} />
                <Area type="monotone" dataKey="uniqueVisitors" stroke="hsl(var(--accent))" fill="url(#fillVisitors)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Product Categories
            </CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {categoryData.slice(0, 4).map((item, i) => (
                    <Badge key={item.name} variant="outline" className="text-xs">
                      <span className="w-2 h-2 rounded-full mr-1" style={{ background: COLORS[i] }} />
                      {item.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Growth Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Monthly Growth
            </CardTitle>
            <CardDescription>Users, reviews, and products over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="reviews" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="products" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Review Sentiment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Review Sentiment
            </CardTitle>
            <CardDescription>Breakdown of review ratings this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={reviewTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="positive" stackId="a" fill="hsl(142 76% 36%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="neutral" stackId="a" fill="hsl(38 92% 50%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="negative" stackId="a" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates and submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className={`p-2 rounded-full ${activity.type === 'review' ? 'bg-yellow-500/10' : 'bg-pink-500/10'}`}>
                      {activity.type === 'review' ? (
                        <Star className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-pink-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{activity.type}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-primary" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-green-600" />
                <span className="text-sm">Avg. Rating</span>
              </div>
              <span className="font-bold text-green-600">4.5 ★</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Active Products</span>
              </div>
              <span className="font-bold text-blue-600">{stats.products}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Total Users</span>
              </div>
              <span className="font-bold text-purple-600">{stats.users}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span className="text-sm">Cities Covered</span>
              </div>
              <span className="font-bold text-orange-600">{stats.cities}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-pink-500/10">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-pink-600" />
                <span className="text-sm">Brands</span>
              </div>
              <span className="font-bold text-pink-600">{stats.brands}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
