import { createClient } from "@supabase/supabase-js";
import { NextApiRequest } from "next";

export function createSupabaseServerClient(req: NextApiRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient(supabaseUrl, anonKey, {
        global: {
            headers: {
                Authorization: req.headers.authorization || ""
            }
        }
    });
}