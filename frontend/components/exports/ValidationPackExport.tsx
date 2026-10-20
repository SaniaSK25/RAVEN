"use client";

import { useState, useCallback, useRef, DragEvent } from "react";
import { 
  Download, 
  FileText, 
  Archive, 
  X, 
  Plus, 
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Settings,
  Zap,
  FileCode,
  FileImage,
  FileType,
  RotateCcw,
  Search,
  Filter,
  XCircle
} from "lucide-react";
import { 
  getRequirementsDemoData, 
  type RequirementListItem 
} from "@/lib/requirements-data";
import { 
  getRequirementDetail, 
  type RequirementDetail 
} from "@/lib/requirement-detail-data";
import { 
  getTraceMatrix, 
  type TraceMatrixRow 
} from "@/lib/traceability-data";
import { 
  generateValidationPackZip, 
  downloadBlob,
  type ValidationPackData 
} from "@/lib/export-utils";

interface SelectedRequirement {
  id: string;
  title: string;
  version: string;
  risk: string;
  assurance: string;
  status: string;
}

export default function ValidationPackExport() {
  const [availableRequirements, setAvailableRequirements] = useState<RequirementListItem[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<SelectedRequirement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [requirementDetails, setRequirementDetails] = useState<Map<string, RequirementDetail>>(new Map());
  const [traceMatrixRows, setTraceMatrixRows] = useState<Map<string, TraceMatrixRow>>(new Map());
  
  const availableListRef = useRef<HTMLDivElement>(null);
  const selectedListRef = useRef<HTMLDivElement>(null);
  const traceMatrixElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Load available requirements on mount
  const loadRequirements = useCallback(() => {
    const requirements = getRequirementsDemoData();
    setAvailableRequirements(requirements);
    
    // Pre-load trace matrix rows
    const matrix = getTraceMatrix();
    const matrixMap = new Map<string, TraceMatrixRow>();
    matrix.forEach(row => matrixMap.set(row.requirementId, row));
    setTraceMatrixRows(matrixMap);
  }, []);

  // Load requirement detail when added to selection
  const loadRequirementDetail = useCallback(async (reqId: string) => {
    const detail = getRequirementDetail(reqId);
    if (detail) {
      setRequirementDetails(prev => {
        const next = new Map(prev);
        next.set(reqId, detail);
        return next;
      });
    }
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: DragEvent, requirement: RequirementListItem) => {
    e.dataTransfer.setData("text/plain", requirement.id);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // Handle drop on selected list
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const reqId = e.dataTransfer.getData("text/plain");
    const requirement = availableRequirements.find(r => r.id === reqId);
    
    if (requirement && !selectedRequirements.some(r => r.id === reqId)) {
      const selected: SelectedRequirement = {
        id: requirement.id,
        title: requirement.title,
        version: requirement.version,
        risk: requirement.risk,
        assurance: requirement.assurance,
        status: requirement.status,
      };
      setSelectedRequirements(prev => [...prev, selected]);
      loadRequirementDetail(reqId);
      setSuccess(`Added ${requirement.id} to export selection`);
      setTimeout(() => setSuccess(""), 3000);
    }
  }, [availableRequirements, selectedRequirements, loadRequirementDetail]);

  // Remove from selection
  const removeFromSelection = useCallback((reqId: string) => {
    setSelectedRequirements(prev => prev.filter(r => r.id !== reqId));
    setRequirementDetails(prev => {
      const next = new Map(prev);
      next.delete(reqId);
      return next;
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedRequirements([]);
    setRequirementDetails(new Map());
  }, []);

  // Reorder selected requirements
  const moveRequirement = useCallback((index: number, direction: "up" | "down") => {
    setSelectedRequirements(prev => {
      const next = [...prev];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex >= 0 && newIndex < next.length) {
        [next[index], next[newIndex]] = [next[newIndex], next[index]];
      }
      return next;
    });
  }, []);

  // Generate and download validation pack
  const handleExport = useCallback(async () => {
    if (selectedRequirements.length === 0) {
      setError("Please select at least one requirement to export");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setIsGenerating(true);
    setError("");
    setSuccess("");

    try {
      // Prepare validation pack data
      const packData: ValidationPackData[] = selectedRequirements
        .map((req): ValidationPackData | null => {
          const requirement = requirementDetails.get(req.id);
          if (!requirement) return null;
          return {
            requirement,
            traceMatrixRow: traceMatrixRows.get(req.id),
          };
        })
        .filter((data): data is ValidationPackData => data !== null);

      // Get trace matrix elements for image capture
      // Note: In a real implementation, these would be refs to actual rendered matrix elements
      // For now, we'll create placeholder elements
      const traceElements = new Map<string, HTMLDivElement>();
      
      // Generate ZIP
      const zipBlob = await generateValidationPackZip(packData, traceElements);
      
      // Download
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `validation-pack-${selectedRequirements.map(r => r.id).join("-")}-${timestamp}.zip`;
      downloadBlob(zipBlob, filename);
      
      setSuccess(`Successfully exported validation pack for ${selectedRequirements.length} requirement(s)`);
    } catch (err) {
      console.error("Export failed:", err);
      setError("Failed to generate validation pack. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedRequirements, requirementDetails, traceMatrixRows]);

  // Filter available requirements
  const filteredRequirements = availableRequirements
    .filter(req => {
      if (showOnlySelected) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return req.id.toLowerCase().includes(query) || 
             req.title.toLowerCase().includes(query);
    })
    .filter(req => !selectedRequirements.some(sel => sel.id === req.id));

  // Load on mount
  const initialized = availableRequirements.length > 0;
  if (!initialized) {
    loadRequirements();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "current": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "needs-review": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "stale": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "warning": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "HIGH": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "MEDIUM": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "LOW": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  const getAssuranceColor = (assurance: string) => {
    switch (assurance) {
      case "scripted": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "exploratory": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "unscripted-supplier": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
      case "unscripted-adhoc": return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
      default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Audit Package Export</p>
          <h2 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Validation Pack Generator
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Select requirements to include in the validation pack. Each requirement exports as a ZIP containing Risk Assessment, Assurance Rationale, Test Scripts, Gap Report, and Traceability Matrix.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={showOnlySelected}
              onChange={e => setShowOnlySelected(e.target.checked)}
              className="rounded border-zinc-300 text-accent focus:ring-accent"
            />
            Show only selected
          </label>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-red-600 hover:text-red-800 dark:text-red-400">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div role="status" className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Content - Two Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Available Requirements Panel */}
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Available Requirements
              <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                ({filteredRequirements.length})
              </span>
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search requirements..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-48 pl-9 pr-4 py-2 text-sm border border-zinc-300 rounded-md bg-white text-zinc-900 placeholder-zinc-400 focus:outline-2 focus:outline-accent dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div 
            ref={availableListRef}
            className="max-h-[500px] overflow-y-auto space-y-2"
            role="list"
            aria-label="Available requirements"
          >
            {filteredRequirements.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                {searchQuery ? "No matching requirements" : "All requirements added to selection"}
              </div>
            ) : (
              filteredRequirements.map((req) => (
                <div
                  key={req.id}
                  draggable
                  onDragStart={e => handleDragStart(e, req)}
                  className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 hover:border-accent hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 cursor-grab active:cursor-grabbing transition-colors"
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && handleDragStart(e as any, req)}
                >
                  <GripVertical className="h-5 w-5 text-zinc-400 cursor-grab" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{req.id}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{req.title}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(req.risk)}`}>
                      {req.risk}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getAssuranceColor(req.assurance)}`}>
                      {req.assurance}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const selected: SelectedRequirement = {
                        id: req.id,
                        title: req.title,
                        version: req.version,
                        risk: req.risk,
                        assurance: req.assurance,
                        status: req.status,
                      };
                      setSelectedRequirements(prev => [...prev, selected]);
                      loadRequirementDetail(req.id);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-accent hover:bg-zinc-100 rounded transition-colors"
                    aria-label={`Add ${req.id} to export`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Selected Requirements Panel */}
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Archive className="h-5 w-5 text-accent" />
              Export Selection
              <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                ({selectedRequirements.length})
              </span>
            </h3>
            {selectedRequirements.length > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Clear all
              </button>
            )}
          </div>

          <div 
            ref={selectedListRef}
            className="max-h-[500px] overflow-y-auto space-y-2"
            role="list"
            aria-label="Selected requirements for export"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {selectedRequirements.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 border-2 border-dashed border-zinc-200 rounded-lg dark:border-zinc-700">
                <Archive className="h-12 w-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="font-medium">Drag requirements here</p>
                <p className="text-sm mt-1">Or click the + button on any requirement</p>
              </div>
            ) : (
              selectedRequirements.map((req, index) => (
                <div
                  key={req.id}
                  className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 hover:border-accent hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 transition-colors"
                  role="listitem"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveRequirement(index, "up")}
                      disabled={index === 0}
                      className="p-1 text-zinc-400 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                      aria-label="Move up"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRequirement(index, "down")}
                      disabled={index === selectedRequirements.length - 1}
                      className="p-1 text-zinc-400 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                      aria-label="Move down"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{req.id}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{req.title}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(req.risk)}`}>
                      {req.risk}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getAssuranceColor(req.assurance)}`}>
                      {req.assurance}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromSelection(req.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label={`Remove ${req.id} from export`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Export Button */}
          {selectedRequirements.length > 0 && (
            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleExport}
                disabled={isGenerating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 text-base font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating validation pack...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Export Validation Pack ({selectedRequirements.length})
                  </>
                )}
              </button>
              <p className="mt-2 text-xs text-center text-zinc-500 dark:text-zinc-400">
                Includes: Risk Assessment, Assurance Rationale, Test Scripts, Gap Report, Traceability Matrix (PNG)
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Preview of what's included */}
      {selectedRequirements.length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            Export Contents Preview
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <FileType className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Risk Assessment</h4>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Severity, probability, detectability, RPN, evidence</p>
            </div>
            <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Assurance Rationale</h4>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Decision path, rule ID, compliance criteria</p>
            </div>
            <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <FileCode className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Test Scripts</h4>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Preconditions, steps, expected results</p>
            </div>
            <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mb-2" />
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Gap Report</h4>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Missing/stale assessments, compliance gaps</p>
            </div>
            <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <FileImage className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-2" />
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Traceability Matrix</h4>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Requirement → Risk → Assurance → Tests (PNG)</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}