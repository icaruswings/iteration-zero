import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/remix"
import { CircleGauge, IterationCw, LogIn, Settings2 } from "lucide-react"
import { useMemo } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
  } from "~/components/ui/sidebar"
import { Button } from "./ui/button";
import { dark } from "@clerk/themes";
import { useTheme } from "remix-themes";
import { Link } from "@remix-run/react";

  export function AppSidebar() {
    const [theme] = useTheme();

    const navItems = useMemo(() => [
        {
            title: "Dashboard",
            url: "/",
            icon: CircleGauge,
        },
        {
            title: "Iterations",
            url: "/iterations",
            icon: IterationCw,
            items: [
                { title: "Current", url: "/iterations" },
                { title: "Future", url: "/iterations/future" },
                { title: "Previous", url: "/iterations/previous" },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings2
        },
    ], []);

    return (
        <Sidebar collapsible="icon">
        <SidebarHeader />
        <SidebarContent>
          <SidebarGroup>
          <SidebarMenu className="gap-2">
          {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url} className="font-bold">
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
                      {item.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                          >
                            <Link to={item.url} className="font-light">
                                <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup />
        </SidebarContent>
        <SidebarFooter>
            <SignedIn>
                <UserButton appearance={{
                    baseTheme: theme === "dark" ? dark : undefined,
                    elements: {
                        userButtonBox: {
                            flexDirection: "row-reverse",
                            flexShrink: "0",
                        },
                    },
                }}
                showName={true} />
            </SignedIn>

            <SignedOut>
                <SignInButton>
                    <Button variant="ghost" className="justify-start">
                        <LogIn />
                        <span>Sign In</span>
                    </Button>
                </SignInButton>
            </SignedOut>
        </SidebarFooter>
      </Sidebar>
    )
  }
  