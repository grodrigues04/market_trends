import "server-only";

import { connection } from "next/server";

import { getDatabase } from "@/lib/database";

export type ResearchStatus = "running" | "completed" | "failed";

// A = complete edition (Thursday), B = daily edition with limits (Monday to Wednesday)
export type ResearchEdition = "A" | "B";

// Growth stage of a trend, as the research writes it
export type TrendStage =
  | "Consolidada"
  | "Em crescimento"
  | "Emergente"
  | "Viral"
  | "Mercado carente"
  | "Em declínio";

export type CountryTrend = {
  // Number of the niche in the brief (1 to 25), see NICHES
  niche: number;
  subniche: string;
  trend: string;
  stage?: TrendStage | string | null;
  longevity?: string | null;
  platforms?: string | null;
  evidence?: string | null;
  source_url?: string | null;
  source_date?: string | null;
};

export type ContentFormat = {
  format: string;
  platforms?: string | null;
  example?: string | null;
  source_url?: string | null;
};

export type CountryOpportunity = {
  opportunity: string;
  type?: string | null;
  niche: number;
  audience?: string | null;
  problem?: string | null;
  monetization?: string | null;
  competition?: string | null;
  brazil_potential?: string | null;
  source_url?: string | null;
};

// The tables of one country, or `skipped` when the country was not researched in the edition
export type CountryTables = {
  number: number;
  country: string;
  skipped?: string;
  trends?: CountryTrend[];
  content_formats?: ContentFormat[];
  opportunities?: CountryOpportunity[];
};

export type ComparisonRow = {
  trend: string;
  countries: string[];
  pattern: string;
  leader?: string | null;
  note?: string | null;
};

export type ContentOpportunity = {
  rank: number;
  theme: string;
  audience?: string | null;
  positioning?: string | null;
  platforms?: string | null;
  ideas: string[];
  hooks: string[];
  monetization?: string | null;
  example?: string | null;
};

export type BusinessOpportunity = {
  rank: number;
  concept: string;
  problem?: string | null;
  audience?: string | null;
  mvp?: string | null;
  monetization?: string | null;
  competitors?: string | null;
  complexity?: string | null;
  brazil_potential?: string | null;
};

export type RecommendationItem = {
  name: string;
  description: string;
  country?: string | null;
  niche?: string | null;
  evidence_url?: string | null;
};

export type Recommendation = {
  key: string;
  title: string;
  items: RecommendationItem[];
};

export type TopOpportunity = {
  rank: number;
  opportunity: string;
  country: string;
  niche: string;
  subniche?: string;
  evidence?: string | null;
  evidence_url?: string | null;
  growth_stage?: string;
  competition?: string;
  monetization?: string;
  brazil_potential?: string;
  score?: number;
};

export type Research = {
  date: string;
  edition?: ResearchEdition;
  status: ResearchStatus;
  title: string;
  recommendations: Recommendation[];
  top_opportunities: TopOpportunity[];
  // Saved since only tables are published; the older editions have only the two above (their text,
  // summary and parts, stays in MongoDB and is not shown)
  countries?: CountryTables[];
  comparison?: ComparisonRow[];
  content_opportunities?: ContentOpportunity[];
  business_opportunities?: BusinessOpportunity[];
  // What the limits of the edition cut (countries not researched, usage limit reached)
  notices?: string[];
  started_at?: Date;
  finished_at?: Date;
  error?: string;
};

export type ResearchSummary = Pick<Research, "date" | "edition" | "status" | "title" | "started_at" | "finished_at"> & {
  // Countries with tables (0 in the editions saved before the tables)
  country_count: number;
};

// The text of the older editions is never read by the blog
const TABLES_ONLY = { _id: 0, parts: 0, summary: 0 } as const;

// Test runs are saved as "teste-<timestamp>" and never show up in the blog
const REAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

async function researches() {
  await connection();
  const database = await getDatabase();
  return database.collection<Research>("researches");
}

export async function getLatestResearch(edition?: ResearchEdition): Promise<Research | null> {
  const collection = await researches();
  return collection.findOne(
    { date: { $regex: REAL_DATE.source }, status: "completed", ...(edition ? { edition } : {}) },
    { sort: { date: -1 }, projection: TABLES_ONLY },
  );
}

export async function getResearch(date: string): Promise<Research | null> {
  if (!REAL_DATE.test(date)) {
    return null;
  }
  const collection = await researches();
  return collection.findOne({ date }, { projection: TABLES_ONLY });
}

export async function getRunningResearch(): Promise<ResearchSummary | null> {
  const collection = await researches();
  const research = await collection.findOne(
    { date: { $regex: REAL_DATE.source }, status: "running" },
    { sort: { date: -1 }, projection: { _id: 0, date: 1, edition: 1, status: 1, title: 1, started_at: 1 } },
  );
  return research ? { ...research, country_count: 0 } : null;
}

export async function listResearches(): Promise<ResearchSummary[]> {
  const collection = await researches();
  return collection
    .aggregate<ResearchSummary>([
      { $match: { date: { $regex: REAL_DATE.source } } },
      { $sort: { date: -1 } },
      { $limit: 400 },
      {
        $project: {
          _id: 0,
          date: 1,
          edition: 1,
          status: 1,
          title: 1,
          started_at: 1,
          finished_at: 1,
          country_count: {
            $size: {
              $filter: { input: { $ifNull: ["$countries", []] }, cond: { $not: ["$$this.skipped"] } },
            },
          },
        },
      },
    ])
    .toArray();
}
