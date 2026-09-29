/**
 * Dashboard demo-data service.
 *
 * No dashboard endpoint exists in the backend yet (backend/app/main.py and
 * backend/app/api/__init__.py are empty), so this module provides temporary
 * UI/demo values with an API-shaped structure.
 *
 * To integrate the real API later, replace the body of
 * `getDashboardData()` with a fetch call to e.g. GET /api/dashboard
 * returning the same `DashboardData` shape.
 */

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
}

export interface AssuranceDistribution {
  scripted: number;
  exploratory: number;
  supplierAssurance: number;
}

export interface AttentionItemData {
  id: string;
  title: string;
  description: string;
  count: number;
}

export interface DashboardData {
  totalRequirements: number;
  assurance: AssuranceDistribution;
  needsReview: number;
  changed: number;
  complianceGaps: number;
  risk: RiskDistribution;
  attention: AttentionItemData[];
}

const demoDashboardData: DashboardData = {
  totalRequirements: 70,
  assurance: {
    scripted: 18,
    exploratory: 30,
    supplierAssurance: 22,
  },
  needsReview: 4,
  changed: 3,
  complianceGaps: 5,
  risk: {
    low: 22,
    medium: 30,
    high: 18,
  },
  attention: [
    {
      id: "low-confidence-evidence",
      title: "Requirements have low-confidence evidence",
      description: "Review supporting evidence for 4 flagged requirements.",
      count: 4,
    },
    {
      id: "changed-since-assessment",
      title: "Requirements changed since previous assessment",
      description: "3 requirements need re-assessment after recent changes.",
      count: 3,
    },
    {
      id: "tests-require-review",
      title: "Generated tests require review",
      description: "2 draft test cases are waiting for QA approval.",
      count: 2,
    },
    {
      id: "compliance-not-covered",
      title: "Compliance criteria are currently not covered",
      description: "5 criteria have no linked requirement or test.",
      count: 5,
    },
  ],
};

export function getDashboardData(): DashboardData {
  return demoDashboardData;
}

export const isDashboardDemoData = true;
