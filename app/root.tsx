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
import { ConvexReactClient } from "convex/react";
import { PropsWithChildren, useState } from "react";
import invariant from "tiny-invariant";
import { ClerkApp, useAuth } from "@clerk/remix";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { rootAuthLoader } from "@clerk/remix/ssr.server";
import { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import clsx from "clsx"
import { PreventFlashOnWrongTheme, ThemeProvider, useTheme } from "remix-themes"
import { themeSessionResolver } from "./sessions.server";
import { dark } from '@clerk/themes'

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwind },
];

export const loader = async (args: LoaderFunctionArgs) => {
  return rootAuthLoader(args, async (args) => {
    const { request } = args;
    const { getTheme } = await themeSessionResolver(request);

    invariant(process.env.CONVEX_URL, "CONVEX_URL is required");

    return {
      theme: getTheme(),
      ENV: {
        CONVEX_URL: process.env.CONVEX_URL,
      },
    };
  });
};

export const useRootLoaderData = () =>
  useRouteLoaderData<typeof loader>("root");

function Layout({ children }: { children: React.ReactNode }) {
  const [theme] = useTheme()

  return (
    <html lang="en" className={clsx(theme)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(theme)} />
        <Links />
      </head>
      <body className="h-screen flex flex-col bg-background">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Providers({ children }: PropsWithChildren<unknown>) {
  const { theme, ENV } = useLoaderData<typeof loader>();
  const [convexClient] = useState(new ConvexReactClient(ENV.CONVEX_URL));

  return (
      <ThemeProvider specifiedTheme={theme} themeAction="/action/set-theme">
        <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
            <Layout>{children}</Layout>
        </ConvexProviderWithClerk>
      </ThemeProvider>
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