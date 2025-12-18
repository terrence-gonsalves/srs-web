import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { summariseReport } from "@/lib/ai";

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createSupabaseServerClient(req);

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  const { reportId } = req.body;

  if (!reportId) {
    return res.status(400).json({ error: "Missing reportId" });
  }

  const { data: samples, error } = await supabase
    .from("report_row_samples")
    .select("sample_rows")
    .eq("report_id", reportId)
    .single();

  if (error || !samples) {
    return res.status(404).json({ error: "Report samples not found" });
  }

  const aiResult = await summariseReport(samples.sample_rows);

  const { error: insertError } = await supabase.from("summaries").insert({
    report_id: reportId,
    user_id: user.id,
    summary_text: aiResult.summary
  });

  if (insertError) {
    console.error(insertError);
    return res.status(500).json({ error: "Failed to save summaries" });
  }

  return res.status(200).json({ success: true });
}
