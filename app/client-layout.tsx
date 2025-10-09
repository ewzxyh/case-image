"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { Header } from "@/components/navigation/header";
import { SidebarProvider } from "@/components/ui/sidebar";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Função para gerar breadcrumbs dinâmicos
  const getBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter(Boolean);

    const breadcrumbs = [{ label: "Dashboard", href: "/" }];

    if (pathSegments.length > 0) {
      pathSegments.forEach((segment, index) => {
        let label = "";
        let href = "";

        switch (segment) {
          case "templates":
            label = "Templates";
            href = "/templates";
            break;
          case "editor":
            label = "Editor";
            href = "/editor";
            break;
          case "galeria":
            label = "Galeria";
            href = "/galeria";
            break;
          default:
            label = segment.charAt(0).toUpperCase() + segment.slice(1);
            href = `/${pathSegments.slice(0, index + 1).join("/")}`;
        }

        breadcrumbs.push({ label, href });
      });
    }

    return breadcrumbs;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <Header breadcrumbs={getBreadcrumbs()} />
          <main className="flex-1 space-y-4 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <LayoutContent>{children}</LayoutContent>
    </ThemeProvider>
  );
}
