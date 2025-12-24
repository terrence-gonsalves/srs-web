import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Report {
    id: string;
    title: string;
    num_rows: number;
    columns: string[];
    status: string;
    uploaded_at: string;
    summary_id: string | null;
}

interface Summary {
    summary: string;
    metrics: string[];
    trends: string[];
    recommendations: string[];
}

function ReportPage() {
    const router = useRouter();
    const { id } = router.query;
    const [report, setReport] = useState<Report | null>(null);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");

    const loadReport = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const { data: reportData, error: reportError } = await supabase
                .from("reports")
                .select("*")
                .eq("id", id)
                .single();
            
            if (reportError) throw reportError;
            if (!reportData) throw new Error("Report not found");

            setReport(reportData);

            // load summary if it exists
            if (reportData.summary_id) {
                const { data: summaryData, error: summaryError } = await supabase
                    .from("summaries")
                    .select("summary_struct")
                    .eq("id", reportData.summary_id)
                    .single();

                if (!summaryError && summaryData) {
                    setSummary(summaryData.summary_struct as Summary)
                }
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "Failed to load report";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadReport();
        }
    }, [id, loadReport]);

    const generateSummary = async () => {
        if (!id) {
            setError("No report ID found");

            return;
        }

        try {
            setGenerating(true);
            setError("");

            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setError("You must be logged in");

                return;
            }

            console.log("Generating summary for report: ", id);

            const { data: samples, error: samplesError }=  await supabase
                .from("report_row_samples")
                .select("sample_rows")
                .eq("report_id", id)
                .single();

            if (samplesError || !samples) {
                throw new Error("Failed to fetch report data");
            }

            const proxyUrl = process.env.NEXT_PUBLIC_CLAUDE_PROXY_URL;

            if (!proxyUrl) {
                throw new Error("Claude proxy not configured. Please add NEXT_PUBLIC_CLAUDE_PROXY_URL to your .env.local file");
            }

            // create iframe to communicate with proxy
            const aiResult = await callClaudeViaProxy(proxyUrl, samples.sample_rows.rows);

            // save to DB
            const { data: summaryData, error: summaryError } = await supabase
                .from("summaries")
                .insert({
                    report_id: id,
                    user_id: session.user.id,
                    summary_text: aiResult.summary,
                    summary_struct: aiResult,
                    model: "claude-sonnet-4-20250514",
                    tokens_used: 0,
                })
                .select()
                .single()

            if (summaryError) {
                throw new Error("Failed to save summary");
            }

            await supabase
                .from("reports")
                .update({
                    status: "summarised",
                    summary_id: summaryData.id,
                })
                .eq("id", id)

            setSummary(aiResult);

            // const response = await fetch("/api/summarise", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json",
            //         Authorization: `Bearer ${session.access_token}`,
            //     },
            //     body: JSON.stringify({ reportId: String(id) }),
            // });

            // const data = await response.json();

            // if (!response.ok) {
            //     throw new Error(data.error || "Failed to generate summary");
            // }

            // setSummary(data.summary);

            // reload report to get update status
            await loadReport();
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "Failed to generate summary";
            setError(errorMessage);
        } finally {
            setGenerating(false);
        }
    };

    // helper function
    const callClaudeViaProxy = (proxyUrl: string, rows: Record<string, unknown>[]): Promise<Summary> => {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');

            iframe.src = proxyUrl;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            const requestId = Math.random().toString(36);
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Claude API request timeout (30s). Please try again.'));
            }, 30000);

            function cleanup() {
                clearTimeout(timeout);
                window.removeEventListener('message', handleMessage);
                document.body.removeChild(iframe);
            }

            function handleMessage(event: MessageEvent) {
                if (event.data.requestId === requestId) {
                    if (event.data.type === 'SUMMARISE_RESPONSE') {
                        cleanup();
                        resolve(event.data.result);
                    } else if (event.data.type === 'SUMMARISE_ERROR') {
                        cleanup();
                        reject(new Error(event.data.error));
                    }
                }
            }

            window.addEventListener('message', handleMessage);

            iframe.onload = () => {
                iframe.contentWindow?.postMessage({
                    type: "SUMMARISE_REQUEST",
                    requestId: requestId,
                    rows: rows.slice(0, 50)
                }, '*');
            };
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading report...</p>
                </div>
            </div>
        );
    }

    if (error && !report) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                    <div className="text-red-600 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">Error Loading Report</h2>

                    <p className="text-gray-600 text-center mb-6">{error}</p>

                    <Link href="/upload" className="block w-full text-center bg-black text-white py-3 rounded-lg hover:bg-gray-800">
                        Upload New Report
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">            
            <header className="border-b border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">RB</span>
                        </div>

                        <span className="text-xl font-bold text-gray-900">ReportBrief</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <Link href="/upload" className="text-gray-600 hover:text-gray-900">
                            New Report
                        </Link>

                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>
            
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {report?.title || "Untitled Report"}
                            </h1>

                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>📊 {report?.num_rows.toLocaleString()} rows</span>
                                <span>📋 {report?.columns.length} columns</span>
                                <span>📅 {new Date(report?.uploaded_at || "").toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                report?.status === "summarized" 
                                    ? "bg-green-100 text-green-800"
                                    : report?.status === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}>
                                {report?.status}
                            </span>
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Columns:</h3>

                        <div className="flex flex-wrap gap-2">
                            {report?.columns.map((col, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                                >
                                    {col}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                
                {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800">{error}</p>
                </div>
                )}
                
                {!summary && report?.status !== "summarised" && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                                />
                            </svg>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Ready to analyze
                        </h2>

                        <p className="text-gray-600 mb-6">
                            Generate an AI-powered summary with key metrics, trends, and recommendations.
                        </p>
                        
                        <button
                            onClick={generateSummary}
                            disabled={generating}
                            className={`w-full py-3 px-6 rounded-lg font-medium ${
                            generating
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-black text-white hover:bg-gray-800"
                            }`}
                        >
                            {generating ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle 
                                        className="opacity-25" 
                                        cx="12" 
                                        cy="12" 
                                        r="10" 
                                        stroke="currentColor" 
                                        strokeWidth="4"
                                    ></circle>
                                    <path 
                                        className="opacity-75" 
                                        fill="currentColor" 
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>

                                Generating summary...
                            </span>
                            ) : (
                            "Generate AI Summary"
                            )}
                        </button>
                    </div>
                </div>
                )}
                
                {summary && (
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                📄
                            </span>
                            Executive Summary
                        </h2>

                        <p className="text-gray-700 leading-relaxed">{summary.summary}</p>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                📊
                            </span>
                            Key Metrics
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            {summary.metrics.map((metric, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-gray-700">{metric}</p>
                            </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                📈
                            </span>
                            Notable Trends
                        </h2>

                        <ul className="space-y-3">
                            {summary.trends.map((trend, idx) => (
                            <li key={idx} className="flex items-start">
                                <span className="text-purple-600 mr-2 mt-1">•</span>
                                <span className="text-gray-700">{trend}</span>
                            </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                💡  
                            </span>
                            Actionable Recommendations
                        </h2>

                        <ul className="space-y-3">
                            {summary.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start">
                                <span className="text-orange-600 mr-2 mt-1">→</span>
                                <span className="text-gray-700">{rec}</span>
                            </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 font-medium"
                            >
                                🖨️ Print Summary
                            </button>

                            <button
                                disabled
                                className="flex-1 bg-gray-300 text-gray-500 py-3 px-6 rounded-lg cursor-not-allowed font-medium"
                            >
                                📄 Download PDF (Coming Soon)
                            </button>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}

export default function ReportPageWrapper() {
    return (
        <ProtectedRoute>
          <ReportPage />
        </ProtectedRoute>
      );
}
