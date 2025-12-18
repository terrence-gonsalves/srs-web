import { useState } from "react";

export default function Upload() {
    const [file, setFile] = useState<File | null>(null);

    async function submit() {
        if (!file) return;

        const form = new FormData();

        form.append("file", file);
        form.append("userId", "REPLACE_WITH_AUTH_ID");

        const res = await fetch("/api/upload", {
            method: "POST",
            body: form
        });

        const data = await res.json();
        window.location.href = `/report/${data.reportId}`;
    }

    return (
        <main className="p-6">
            <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} />
            <button onClick={submit} className="ml-2 px-4 py-2 bg-black text-white">
                Upload
            </button>
        </main>
    );
}
