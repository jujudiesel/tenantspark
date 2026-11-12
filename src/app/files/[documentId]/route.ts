import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Streams a lease PDF to whoever is allowed to see it (row level security decides).
// ?signed=1 returns the signed copy when there is one.
export async function GET(request: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: doc } = await supabase
    .from("lease_documents")
    .select("title, storage_path, signed_storage_path")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const wantSigned = request.nextUrl.searchParams.get("signed") === "1";
  const path = wantSigned && doc.signed_storage_path ? doc.signed_storage_path : doc.storage_path;

  const { data: file, error } = await supabase.storage.from("lease-files").download(path);
  if (error || !file) return new NextResponse("Not found", { status: 404 });

  const name = `${doc.title.replace(/[^a-zA-Z0-9 ._-]+/g, "")}${wantSigned && doc.signed_storage_path ? " (signed)" : ""}.pdf`;
  const inline = request.nextUrl.searchParams.get("download") !== "1";
  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
