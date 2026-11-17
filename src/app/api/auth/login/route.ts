import { emailAllowed, normalizeEmail, setSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/http";

// Step 1 of sign-in: the email gate. A new address gets a profile with no
// name yet; the browser then asks for one.
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const email = normalizeEmail(body.email);
    if (!email) return fail("Enter a valid email address.", 400);
    if (!emailAllowed(email)) {
      return fail("This site is limited to the Verisave team. Use your Verisave email address.", 403);
    }
    const rows = await query<{ id: number; email: string; name: string | null }>(
      `INSERT INTO users (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET last_seen_at = now()
       RETURNING id, email, name`,
      [email],
    );
    const user = rows[0];
    await setSession(user.id);
    return ok({ user, needsProfile: !user.name });
  } catch (e) {
    console.error(e);
    return fail("Sign-in hit a server problem. Try again in a moment.", 500);
  }
}
