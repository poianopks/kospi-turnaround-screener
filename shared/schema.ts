import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stocks = sqliteTable("stocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  // Financial metrics - current year
  revenue2025: real("revenue_2025").notNull(),
  revenue2026E: real("revenue_2026e").notNull(),
  revenueGrowth: real("revenue_growth").notNull(), // %
  operatingProfit2025: real("operating_profit_2025").notNull(),
  operatingProfit2026E: real("operating_profit_2026e").notNull(),
  opGrowth: real("op_growth").notNull(), // %
  debtRatio2024: real("debt_ratio_2024").notNull(), // %
  debtRatio2025: real("debt_ratio_2025").notNull(), // %
  debtRatioChange: real("debt_ratio_change").notNull(), // % point
  // Valuation
  per: real("per"),
  pbr: real("pbr"),
  marketCap: real("market_cap"), // 억원
  currentPrice: integer("current_price"),
  // Turnaround score (0-100)
  turnaroundScore: integer("turnaround_score").notNull(),
  // Additional info
  analystTarget: integer("analyst_target"),
  recommendation: text("recommendation"), // BUY, HOLD, SELL
  keyPoint: text("key_point").notNull(), // 핵심 투자포인트
  riskFactor: text("risk_factor").notNull(), // 리스크 요인
  lastUpdated: text("last_updated").notNull(),
});

export const insertStockSchema = createInsertSchema(stocks).omit({ id: true });
export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stocks.$inferSelect;
