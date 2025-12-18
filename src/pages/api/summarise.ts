import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { summariseReport } from "@/lib/ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reportId } = req.body;

  if (!reportId) {
    return res.status(400).json({ error: "Missing reportId" });
  }

  const { data: samples, error } = await supabaseAdmin
    .from("report_row_samples")
    .select("sample_rows")
    .eq("report_id", reportId)
    .single();

  if (error) {
    console.error("Supabase error: ", error);
    return res.status(500).json({ error: "Failed to fetch row samples" });
  }

  if (!samples) {
    return res.status(404).json({ error: "No samples found for report" });
  }

  const aiResult = await summariseReport(samples.sample_rows);

  await supabaseAdmin.from("summaries").insert({
    report_id: reportId,
    summary_text: aiResult.summary
  });

  return res.status(200).json({ success: true });
}
