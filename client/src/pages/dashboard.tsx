import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Target,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Moon,
  Sun,
  Database,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface StockData {
  ticker: string;
  name: string;
  sector: string;
  revenue: number | null;
  revenuePrev: number | null;
  revenueGrowth: number | null;
  operatingProfit: number | null;
  operatingProfitPrev: number | null;
  opGrowth: number | null;
  debtTotal: number | null;
  equityTotal: number | null;
  debtRatio: number | null;
  debtRatioPrev: number | null;
  debtRatioChange: number | null;
  netIncome: number | null;
  turnaroundScore: number | null;
  lastUpdated: string;
  dataYear: string;
  dataSource: string;
}

interface SummaryData {
  totalStocks: number;
  avgTurnaroundScore: number;
  avgDebtRatioChange: number;
  avgRevenueGrowth: number;
  avgOpGrowth: number;
  lastUpdated: string;
  dataYear: number;
  dataSource: string;
}

function formatEok(num: number | null): string {
  if (num === null) return "-";
  if (Math.abs(num) >= 10000) return `${(num / 10000).toFixed(1)}조`;
  return `${num.toLocaleString()}억`;
}

function KPICard({
  title,
  value,
  suffix,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: string;
  suffix?: string;
  icon: any;
  trend?: "up" | "down";
  color: string;
}) {
  return (
    <Card data-testid={`kpi-${title}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
          <div className={`p-1.5 rounded-md ${color}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="flex items-end gap-1">
          <span className="text-xl font-bold tabular-nums">{value}</span>
          {suffix && (
            <span className="text-sm text-muted-foreground mb-0.5">{suffix}</span>
          )}
          {trend && (
            <span className="ml-auto">
              {trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-emerald-500" />
              )}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StockRow({ stock, rank }: { stock: StockData; rank: number }) {
  const revGrowth = stock.revenueGrowth;
  const opGrowth = stock.opGrowth;
  const debtChange = stock.debtRatioChange;

  return (
    <Link href={`/stock/${stock.ticker}`}>
      <div
        data-testid={`stock-row-${stock.ticker}`}
        className="grid grid-cols-[2.5rem_1fr_5.5rem_5.5rem_5.5rem_5.5rem_4rem] gap-2 items-center px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-0"
      >
        <span className="text-sm font-bold text-muted-foreground tabular-nums">
          #{rank}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{stock.name}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
              {stock.sector}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{stock.ticker}</span>
        </div>
        <div className="text-right">
          <span
            className={`text-sm font-semibold tabular-nums ${
              revGrowth !== null && revGrowth > 0 ? "text-emerald-500" : revGrowth !== null && revGrowth < 0 ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            {revGrowth !== null ? `${revGrowth > 0 ? "+" : ""}${revGrowth.toFixed(1)}%` : "-"}
          </span>
        </div>
        <div className="text-right">
          <span
            className={`text-sm font-semibold tabular-nums ${
              opGrowth !== null && opGrowth > 0 ? "text-emerald-500" : opGrowth !== null && opGrowth < 0 ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            {opGrowth !== null ? `${opGrowth > 0 ? "+" : ""}${opGrowth.toFixed(1)}%` : "-"}
          </span>
        </div>
        <div className="text-right">
          <span
            className={`text-sm font-semibold tabular-nums ${
              debtChange !== null && debtChange < 0 ? "text-emerald-500" : debtChange !== null && debtChange > 0 ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            {debtChange !== null ? `${debtChange > 0 ? "+" : ""}${debtChange.toFixed(1)}%p` : "-"}
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm tabular-nums text-muted-foreground">
            {stock.debtRatio !== null ? `${stock.debtRatio.toFixed(1)}%` : "-"}
          </span>
        </div>
        <div className="flex justify-end">
          <div className="flex items-center gap-1">
            <Progress
              value={stock.turnaroundScore ?? 0}
              className="h-1.5 w-10"
            />
            <span className="text-xs font-bold tabular-nums w-6 text-right">
              {stock.turnaroundScore ?? "-"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [sortBy, setSortBy] = useState<"score" | "opGrowth" | "debtChange" | "revenueGrowth">("score");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const { data: stocks, isLoading: stocksLoading } = useQuery<StockData[]>({
    queryKey: ["/api/stocks"],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryData>({
    queryKey: ["/api/summary"],
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
    setIsRefreshing(false);
  };

  const sortedStocks = stocks
    ? [...stocks].sort((a, b) => {
        switch (sortBy) {
          case "opGrowth":
            return (b.opGrowth ?? -999) - (a.opGrowth ?? -999);
          case "debtChange":
            return (a.debtRatioChange ?? 999) - (b.debtRatioChange ?? 999);
          case "revenueGrowth":
            return (b.revenueGrowth ?? -999) - (a.revenueGrowth ?? -999);
          default:
            return (b.turnaroundScore ?? 0) - (a.turnaroundScore ?? 0);
        }
      })
    : [];

  const chartData = sortedStocks
    .filter((s) => s.opGrowth !== null || s.revenueGrowth !== null)
    .map((s) => ({
      name: s.name.length > 5 ? s.name.slice(0, 5) + ".." : s.name,
      fullName: s.name,
      영업이익증가: s.opGrowth ?? 0,
      매출성장: s.revenueGrowth ?? 0,
    }));

  const radarData = sortedStocks.slice(0, 5).map((s) => ({
    subject: s.name.length > 4 ? s.name.slice(0, 4) + ".." : s.name,
    score: s.turnaroundScore ?? 0,
    매출성장: Math.min(Math.max((s.revenueGrowth ?? 0) * 3, 0), 100),
    영업이익: Math.min(Math.max(s.opGrowth ?? 0, 0), 100),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">KOSPI 턴어라운드 스크리너</h1>
              <p className="text-xs text-muted-foreground">
                DART 공시 실시간 연동 | 부채비율 + 영업이익 + 매출 분석
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Database className="h-3 w-3" />
              <span>DART 연동</span>
            </div>
            <button
              data-testid="refresh-button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              aria-label="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              data-testid="theme-toggle"
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Data Source Banner */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
          <Database className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs text-primary/80">
            데이터 출처: DART 전자공시시스템 (opendart.fss.or.kr) | 
            사업보고서 기준 {summary?.dataYear ?? "2024"}년 확정 실적 | 
            업데이트: {summary?.lastUpdated ?? "..."}
          </span>
        </div>

        {/* KPI Cards */}
        {summaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KPICard
              title="종목 수"
              value={summary.totalStocks.toString()}
              suffix="개"
              icon={BarChart3}
              color="bg-primary/10 text-primary"
            />
            <KPICard
              title="평균 턴어라운드"
              value={summary.avgTurnaroundScore.toString()}
              suffix="/100"
              icon={Target}
              color="bg-emerald-500/10 text-emerald-500"
            />
            <KPICard
              title="평균 부채비율 변화"
              value={summary.avgDebtRatioChange > 0 ? `+${summary.avgDebtRatioChange}` : summary.avgDebtRatioChange.toString()}
              suffix="%p"
              icon={TrendingDown}
              trend={summary.avgDebtRatioChange < 0 ? "down" : undefined}
              color="bg-emerald-500/10 text-emerald-500"
            />
            <KPICard
              title="평균 매출 성장률"
              value={`${summary.avgRevenueGrowth > 0 ? "+" : ""}${summary.avgRevenueGrowth}`}
              suffix="%"
              icon={TrendingUp}
              trend={summary.avgRevenueGrowth > 0 ? "up" : undefined}
              color="bg-blue-500/10 text-blue-500"
            />
            <KPICard
              title="평균 영업이익 성장"
              value={`${summary.avgOpGrowth > 0 ? "+" : ""}${summary.avgOpGrowth}`}
              suffix="%"
              icon={DollarSign}
              trend={summary.avgOpGrowth > 0 ? "up" : undefined}
              color="bg-amber-500/10 text-amber-500"
            />
          </div>
        ) : null}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">영업이익 증가율 vs 매출 성장률 (DART 확정)</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              {stocksLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                      contentStyle={{
                        fontSize: 12, borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--card))",
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                    <Bar dataKey="영업이익증가" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="매출성장" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">TOP 5 턴어라운드 레이더</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              {stocksLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar name="점수" dataKey="score" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.2} />
                    <Radar name="영업이익" dataKey="영업이익" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.15} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stock Table */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">턴어라운드 종목 TOP 10 (DART 확정 실적)</CardTitle>
              <div className="flex gap-1">
                {([
                  { key: "score", label: "점수순" },
                  { key: "opGrowth", label: "영업이익순" },
                  { key: "debtChange", label: "부채감소순" },
                  { key: "revenueGrowth", label: "매출성장순" },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    data-testid={`sort-${opt.key}`}
                    onClick={() => setSortBy(opt.key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      sortBy === opt.key
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid grid-cols-[2.5rem_1fr_5.5rem_5.5rem_5.5rem_5.5rem_4rem] gap-2 items-center px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
              <span>#</span>
              <span>종목</span>
              <span className="text-right">매출성장</span>
              <span className="text-right">영업이익</span>
              <span className="text-right">부채변동</span>
              <span className="text-right">부채비율</span>
              <span className="text-right">Score</span>
            </div>
            {stocksLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : (
              sortedStocks.map((stock, idx) => (
                <StockRow key={stock.ticker} stock={stock} rank={idx + 1} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center pb-6 space-y-1">
          <p>데이터 출처: DART 전자공시시스템 (금융감독원) - 사업보고서 확정 실적</p>
          <p>본 앱은 투자 참고용이며, 투자 결정의 책임은 투자자 본인에게 있습니다.</p>
        </div>
      </main>
    </div>
  );
}
