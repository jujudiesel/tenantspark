import { listRoute } from "@/lib/api/list";
export const GET = listRoute("charge", ["status", "lease_id", "period_start"], "due_date");
