import { NextRequest, NextResponse } from "next/server";

const publicRoutes = new Set([
  "",
  "features",
  "ai-agents",
  "jira-integration",
  "security",
  "pricing",
  "docs",
  "privacy",
  "terms",
  "login",
  "register",
  "forgot-password",
  "reset-password"
]);

export function middleware(request: NextRequest) {
  const first = request.nextUrl.pathname.split("/").filter(Boolean)[0] ?? "";
  if (publicRoutes.has(first) || request.nextUrl.pathname.startsWith("/brand")) {
    return NextResponse.next();
  }
  const hasSession = request.cookies.has("sprintmind_access") || request.cookies.has("sprintmind_demo_session");
  const demo = request.nextUrl.searchParams.get("demo") === "1" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (hasSession || demo) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};

