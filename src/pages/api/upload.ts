import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { parseCsv } from "@/lib/csv";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const config = {
    api: { bodyParser: false }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.status(405).end();

    const form = formidable();
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const csvText = fs.readFileSync(file.filepath, "utf8");
    const { rows, columns } = parseCsv(csvText);

    const userId = fields.userId?.[0];

    const { data: report } = await supabaseAdmin
        .from("reports")
        .insert({
        user_id: userId,
        num_rows: rows.length,
        columns,
        status: "parsed"
        })
        .select()
        .single();

    await supabaseAdmin.from("report_row_samples").insert({
        report_id: report.id,
        sample_rows: rows.slice(0, 10)
    });

     res.json({ reportId: report.id });
}
