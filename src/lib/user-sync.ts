import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";

export async function ensureUserInDb() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return null;
  }

  const existingUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (existingUser) {
    if (
      existingUser.email !== session.user.email ||
      existingUser.displayName !== session.user.name
    ) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email: session.user.email ?? existingUser.email,
          displayName: session.user.name ?? existingUser.displayName,
        },
      });
    }
    return existingUser;
  }

  const emailMatch = await prisma.user.findFirst({
    where: { email: session.user.email },
  });

  if (emailMatch) {
    await prisma.user.update({
      where: { id: emailMatch.id },
      data: {
        auth0Id: session.user.sub,
        displayName: session.user.name ?? emailMatch.displayName,
      },
    });
    return emailMatch;
  }

  const created = await prisma.user.create({
    data: {
      auth0Id: session.user.sub,
      email: session.user.email,
      displayName: session.user.name,
    },
  });
  return created;
}
