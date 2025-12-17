import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function summarizeReport(sampleRows: any[]) {

  // placeholder
  return {
    summary: "AI summary placeholder",
    insights: []
  };
}
