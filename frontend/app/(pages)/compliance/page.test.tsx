import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import CompliancePage from "./page";

const mockedFetch = jest.fn<typeof fetch>();
const router = {
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  bfcacheId: "test",
};

function renderCompliancePage() {
  return render(
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value="/compliance">
        <CompliancePage />
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );
}

function response(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

describe("CompliancePage manual classification", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
    Object.defineProperty(globalThis, "fetch", {
      value: mockedFetch,
      writable: true,
      configurable: true,
    });
  });

  it("loads saved state without automatically starting classification", async () => {
    mockedFetch.mockResolvedValue(response({
      assessment_status: "NOT_RUN",
      control_areas: null,
    }));

    renderCompliancePage();

    await screen.findByText(/No classification has been run/);
    expect(screen.queryByText(/Classifies requirement wording against five named control areas/)).toBeNull();
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(String(mockedFetch.mock.calls[0][0])).toContain("/compliance/report");
    expect(
      mockedFetch.mock.calls.some((call) =>
        String(call[0]).includes("/compliance/evaluate"),
      ),
    ).toBe(false);
  });

  it("starts classification only after the user clicks the button", async () => {
    mockedFetch
      .mockResolvedValueOnce(response({
        assessment_status: "NOT_RUN",
        control_areas: null,
      }))
      .mockResolvedValueOnce(response({
        id: "run-1",
        assessment_status: "QUEUED",
        control_areas: null,
      }))
      .mockResolvedValueOnce(response({
        id: "run-1",
        assessment_status: "COMPLETED",
        control_areas: {
          audit_trail: {
            verdict: "PARTIALLY_COVERED",
            fully_covered_requirements: [],
            partially_covered_requirements: Array.from(
              { length: 21 },
              (_, index) => `REQ-${String(index + 1).padStart(3, "0")}`,
            ),
          },
        },
        requirements_count: 1,
        requirement_routes: {
          "REQ-001": "requirement-uuid-1",
          "REQ-021": "requirement-uuid-21",
        },
      }));

    renderCompliancePage();
    const button = await screen.findByRole<HTMLButtonElement>("button", {
      name: "Run Requirement Classification",
    });
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/token usage/i)).toBeNull();

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedFetch.mock.calls.some(([url, init]) =>
        String(url).includes("/compliance/evaluate")
        && init?.method === "POST"
        && init.body === JSON.stringify({}),
      )).toBe(true);
    });
    await screen.findByText("Discovered requirement matches");
    expect(screen.getByText("21")).toBeTruthy();
    expect(screen.getByText("partial matches")).toBeTruthy();
    expect(screen.getByText("REQ-021")).toBeTruthy();
    expect(screen.getByRole("link", { name: /REQ-021/ }).getAttribute("href"))
      .toBe("/requirements/requirement-uuid-21");
    expect(screen.queryByText(/token usage/i)).toBeNull();
  });
});
