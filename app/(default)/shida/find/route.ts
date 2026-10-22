import { discoverySearchDestination } from "../../../lib/discovery-search";
export function GET(request: Request) {
  const url = new URL(request.url);
  return new Response(null, { status: 303, headers: { Location: discoverySearchDestination(url.searchParams), "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
