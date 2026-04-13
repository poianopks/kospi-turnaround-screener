import type { Express } from "express";
import { createServer, type Server } from "http";
import { fetchAllStockFinancials, fetchSingleStockFinancials, STOCK_LIST } from "./dart-service";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Get all stocks with DART real-time data
  app.get("/api/stocks", async (_req, res) => {
    try {
      const year = parseInt(_req.query.year as string) || 2024;
      const stocks = await fetchAllStockFinancials(year);
      res.json(stocks);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      res.status(500).json({ message: "데이터 조회 실패" });
    }
  });

  // Get single stock by ticker
  app.get("/api/stocks/:ticker", async (req, res) => {
    try {
      const ticker = req.params.ticker;
      const year = parseInt(req.query.year as string) || 2024;
      const stockInfo = STOCK_LIST.find((s) => s.ticker === ticker);
      if (!stockInfo) {
        return res.status(404).json({ message: "종목을 찾을 수 없습니다" });
      }
      const data = await fetchSingleStockFinancials(
        stockInfo.corpCode, stockInfo.ticker, stockInfo.name, stockInfo.sector, year
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ message: "데이터 조회 실패" });
    }
  });

  // Get market summary stats
  app.get("/api/summary", async (_req, res) => {
    try {
      const year = parseInt(_req.query.year as string) || 2024;
      const allStocks = await fetchAllStockFinancials(year);
      
      const withScore = allStocks.filter((s) => s.turnaroundScore !== null);
      const withDebt = allStocks.filter((s) => s.debtRatioChange !== null);
      const withRev = allStocks.filter((s) => s.revenueGrowth !== null);
      const withOp = allStocks.filter((s) => s.opGrowth !== null);

      const avgScore = withScore.length > 0
        ? Math.round(withScore.reduce((sum, s) => sum + (s.turnaroundScore ?? 0), 0) / withScore.length * 10) / 10
        : 0;
      const avgDebtChange = withDebt.length > 0
        ? Math.round(withDebt.reduce((sum, s) => sum + (s.debtRatioChange ?? 0), 0) / withDebt.length * 10) / 10
        : 0;
      const avgRevGrowth = withRev.length > 0
        ? Math.round(withRev.reduce((sum, s) => sum + (s.revenueGrowth ?? 0), 0) / withRev.length * 10) / 10
        : 0;
      const avgOpGrowth = withOp.length > 0
        ? Math.round(withOp.reduce((sum, s) => sum + (s.opGrowth ?? 0), 0) / withOp.length * 10) / 10
        : 0;

      res.json({
        totalStocks: allStocks.length,
        avgTurnaroundScore: avgScore,
        avgDebtRatioChange: avgDebtChange,
        avgRevenueGrowth: avgRevGrowth,
        avgOpGrowth: avgOpGrowth,
        lastUpdated: new Date().toISOString().split("T")[0],
        dataYear: year,
        dataSource: "DART 전자공시시스템 (실시간)",
      });
    } catch (error) {
      console.error("Error fetching summary:", error);
      res.status(500).json({ message: "데이터 조회 실패" });
    }
  });

  return httpServer;
}
