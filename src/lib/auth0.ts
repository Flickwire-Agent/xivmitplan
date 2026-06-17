import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  appBaseUrl: ["http://localhost:3000", "https://xivmitplan.projects.blueskye.co.uk"],
});
