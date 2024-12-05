import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { PropsWithChildren } from "react";
import { AppSidebar } from "~/components/AppSidebar";
import Footer from "~/components/Footer";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";

export const loader = async (args: LoaderFunctionArgs) => {
    const { sessionId } = await getAuth(args);

    if (!sessionId) {
        const returnUrl = new URL(args.request.url);
        throw redirect(`/sign-in?redirect_url=${returnUrl.pathname}`, {  });
    }

    return null;
};

function Layout ({children}: PropsWithChildren<unknown>) {
    return (
        <div>
            <SidebarProvider>
                <AppSidebar />

                <main className="w-full max-w-4xl">
                    <SidebarTrigger />
                    {children}
                    <Footer />
                </main>
            </SidebarProvider>
        </div>
    )
}

export default function () {
    return (
      <Layout>
        <Outlet />
      </Layout>
    );
  }