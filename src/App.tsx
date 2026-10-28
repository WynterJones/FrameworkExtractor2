/**
 * Framework Extractor — routes. Both pages render inside Shell (a collapsible
 * left sidebar: Dashboard + the list of frameworks).
 *   /                → Index      (dashboard: the creator composer)
 *   /framework/:id   → Workspace  (two-pane Creative Director interview)
 *   *                → NotFound
 * Dark theme by default (near-black, neutral greys, ocean-blue primary).
 */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Shell from "@/components/Shell";
import Index from "@/pages/Index";
import Workspace from "@/pages/Workspace";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route element={<Shell />}>
                <Route path="/" element={<Index />} />
                <Route path="/framework/:id" element={<Workspace />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Sonner />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
