import { supabaseAdmin } from "./supabaseServer";
import { supabase } from "./supabaseClient";

export type AuditEventType = 
    | "user_signup"
    | "user_login"
    | "user_logout"
    | "report_uploaded"
    | "report_summarized"
    | "report_failed"
    | "pdf_generated"
    | "error"
    | "subscription_created"
    | "subscription_cancelled"
    | "dashboard_viewed"
    | "dashboard_search"
    | "dashboard_sorted";

interface AuditLogPayload {
    [key: string]: unknown;
}

/**
 * Log an audit event
 * Uses service role to bypass RLS
 */
export async function logAuditEvent(
    eventType: AuditEventType,
    userId: string | null,
    payload: AuditLogPayload = {}
) {
    try {
        const { error } = await supabaseAdmin.from("audit_logs").insert({
            user_id: userId,
            event_type: eventType,
            payload: payload,
        });

        if (error) {
            console.error("Failed to log audit event: ", error);
        }
    } catch (e) {
        
        // lets not break the app because audit logging failed
        console.error("Audit logging error: ", e);
    }
}

/**
 * Log an error with context
 */
export async function logError(
    userId: string | null, 
    errorMessage: string,
    context: AuditLogPayload = {}
) {
    return logAuditEvent("error", userId, {
        error: errorMessage,
        ...context
    });
}

/**
 * Log an audit event from client-side
 * Automatically includes authentication token
 */
export async function logEventFromClient(
    eventType: AuditEventType,
    payload: AuditLogPayload = {}
): Promise<void> {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            console.warn("Cannot log event: No active session");
            return;
        }

        const response = await fetch("/api/log-events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                eventType,
                payload,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to log event ${eventType}:`, errorText);
        }
    } catch (e) {

        // don't break the app if logging fails
        console.error(`Error logging event ${eventType}:`, e);
    }
}
