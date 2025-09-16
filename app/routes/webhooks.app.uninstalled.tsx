import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate, sessionStorage } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  if (session) {
    try {
      await sessionStorage.deleteSession(session.id);
      console.log(
        `Deleted session for shop: ${shop}, session ID: ${session.id}`,
      );
    } catch (error) {
      console.error(`Failed to delete session for shop: ${shop}`, error);
    }
  }

  return new Response();
};
