import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";
import { ensureUserInDb } from "@/lib/user-sync";

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ user: null });
  }

  await ensureUserInDb();

  return NextResponse.json({
    user: {
      sub: session.user.sub,
      name: session.user.name,
      email: session.user.email,
      picture: session.user.picture,
    },
  });
}
