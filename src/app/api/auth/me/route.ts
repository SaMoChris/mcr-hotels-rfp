import { unstable_rethrow } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Sign in to continue.", 401);
    return ok({ user, needsProfile: !user.name });
  } catch (e) {
    unstable_rethrow(e);
    console.error(e);
    return fail("The server hit a problem. Try again in a moment.", 500);
  }
}
