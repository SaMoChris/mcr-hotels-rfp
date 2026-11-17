import { buildProposal } from "@/lib/content/proposal";
import { query } from "@/lib/db";
import { ok, withMember } from "@/lib/http";
import { loadModel } from "@/lib/model/store";

export async function GET() {
  return withMember(async () => {
    const model = await loadModel();
    const last = await query<{ by: string | null; at: Date }>(
      `SELECT u.name AS by, h.created_at AS at FROM history h JOIN users u ON u.id = h.user_id
        WHERE h.area = 'model' ORDER BY h.id DESC LIMIT 1`,
    );
    return ok({
      markdown: buildProposal(model.defs, model.values),
      lastEdit: last[0] ? { by: last[0].by ?? "Someone", at: last[0].at.toISOString() } : null,
    });
  });
}
