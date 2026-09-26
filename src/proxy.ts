import { NextRequest, NextResponse } from "next/server";

// The one domain every visitor should end up on. Vercel gives this project
// its own *.vercel.app alias (and every deployment its own unique URL) in
// addition to the custom domain — this collapses all of them onto the
// custom domain so links, bookmarks, and search results never split across
// hosts. Scoped to VERCEL_ENV === "production" only, so preview deployments
// (used to sanity-check a branch before merging) keep working on their own
// throwaway URL instead of being redirected away.
const CANONICAL_HOST = "www.amber-realestate.com";

export function proxy(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "production") {
    return NextResponse.next();
  }

  const host = request.headers.get("host");
  if (!host || host === CANONICAL_HOST) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = "https";
  url.host = CANONICAL_HOST;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
