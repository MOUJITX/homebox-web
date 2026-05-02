import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@/i18n";
import App from "@/App";
import "@/index.css";
import QueryProvider from "@/providers/QueryProvider";

createRoot(
  document.getElementById("root") ?? document.createElement("div"),
).render(
  <QueryProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryProvider>,
);
