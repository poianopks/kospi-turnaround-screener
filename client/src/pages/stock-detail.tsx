import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  DollarSign,
  Moon,
  Sun,
  Database,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
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
  debtTotalPrev: number | null;
  equityTotalPrev: number | null;
  debtRatioPrev: number | null;
  debtRatioChange: number | null;
  netIncome: number | null;
  assetTotal: number | null;
  turnaroundScore: number | null;
  lastUpdated: string;
  dataYear: string;
  dataSource: string;
}

function formatEok(num: number | null): string {
  if (num === null) return "-";
  if (Math.abs(num) >= 10000) return `${(num / 10000).toFixed(1)}조`;
  return `${num.toLocaleString()}억`;
}

function MetricCard({
  label,
  value,
  subValue,
  trend,
}: {
  label: string;
  value: string;
  subValue?: string;
  trend?: "positive" | "negative" | "neutral";
}) {
  const trendColor =
    trend === "positive" ? "text-emerald-500" : trend === "negative" ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <span className="text-xs text-muted-foreground block mb-1">{label}</span>
      <span className={`text-base font-bold tabular-nums ${trendColor}`}>{value}</span>
      {subValue && <span className="text-xs text-muted-foreground block mt-0.5">{subValue}</span>}
    </div>
  );
}

export default function StockDetail() {
  const params = useParams<{ ticker: string }>();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const { data: stock, isLoading } = useQuery<StockData>({
    queryKey: ["/api/stocks", params.ticker],
    enabled: !!params.ticker,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">종목을 찾을 수 없습니다</p>
          <Link href="/">
            <button className="text-primary text-sm hover:underline">목록으로 돌아가기</button>
          </Link>
        </div>
      </div>
    );
  }

  const comparisonData = [
    {
      name: "매출액",
      [`${parseInt(stock.dataYear) - 1}년`]: stock.revenuePrev ?? 0,
      [`${stock.dataYear}년`]: stock.revenue ?? 0,
    },
    {
      name: "영업이익",
      [`${parseInt(stock.dataYear) - 1}년`]: stock.operatingProfitPrev ?? 0,
      [`${stock.dataYear}년`]: stock.operatingProfit ?? 0,
    },
  ];

  const prevKey = `${parseInt(stock.dataYear) - 1}년`;
  const currKey = `${stock.dataYear}년`;

  const debtData = [
    { name: `${parseInt(stock.dataYear) - 1}`, 부채비율: stock.debtRatioPrev ?? 0 },
    { name: stock.dataYear, 부채비율: stock.debtRatio ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button data-testid="back-button" className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold">{stock.name}</h1>
                <Badge variant="secondary" className="text-[10px]">{stock.ticker}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{stock.sector}</p>
            </div>
          </div>
          <button
            data-testid="theme-toggle-detail"
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Data Source */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
          <Database className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs text-primary/80">
            {stock.dataSource} | {stock.dataYear}년 사업보고서 확정 실적 | 업데이트: {stock.lastUpdated}
          </span>
        </div>

        {/* Turnaround Score */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">턴어라운드 점수</span>
              </div>
              <span className="text-2xl font-bold text-primary tabular-nums">
                {stock.turnaroundScore ?? "-"}
                <span className="text-sm text-muted-foreground font-normal">/100</span>
              </span>
            </div>
            <Progress value={stock.turnaroundScore ?? 0} className="h-2" />
          </CardContent>
        </Card>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label={`매출액 (${stock.dataYear})`}
            value={formatEok(stock.revenue)}
            subValue={stock.revenuePrev ? `전기: ${formatEok(stock.revenuePrev)}` : undefined}
          />
          <MetricCard
            label={`영업이익 (${stock.dataYear})`}
            value={formatEok(stock.operatingProfit)}
            subValue={stock.operatingProfitPrev ? `전기: ${formatEok(stock.operatingProfitPrev)}` : undefined}
            trend={stock.opGrowth !== null ? (stock.opGrowth > 0 ? "positive" : "negative") : undefined}
          />
          <MetricCard
            label="부채총계"
            value={formatEok(stock.debtTotal)}
            subValue={`자본총계: ${formatEok(stock.equityTotal)}`}
          />
          <MetricCard
            label="자산총계"
            value={formatEok(stock.assetTotal)}
            subValue={stock.netIncome !== null ? `당기순이익: ${formatEok(stock.netIncome)}` : undefined}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                실적 비교 (억원)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => [v.toLocaleString() + "억", ""]}
                    contentStyle={{
                      fontSize: 12, borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey={prevKey} fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey={currKey} fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                부채비율 변화 (%)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={debtData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, "auto"]} />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)}%`, "부채비율"]}
                    contentStyle={{
                      fontSize: 12, borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Bar dataKey="부채비율" radius={[3, 3, 0, 0]}>
                    {debtData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 1 ? "hsl(var(--chart-2))" : "hsl(var(--muted-foreground))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Growth Metrics */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-amber-500" />
              성장 지표 상세 (DART 확정 실적)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">매출 성장률</span>
                <div className="flex items-center gap-1">
                  {stock.revenueGrowth !== null && stock.revenueGrowth > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className={`text-lg font-bold tabular-nums ${stock.revenueGrowth !== null && stock.revenueGrowth > 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {stock.revenueGrowth !== null ? `${stock.revenueGrowth > 0 ? "+" : ""}${stock.revenueGrowth.toFixed(1)}%` : "-"}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatEok(stock.revenuePrev)} → {formatEok(stock.revenue)}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">영업이익 성장률</span>
                <div className="flex items-center gap-1">
                  {stock.opGrowth !== null && stock.opGrowth > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className={`text-lg font-bold tabular-nums ${stock.opGrowth !== null && stock.opGrowth > 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {stock.opGrowth !== null ? `${stock.opGrowth > 0 ? "+" : ""}${stock.opGrowth.toFixed(1)}%` : "-"}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatEok(stock.operatingProfitPrev)} → {formatEok(stock.operatingProfit)}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">부채비율 변화</span>
                <div className="flex items-center gap-1">
                  {stock.debtRatioChange !== null && stock.debtRatioChange < 0 ? (
                    <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className={`text-lg font-bold tabular-nums ${stock.debtRatioChange !== null && stock.debtRatioChange < 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {stock.debtRatioChange !== null ? `${stock.debtRatioChange > 0 ? "+" : ""}${stock.debtRatioChange.toFixed(1)}%p` : "-"}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {stock.debtRatioPrev !== null ? `${stock.debtRatioPrev.toFixed(1)}%` : "-"} → {stock.debtRatio !== null ? `${stock.debtRatio.toFixed(1)}%` : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-center pb-6 pt-2">
          <p>데이터 출처: DART 전자공시시스템 (금융감독원) | {stock.dataYear}년 사업보고서 확정 실적</p>
          <p className="mt-1">투자 판단의 책임은 투자자 본인에게 있습니다.</p>
        </div>
      </main>
    </div>
  );
}
