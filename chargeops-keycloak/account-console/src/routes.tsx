import type { RouteObject } from "react-router-dom";
import { Navigate, useRouteError } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import App from "./App";
import { environment } from "./environment";
import { SecurityHome } from "./SecurityHome";

function AccountRouteError() {
  const error = useRouteError();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("Account console route failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
  }, [error]);

  return (
    <main role="alert" style={{ margin: "4rem auto", maxWidth: 520, padding: 24, textAlign: "center" }}>
      <h1>{t("routeErrorTitle", { defaultValue: "This page ran into a problem" })}</h1>
      <p>{t("routeErrorBody", { defaultValue: "Reload the page to try again." })}</p>
      <button type="button" onClick={() => window.location.reload()}>
        {t("routeErrorRetry", { defaultValue: "Reload page" })}
      </button>
    </main>
  );
}

export const RootRoute: RouteObject = {
  path: decodeURIComponent(new URL(environment.baseUrl).pathname),
  element: <App />,
  errorElement: <AccountRouteError />,
  children: [
    { index: true, element: <SecurityHome /> },
    { path: "security", element: <SecurityHome /> },
    { path: "*", element: <Navigate to="." replace /> },
  ],
};

export const routes: RouteObject[] = [RootRoute];
