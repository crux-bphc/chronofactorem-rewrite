// Run from the repo root:
// pnpm -C backend exec tsx --experimental-test-module-mocks --tsconfig ../frontend/tsconfig.json --test ../frontend/tests/useEditTimetable.test.tsx
import assert from "node:assert/strict";
import { mock, test } from "node:test";
import {
  QueryClient,
  QueryClientProvider,
  QueryObserver,
} from "@tanstack/react-query";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import chronoAPI from "../src/data-access/axios.ts";

mock.module(
  new URL("../src/data-access/errors/toastHandler.ts", import.meta.url).href,
  {
    defaultExport: () => {},
  },
);
const { default: useEditTimetable } = await import(
  "../src/data-access/hooks/useEditTimetable.ts"
);
const { timetableQueryOptions } = await import(
  "../src/data-access/hooks/useTimetable.ts"
);

for (const cache of ["active", "inactive", "absent"]) {
  test(`${cache} cache: first edit waits for refreshed draft before navigation`, {
    timeout: 2000,
  }, async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const options = timetableQueryOptions("example");
    let saved = false;
    let delayRefresh = false;
    let refreshStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      refreshStarted = resolve;
    });
    let finishRefresh!: () => void;
    const gate = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    const originalAdapter = chronoAPI.defaults.adapter;
    chronoAPI.defaults.adapter = async (config) => {
      if (config.method === "post") saved = true;
      else if (delayRefresh) {
        refreshStarted();
        await gate;
      }
      return {
        config,
        status: 200,
        statusText: "OK",
        headers: {},
        data:
          config.method === "post"
            ? { message: "timetable edited" }
            : { id: "example", draft: saved, private: saved },
      };
    };
    let unsubscribe = () => {};
    try {
      if (cache !== "absent") await client.fetchQuery(options);
      if (cache === "active") {
        const observer = new QueryObserver(client, {
          ...options,
          staleTime: Number.POSITIVE_INFINITY,
        });
        unsubscribe = observer.subscribe(() => {});
      }
      let edit!: ReturnType<typeof useEditTimetable>["mutateAsync"];
      function Capture() {
        edit = useEditTimetable().mutateAsync;
        return null;
      }
      renderToString(
        createElement(QueryClientProvider, { client }, createElement(Capture)),
      );
      delayRefresh = true;
      let navigated = false;
      const editAndNavigate = edit({
        id: "example",
        body: { name: "Example", isPrivate: true, isDraft: true },
      }).then(async () => {
        navigated = true;
        // The route loader uses ensureQueryData, which accepts stale cache.
        return client.ensureQueryData(options);
      });
      if (cache !== "absent") {
        await started;
        await new Promise<void>((resolve) => setImmediate(resolve));
        assert.equal(navigated, false);
        assert.equal(client.getQueryData(options.queryKey)?.draft, false);
        // Finish refreshing even if the view stops observing the query.
        unsubscribe();
        finishRefresh();
      } else {
        finishRefresh();
      }
      assert.equal((await editAndNavigate).draft, true);
      assert.equal(navigated, true);
    } finally {
      unsubscribe();
      finishRefresh();
      chronoAPI.defaults.adapter = originalAdapter;
      client.clear();
    }
  });
}
