const DART_API_KEY = "34019f9d4f75b3751e3f00fbb0507ba9d3d2f684";
const BASE_URL = "https://opendart.fss.or.kr/api";

// 10 turnaround stocks with corp_codes
export const STOCK_LIST = [
  { ticker: "034020", corpCode: "00159616", name: "두산에너빌리티", sector: "기계/전력기기" },
  { ticker: "009540", corpCode: "00164830", name: "HD한국조선해양", sector: "조선" },
  { ticker: "010130", corpCode: "00102858", name: "고려아연", sector: "비철금속" },
  { ticker: "000150", corpCode: "00117212", name: "두산", sector: "복합기업" },
  { ticker: "047050", corpCode: "00124504", name: "포스코인터내셔널", sector: "상사/자본재" },
  { ticker: "005490", corpCode: "00155319", name: "POSCO홀딩스", sector: "철강/지주" },
  { ticker: "000120", corpCode: "00113410", name: "CJ대한통운", sector: "운수/창고" },
  { ticker: "267250", corpCode: "01205709", name: "HD현대", sector: "지주/조선" },
  { ticker: "010950", corpCode: "00138279", name: "S-Oil", sector: "정유/화학" },
  { ticker: "000210", corpCode: "00109693", name: "DL", sector: "복합기업" },
];

interface DartFinancialItem {
  account_nm: string;
  thstrm_amount: string;
  frmtrm_amount: string;
  fs_div: string;
}

interface StockFinancials {
  ticker: string;
  name: string;
  sector: string;
  // Current year (2024)
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

function parseAmount(s: string | undefined): number | null {
  if (!s) return null;
  const cleaned = s.replace(/,/g, "").trim();
  if (cleaned === "" || cleaned === "-") return null;
  const num = parseInt(cleaned);
  return isNaN(num) ? null : num;
}

function toEok(value: number | null): number | null {
  if (value === null) return null;
  return Math.round(value / 100000000);
}

function calcGrowth(current: number | null, prev: number | null): number | null {
  if (current === null || prev === null || prev === 0) return null;
  return Math.round(((current - prev) / Math.abs(prev)) * 1000) / 10;
}

function calcDebtRatio(debt: number | null, equity: number | null): number | null {
  if (debt === null || equity === null || equity === 0) return null;
  return Math.round((debt / equity) * 1000) / 10;
}

function calcTurnaroundScore(data: {
  revenueGrowth: number | null;
  opGrowth: number | null;
  debtRatioChange: number | null;
}): number {
  let score = 50; // base

  // Revenue growth (max +15)
  if (data.revenueGrowth !== null) {
    if (data.revenueGrowth > 20) score += 15;
    else if (data.revenueGrowth > 10) score += 12;
    else if (data.revenueGrowth > 5) score += 8;
    else if (data.revenueGrowth > 0) score += 5;
    else score -= 5;
  }

  // OP growth (max +25)
  if (data.opGrowth !== null) {
    if (data.opGrowth > 100) score += 25;
    else if (data.opGrowth > 50) score += 20;
    else if (data.opGrowth > 20) score += 15;
    else if (data.opGrowth > 0) score += 8;
    else score -= 10;
  }

  // Debt ratio change (max +10)
  if (data.debtRatioChange !== null) {
    if (data.debtRatioChange < -20) score += 10;
    else if (data.debtRatioChange < -10) score += 8;
    else if (data.debtRatioChange < -5) score += 5;
    else if (data.debtRatioChange < 0) score += 3;
    else score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

// Cache to avoid hitting API too frequently
let cachedData: StockFinancials[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function fetchSingleStockFinancials(
  corpCode: string,
  ticker: string,
  name: string,
  sector: string,
  year: number = 2024
): Promise<StockFinancials> {
  const url = `${BASE_URL}/fnlttSinglAcnt.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011`;

  try {
    const res = await fetch(url);
    const data = await res.json() as any;

    if (data.status !== "000" || !data.list) {
      return createEmptyResult(ticker, name, sector, year);
    }

    let revenue: number | null = null;
    let revenuePrev: number | null = null;
    let op: number | null = null;
    let opPrev: number | null = null;
    let debt: number | null = null;
    let debtPrev: number | null = null;
    let equity: number | null = null;
    let equityPrev: number | null = null;
    let netIncome: number | null = null;
    let assetTotal: number | null = null;

    // Prefer CFS (consolidated), fallback to OFS
    const cfsList = data.list.filter((item: any) => item.fs_div === "CFS");
    const items = cfsList.length > 0 ? cfsList : data.list;

    for (const item of items) {
      const nm = item.account_nm;
      if (nm === "매출액" || nm === "수익(매출액)" || nm === "영업수익") {
        if (revenue === null) {
          revenue = parseAmount(item.thstrm_amount);
          revenuePrev = parseAmount(item.frmtrm_amount);
        }
      } else if (nm === "영업이익") {
        if (op === null) {
          op = parseAmount(item.thstrm_amount);
          opPrev = parseAmount(item.frmtrm_amount);
        }
      } else if (nm === "부채총계") {
        if (debt === null) {
          debt = parseAmount(item.thstrm_amount);
          debtPrev = parseAmount(item.frmtrm_amount);
        }
      } else if (nm === "자본총계") {
        if (equity === null) {
          equity = parseAmount(item.thstrm_amount);
          equityPrev = parseAmount(item.frmtrm_amount);
        }
      } else if (nm === "당기순이익(손실)" || nm === "당기순이익") {
        if (netIncome === null) {
          netIncome = parseAmount(item.thstrm_amount);
        }
      } else if (nm === "자산총계") {
        if (assetTotal === null) {
          assetTotal = parseAmount(item.thstrm_amount);
        }
      }
    }

    const debtRatio = calcDebtRatio(debt, equity);
    const debtRatioPrev = calcDebtRatio(debtPrev, equityPrev);
    const debtRatioChange = debtRatio !== null && debtRatioPrev !== null
      ? Math.round((debtRatio - debtRatioPrev) * 10) / 10
      : null;
    const revenueGrowth = calcGrowth(revenue, revenuePrev);
    const opGrowth = calcGrowth(op, opPrev);

    const turnaroundScore = calcTurnaroundScore({ revenueGrowth, opGrowth, debtRatioChange });

    return {
      ticker,
      name,
      sector,
      revenue: toEok(revenue),
      revenuePrev: toEok(revenuePrev),
      revenueGrowth,
      operatingProfit: toEok(op),
      operatingProfitPrev: toEok(opPrev),
      opGrowth,
      debtTotal: toEok(debt),
      equityTotal: toEok(equity),
      debtRatio,
      debtTotalPrev: toEok(debtPrev),
      equityTotalPrev: toEok(equityPrev),
      debtRatioPrev,
      debtRatioChange,
      netIncome: toEok(netIncome),
      assetTotal: toEok(assetTotal),
      turnaroundScore,
      lastUpdated: new Date().toISOString().split("T")[0],
      dataYear: `${year}`,
      dataSource: "DART 전자공시시스템",
    };
  } catch (error) {
    console.error(`Error fetching ${name}:`, error);
    return createEmptyResult(ticker, name, sector, year);
  }
}

function createEmptyResult(ticker: string, name: string, sector: string, year: number): StockFinancials {
  return {
    ticker, name, sector,
    revenue: null, revenuePrev: null, revenueGrowth: null,
    operatingProfit: null, operatingProfitPrev: null, opGrowth: null,
    debtTotal: null, equityTotal: null, debtRatio: null,
    debtTotalPrev: null, equityTotalPrev: null, debtRatioPrev: null,
    debtRatioChange: null, netIncome: null, assetTotal: null,
    turnaroundScore: null,
    lastUpdated: new Date().toISOString().split("T")[0],
    dataYear: `${year}`,
    dataSource: "DART 전자공시시스템",
  };
}

export async function fetchAllStockFinancials(year: number = 2024): Promise<StockFinancials[]> {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
    return cachedData;
  }

  const results: StockFinancials[] = [];

  for (const stock of STOCK_LIST) {
    const data = await fetchSingleStockFinancials(
      stock.corpCode, stock.ticker, stock.name, stock.sector, year
    );
    results.push(data);
    // Small delay to respect API rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  // Sort by turnaround score descending
  results.sort((a, b) => (b.turnaroundScore ?? 0) - (a.turnaroundScore ?? 0));

  cachedData = results;
  cacheTimestamp = now;

  return results;
}
