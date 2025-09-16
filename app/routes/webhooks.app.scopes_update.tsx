import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate, sessionStorage } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const current = payload.current as string[];
  if (session) {
    try {
      session.scope = current.join(",");
      await sessionStorage.storeSession(session);

      console.log(`Updated session scope for ${shop}:`, current);
    } catch (error) {
      console.error("Failed to update session scope:", error);
    }
  }
  return new Response();
};
