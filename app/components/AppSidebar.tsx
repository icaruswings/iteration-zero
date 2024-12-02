import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/remix"
import { Calendar, CircleGauge, History, IterationCw, LogIn, Settings2 } from "lucide-react"
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

  export function AppSidebar() {
    
    const { open } = useSidebar();

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
                    <a href={item.url} className="font-medium">
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
                      {item.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                          >
                            <a href={item.url}>
                                <span>{item.title}</span>
                            </a>
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
                    elements: {
                        userButtonBox: {
                            flexDirection: "row-reverse",
                            flexShrink: "0",
                        },
                        userButtonOuterIdentifier: {
                            
                        }
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
  