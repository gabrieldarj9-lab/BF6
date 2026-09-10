import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { App } from "@/app"
import { DesignSystemPage } from "@/design-system"
import "@/index.css"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Missing #root element")
}

const isDesignSystem = window.location.pathname.replace(/\/+$/, "") === "/design-system"

document.title = isDesignSystem ? "BF6 Builds — Design System" : "BF6 Builds"

createRoot(root).render(
  <StrictMode>
    <TooltipProvider>
      {isDesignSystem ? <DesignSystemPage /> : <App />}
    </TooltipProvider>
  </StrictMode>
)
