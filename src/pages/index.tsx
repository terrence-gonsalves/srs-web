import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Salesforce Report Summarizer</h1>
      <Link href="/upload" className="text-blue-600 underline">Upload report</Link>
    </main>
  );
}