import { useRouter } from "next/router";

export default function Report() {
    const { id } = useRouter().query;

    return (
        <main className="p-6">
        <h2 className="text-xl font-bold">Report {id}</h2>
        <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white"
            onClick={() => fetch("/api/summarise", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reportId: id })
            })}
        >
            Generate Summary
        </button>
        </main>
    );
}
