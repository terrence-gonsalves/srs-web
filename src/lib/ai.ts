import OpenAI from "openai";

type AISummaryResult = {
  summary: string;
  metrics: string[];
  trends: string[];
  recommendations: string[];
};

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY
// });

export async function summariseReport(
  rows: Record<string, any>[]
): Promise<AISummaryResult> {

  if (!process.env.OPENAI_API_KEY) {
    return {
      summary: "Sample summary based on provided report rows.",
      metrics: ["Total Records", "Average Value"],
      trends: ["Upwards trend detected"],
      recommendations: ["Review high-performing segments"]
    };
  }

  throw new Error("OpenAI integration not enabled yet");
}
