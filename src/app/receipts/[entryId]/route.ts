import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/data";

export async function GET(request: NextRequest, { params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  const { supabase, user } = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const { data: e } = await supabase.from("ledger_entries").select("receipt_path").eq("id", entryId).maybeSingle();
  if (!e?.receipt_path) return new NextResponse("Not found", { status: 404 });
  const { data: file, error } = await supabase.storage.from("receipts").download(e.receipt_path);
  if (error || !file) return new NextResponse("Not found", { status: 404 });
  const type = e.receipt_path.toLowerCase().endsWith(".pdf") ? "application/pdf" : file.type || "image/jpeg";
  return new NextResponse(await file.arrayBuffer(), { headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600" } });
}
