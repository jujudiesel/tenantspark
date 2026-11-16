import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/data";

// Streams a maintenance photo to whoever is allowed to see it (row level security decides).
export async function GET(request: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params;
  const { supabase, user } = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: photo } = await supabase.from("maintenance_photos").select("storage_path, content_type").eq("id", photoId).maybeSingle();
  if (!photo) return new NextResponse("Not found", { status: 404 });

  const { data: file, error } = await supabase.storage.from("maintenance-photos").download(photo.storage_path);
  if (error || !file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(await file.arrayBuffer(), {
    headers: { "Content-Type": photo.content_type || "image/jpeg", "Cache-Control": "private, max-age=3600" },
  });
}
