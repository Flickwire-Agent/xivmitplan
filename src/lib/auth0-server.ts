import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const auth0Server = new Auth0Client({
  onCallback: async (error, ctx, session) => {
    if (error) {
      return NextResponse.redirect(
        new URL(ctx.returnTo ?? "/", ctx.appBaseUrl ?? "http://localhost:3000"),
      );
    }

    if (session?.user) {
      const existingUser = await prisma.user.findUnique({
        where: { auth0Id: session.user.sub },
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            email: session.user.email ?? existingUser.email,
            displayName: session.user.name ?? existingUser.displayName,
          },
        });
      } else {
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
        } else {
          await prisma.user.create({
            data: {
              auth0Id: session.user.sub,
              email: session.user.email,
              displayName: session.user.name,
            },
          });
        }
      }
    }

    return NextResponse.redirect(
      new URL(ctx.returnTo ?? "/", ctx.appBaseUrl ?? "http://localhost:3000"),
    );
  },
});
