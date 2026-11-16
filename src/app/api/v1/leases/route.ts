import { listRoute } from "@/lib/api/list";
export const GET = listRoute("lease", ["status", "unit_id"]);
