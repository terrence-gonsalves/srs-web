import { supabaseAdmin } from "@/lib/supabaseServer";
import { summarizeReport } from "@/lib/ai";

export default async function handler(req, res) {
  const { reportId } = req.body;

  const { data: samples } = await supabaseAdmin
    .from("report_row_samples")
    .select("sample_rows")
    .eq("report_id", reportId)
    .single();

  const aiResult = await summarizeReport(samples.sample_rows);

  await supabaseAdmin.from("summaries").insert({
    report_id: reportId,
    summary_text: aiResult.summary
  });

  res.json({ success: true });
}
