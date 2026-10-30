/**
 * Framework Extractor — routes. Every page renders inside Shell (a collapsible
 * left sidebar: New framework, Home, the frameworks).
 *   /                → Index      (Home: start a framework, continue the latest)
 *   /framework/:id   → Workspace  (interview + live framework; ?tab= picks the output tab)
 *   any route ?new=1 → the new-framework dialog (Shell)
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
