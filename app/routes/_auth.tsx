import { Outlet } from "@remix-run/react";
import { PropsWithChildren } from "react";
import Footer from "~/components/Footer";

function Layout ({children}: PropsWithChildren<unknown>) {
    return (
        <main className="h-full w-full max-w-4xl mx-auto flex flex-col">
            <div className="flex-1 flex flex-col justify-center items-center">{children}</div>
            <div className="flex-none">
                <Footer />
            </div>
        </main>
    )
}

export default function () {
    return (
      <Layout>
        <Outlet />
      </Layout>
    );
  }