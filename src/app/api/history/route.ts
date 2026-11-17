import type { NextRequest } from "next/server";
import { listHistory } from "@/lib/history";
import { ok, withMember } from "@/lib/http";

export async function GET(request: NextRequest) {
  return withMember(async () => {
    const p = request.nextUrl.searchParams;
    const num = (k: string) => (/^\d+$/.test(p.get(k) ?? "") ? Number(p.get(k)) : undefined);
    return ok(
      await listHistory({
        area: p.get("area") ?? undefined,
        userId: num("user"),
        before: num("before"),
        limit: num("limit"),
      }),
    );
  });
}
