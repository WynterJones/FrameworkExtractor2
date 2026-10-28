import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// A live OverSkill app gets this injected by the deploy step; the badge reads it.
(window as any).APP_CONFIG = {
  appId: "proto",
  isCloneable: true,
  remixEnabled: true,
  remixUrl: "https://www.overskill.com/",
  environment: "prototype",
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
