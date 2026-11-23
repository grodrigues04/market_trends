import "server-only";

import { connection } from "next/server";

import { getDatabase } from "@/lib/database";

export type ResearchStatus = "running" | "completed" | "failed";

// A = complete edition (Thursday), B = daily edition with limits (Monday to Wednesday)
export type ResearchEdition = "A" | "B";

export type ResearchPart = {
  number: number;
  title: string;
  slug: string;
  markdown: string;
  complete: boolean;
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
  summary: string;
  parts: ResearchPart[];
  recommendations: Recommendation[];
  top_opportunities: TopOpportunity[];
  // What the limits of the edition cut (countries not researched, usage limit reached)
  notices?: string[];
  started_at?: Date;
  finished_at?: Date;
  error?: string;
};

export type ResearchSummary = Pick<
  Research,
  "date" | "edition" | "status" | "title" | "summary" | "started_at" | "finished_at"
> & {
  part_count: number;
};

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
    { sort: { date: -1 }, projection: { _id: 0 } },
  );
}

export async function getResearch(date: string): Promise<Research | null> {
  if (!REAL_DATE.test(date)) {
    return null;
  }
  const collection = await researches();
  return collection.findOne({ date }, { projection: { _id: 0 } });
}

export async function getRunningResearch(): Promise<ResearchSummary | null> {
  const collection = await researches();
  const research = await collection.findOne(
    { date: { $regex: REAL_DATE.source }, status: "running" },
    { sort: { date: -1 }, projection: { _id: 0, parts: 0 } },
  );
  return research ? { ...research, part_count: 0 } : null;
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
          summary: 1,
          started_at: 1,
          finished_at: 1,
          part_count: { $size: { $ifNull: ["$parts", []] } },
        },
      },
    ])
    .toArray();
}
