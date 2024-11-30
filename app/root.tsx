import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import tailwind from "./tailwind.css?url";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { PropsWithChildren, useState } from "react";
import invariant from "tiny-invariant";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwind },
];

export const loader = async (args: LoaderFunctionArgs) => {
    invariant(process.env.CONVEX_URL, "CONVEX_URL is required");

    return {
      ENV: {
        CONVEX_URL: process.env.CONVEX_URL,
      }
    };
};

export const useRootLoaderData = () =>
  useRouteLoaderData<typeof loader>("root");


function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Providers({ children }: PropsWithChildren<unknown>) {
  const { ENV } = useLoaderData<typeof loader>();
  const [convexClient] = useState(new ConvexReactClient(ENV.CONVEX_URL));

  return (
    <ConvexProvider client={convexClient}>
      <Layout>{children}</Layout>
    </ConvexProvider>
  );
}

export default function App() {
  return (
    <Providers>
      <Outlet />
    </Providers>
  );
}
