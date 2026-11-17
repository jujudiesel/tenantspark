import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EXPIRED = "That link has expired. Log in or request a new one.";
const OTP_TYPES = ["recovery", "magiclink", "email", "signup"] as const;
type OtpType = (typeof OTP_TYPES)[number];

function safeNext(v: string | null) {
  return v && v.startsWith("/") ? v : "/dashboard";
}

// Supabase sends users here after they click a confirmation or reset link.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as OtpType | null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(EXPIRED)}`);
  }

  // Links we generate ourselves carry a one-time token hash. Email apps and chat apps open links
  // to make previews, which would burn the token before the person ever sees the page. So a GET
  // only shows a button; the token is used on the POST that button makes.
  if (token_hash && type && OTP_TYPES.includes(type)) {
    const title = type === "recovery" ? "Set a new password" : "Continue to TenantSpark";
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} | TenantSpark</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f6fa;font-family:-apple-system,Segoe UI,Inter,Arial,sans-serif;color:#0e1730}
main{background:#fff;border:1px solid #e3e8f0;border-radius:14px;padding:32px 28px;max-width:400px;width:calc(100% - 32px);box-sizing:border-box;text-align:center}
h1{font-size:22px;margin:0 0 10px}p{margin:0 0 20px;color:#3d4760;line-height:1.5}
button{width:100%;min-height:52px;border:0;border-radius:10px;background:#0e1730;color:#fff;font-size:16px;font-weight:600;cursor:pointer}
.brand{font-weight:800;font-size:18px;margin-bottom:18px}.brand span{color:#0b6fd6}</style></head>
<body><main><div class="brand">Tenant<span>Spark</span></div><h1>${title}</h1><p>${type === "recovery" ? "Press the button to open the page where you choose your new password." : "Press the button to finish signing in."}</p>
<form method="post"><button type="submit">${title}</button></form></main></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(EXPIRED)}`);
}

export async function POST(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as OtpType | null;
  if (token_hash && type && OTP_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`, { status: 303 });
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(EXPIRED)}`, { status: 303 });
}
