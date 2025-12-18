import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function summariseReport(sampleRows: any[]) {

  // placeholder
  return {
    summary: "AI summary placeholder",
    insights: []
  };
}
