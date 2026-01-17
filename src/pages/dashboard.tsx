import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";   
import { supabase } from "@/lib/supabaseClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import UsageBadge from "@/components/UsageBadge";

interface Report {
    id: string;
    title: string;
    num_rows: number;
    columns: string[];
    status: string;
    uploaded_at: string;
    summary_id: string | null;
}

function Dashboard() {
    const router = useRouter();

    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Supabase Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            setLoading(true);
            setError("");

            const { data, error: fetchError } = await supabase
                .from("reports")
                .select("*")
                .order("uploaded_at", { ascending: false });
            
            if (fetchError) throw fetchError;

            setReports(data || []);
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "Failed to load reports";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColour = (status: string) => {
        switch (status) {
            case "summarised":
                return "bg-green-100 text-green-800";
            case "parsed":
                return "bg-yellow-100 text-yellow-800";
            case "failed":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "summarised":
                return "✓";
            case "parsed":
                return "⋯";
            case "failed":
                return "✕";
            default:
                return "○";
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your reports...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Dashboard
                            </h1>

                            <p className="text-gray-600">
                                View and manage your report summaries
                            </p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <UsageBadge />
                    
                            <Link
                                href="/upload"
                                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-medium"
                            >
                                + New Report
                            </Link>
                        </div>
                    </div>
                    
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {!loading && reports.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                        
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                No reports yet
                            </h2>

                            <p className="text-gray-600 mb-6">
                                Upload your first Salesforce CSV report to get started with AI-powered insights.
                            </p>
                        
                            <Link
                                href="/upload"
                                className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-medium"
                            >
                                Upload Your First Report
                            </Link>
                        </div>
                    </div>
                )}
                
                {reports.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Report
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Data
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Uploaded
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                            
                                {reports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <svg
                                                        className="h-5 w-5 text-blue-600"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {report.title}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {report.num_rows.toLocaleString()} rows
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {report.columns.length} columns
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColour(
                                                report.status
                                                )}`}
                                            >
                                            <span className="mr-1">{getStatusIcon(report.status)}</span>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(report.uploaded_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/report/${report.id}`}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                {report.status === "summarized" ? "View Summary" : "View Report"}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {reports.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Reports</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {reports.length}
                                </p>
                            </div>
                            <div>                        
                                <p className="text-sm text-gray-600 mb-1">Summarized</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {reports.filter((r) => r.status === "summarized").length}
                                </p>
                        
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {reports.filter((r) => r.status === "parsed").length}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                </div>
            </div>
        </Layout>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>
    );
}
