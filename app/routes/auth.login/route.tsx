import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  AppProvider as PolarisAppProvider,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

function shopFromHost(host?: string | null) {
  if (!host) return null;
  try {
    const decoded = Buffer.from(
      host.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    return decoded.split("/")[0] || null;
  } catch {
    return null;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const host = url.searchParams.get("host");
  const shop = url.searchParams.get("shop") || shopFromHost(host);

  if (shop && !url.searchParams.get("shop")) {
    url.searchParams.set("shop", shop);
    throw redirect(url.pathname + "?" + url.searchParams.toString());
  }

  const errors = loginErrorMessage(await login(request));
  return json({ errors, polarisTranslations });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));
  return json({ errors });
};

export default function Auth() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const errors = (actionData || data).errors;

  useEffect(() => {
    if (typeof window !== "undefined" && window.top !== window.self) {
      if (window.top) {
        window.top.location.href = window.location.href;
      }
    }
  }, []);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("shop") || "";
    if (s) setShop(s);
  }, []);

  return (
    <PolarisAppProvider i18n={data.polarisTranslations}>
      <Page>
        <Card>
          <Form method="post">
            <FormLayout>
              <Text variant="headingMd" as="h2">
                Log in
              </Text>
              <TextField
                name="shop"
                label="Shop domain"
                helpText="example.myshopify.com"
                value={shop}
                onChange={setShop}
                autoComplete="on"
                error={errors.shop}
              />
              <Button submit>Log in</Button>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}
