import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export const loader = async (args: LoaderFunctionArgs) => {
    const { sessionId } = await getAuth(args);

    if (!sessionId) {
        redirect("/sign-in?redirect_url=/");
    }

    return null;
};