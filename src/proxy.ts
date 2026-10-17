import { NextResponse, type NextRequest } from "next/server";
import { getPair } from "@/lib/event-map";

/**
 * Unknown event ids get a real 404 status. Event pages stream, so a
 * notFound() inside the page arrives after the 200 header has been sent
 * (Next adds noindex, but the status stays 200). Checking here, before
 * rendering starts, lets us rewrite to a path with no route, which serves
 * the app's not-found page with a 404.
 */
export function proxy(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/")[2];
  if (id && !getPair(decodeURIComponent(id))) {
    return NextResponse.rewrite(new URL("/_event-not-found", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/events/:id", "/events/:id/opengraph-image"],
};
