import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@/i18n";
import App from "@/App";
import "@/index.css";

createRoot(
  document.getElementById("root") ?? document.createElement("div"),
).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
