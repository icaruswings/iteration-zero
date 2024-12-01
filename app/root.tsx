import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteLoaderData,
} from "@remix-run/react";
import tailwind from "./tailwind.css?url";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { PropsWithChildren, useState } from "react";
import invariant from "tiny-invariant";
import { ClerkApp, useAuth } from "@clerk/remix";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { rootAuthLoader } from "@clerk/remix/ssr.server";
import { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import Footer from "./components/Footer";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwind },
];

export const loader = async (args: LoaderFunctionArgs) => {
  return rootAuthLoader(args, (args) => {
    invariant(process.env.CONVEX_URL, "CONVEX_URL is required");

    return {
      ENV: {
        CONVEX_URL: process.env.CONVEX_URL,
      }
    };
  });
};

export const useRootLoaderData = () =>
  useRouteLoaderData<typeof loader>("root");

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-900">
        {children}
        <Footer />
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
    <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
      <Layout>{children}</Layout>
    </ConvexProviderWithClerk>
  );
}

function App() {
  return (
    <Providers>
      <Outlet />
    </Providers>
  );
}

export default ClerkApp(App);