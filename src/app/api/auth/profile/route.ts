import { getSessionUser } from "@/lib/auth";
import { tx } from "@/lib/db";
import { fail, logHistory, ok, readJson } from "@/lib/http";

// Step 2 of sign-in, and how a person renames themselves later.
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Sign in to continue.", 401);
    const body = await readJson(request);
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    if (name.length < 2 || name.length > 60) return fail("Enter a name or alias of 2 to 60 characters.", 400);
    if (name !== user.name) {
      await tx(async (q) => {
        await q("UPDATE users SET name = $1 WHERE id = $2", [name, user.id]);
        await logHistory(q, {
          userId: user.id,
          area: "profile",
          entity: `user:${user.id}`,
          label: user.name ? "Changed their display name" : "Joined the project",
          action: user.name ? "update" : "create",
          oldValue: user.name,
          newValue: name,
        });
      });
    }
    return ok({ user: { ...user, name } });
  } catch (e) {
    console.error(e);
    return fail("Saving your name hit a server problem. Try again in a moment.", 500);
  }
}
