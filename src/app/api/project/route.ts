import { ok, withMember } from "@/lib/http";
import { loadProject } from "@/lib/project";

export async function GET() {
  return withMember(async () => ok(await loadProject()));
}
