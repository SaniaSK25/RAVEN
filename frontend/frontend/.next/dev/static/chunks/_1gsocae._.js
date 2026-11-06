(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/(pages)/requirements/[id]/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RequirementDetailPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.mjs [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.mjs [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.mjs [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.mjs [app-client] (ecmascript) <export default as LoaderCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.mjs [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clipboard-list.mjs [app-client] (ecmascript) <export default as ClipboardList>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$DashboardLayout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/DashboardLayout.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$backend$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/backend-api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$export$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/export-utils.ts [app-client] (ecmascript) <locals>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
const PRECONDITIONS_HEADER = "Preconditions:";
const STEPS_HEADER = "Test Steps:";
function splitScript(script) {
    const preIndex = script.indexOf(PRECONDITIONS_HEADER);
    const stepsIndex = script.indexOf(STEPS_HEADER);
    if (preIndex < 0 || stepsIndex < 0 || stepsIndex < preIndex) return null;
    return {
        preconditions: script.slice(preIndex + PRECONDITIONS_HEADER.length, stepsIndex).trim(),
        steps: script.slice(stepsIndex + STEPS_HEADER.length).trim()
    };
}
function formatScriptLines(text) {
    return text.replace(/\r\n/g, "\n").split(/\n(?=\s*(?:[-•]|\d+[.)])\s+)/).map((line)=>line.trim().replace(/^(?:[-•]|\d+[.)])\s+/, "")).filter(Boolean);
}
function ScriptBlock({ script }) {
    _s();
    const sections = splitScript(script);
    const [showPreconditions, setShowPreconditions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const steps = formatScriptLines(sections?.steps ?? script);
    function StepList({ items }) {
        if (items.length === 0) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-zinc-500 dark:text-zinc-400",
                children: "No test steps were recorded."
            }, void 0, false, {
                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                lineNumber: 46,
                columnNumber: 14
            }, this);
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
            className: "space-y-3",
            "aria-label": "Test steps",
            children: items.map((step, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                    className: "flex gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-zinc-800 dark:bg-zinc-950",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-accent dark:bg-orange-950/40 dark:text-orange-300",
                            children: index + 1
                        }, void 0, false, {
                            fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                            lineNumber: 55,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "min-w-0 pt-0.5 text-sm leading-6 text-zinc-700 dark:text-zinc-200",
                            children: step
                        }, void 0, false, {
                            fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                            lineNumber: 58,
                            columnNumber: 13
                        }, this)
                    ]
                }, `${index}-${step}`, true, {
                    fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                    lineNumber: 51,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
            lineNumber: 49,
            columnNumber: 7
        }, this);
    }
    if (!sections) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mt-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"], {
                            "aria-hidden": "true",
                            className: "h-4 w-4 text-accent"
                        }, void 0, false, {
                            fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                            lineNumber: 71,
                            columnNumber: 11
                        }, this),
                        "Test steps"
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                    lineNumber: 70,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StepList, {
                    items: steps
                }, void 0, false, {
                    fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                    lineNumber: 74,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
            lineNumber: 69,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-4 space-y-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setShowPreconditions((visible)=>!visible),
                        "aria-expanded": showPreconditions,
                        className: "flex w-full items-center justify-between gap-3 bg-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent dark:bg-zinc-900 dark:hover:bg-zinc-800",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block text-sm font-semibold text-zinc-800 dark:text-zinc-100",
                                        children: "Preconditions"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 88,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400",
                                        children: showPreconditions ? "Hide setup requirements" : "Show setup requirements before running this test"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 91,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 87,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                "aria-hidden": "true",
                                className: `h-4 w-4 shrink-0 text-zinc-400 transition-transform ${showPreconditions ? "rotate-180" : ""}`
                            }, void 0, false, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 95,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 81,
                        columnNumber: 9
                    }, this),
                    showPreconditions ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                            className: "space-y-2.5 text-sm leading-6 text-zinc-700 dark:text-zinc-200",
                            children: formatScriptLines(sections.preconditions).map((condition, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    className: "flex gap-2.5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            "aria-hidden": "true",
                                            className: "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                            lineNumber: 105,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: condition
                                        }, void 0, false, {
                                            fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                            lineNumber: 106,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, `${index}-${condition}`, true, {
                                    fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                    lineNumber: 104,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                            lineNumber: 102,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 101,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"], {
                                "aria-hidden": "true",
                                className: "h-4 w-4 text-accent"
                            }, void 0, false, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 116,
                                columnNumber: 11
                            }, this),
                            "Test steps",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-auto normal-case tracking-normal text-zinc-400",
                                children: [
                                    steps.length,
                                    " ",
                                    steps.length === 1 ? "step" : "steps"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 118,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StepList, {
                        items: steps
                    }, void 0, false, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 122,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                lineNumber: 114,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
        lineNumber: 79,
        columnNumber: 5
    }, this);
}
_s(ScriptBlock, "qrCvXLM7L/MZNvQ+f4Ya6iW2XfQ=");
_c = ScriptBlock;
function RequirementDetailPage() {
    _s1();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const id = decodeURIComponent(params.id);
    const [requirement, setRequirement] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [loadedFor, setLoadedFor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [isGeneratingScript, setIsGeneratingScript] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [scriptError, setScriptError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [scriptMessage, setScriptMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [isExporting, setIsExporting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [exportError, setExportError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [exportSuccess, setExportSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RequirementDetailPage.useEffect": ()=>{
            let active = true;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$backend$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["backendFetch"])(`requirements/${encodeURIComponent(id)}`).then({
                "RequirementDetailPage.useEffect": (data)=>{
                    if (active) {
                        setRequirement(data);
                        setLoadedFor(id);
                        setError(null);
                    }
                }
            }["RequirementDetailPage.useEffect"]).catch({
                "RequirementDetailPage.useEffect": (cause)=>{
                    if (active) {
                        setError({
                            id,
                            message: cause instanceof Error ? cause.message : "Could not load this requirement."
                        });
                    }
                }
            }["RequirementDetailPage.useEffect"]).finally({
                "RequirementDetailPage.useEffect": ()=>{
                    if (active) setLoading(false);
                }
            }["RequirementDetailPage.useEffect"]);
            return ({
                "RequirementDetailPage.useEffect": ()=>{
                    active = false;
                }
            })["RequirementDetailPage.useEffect"];
        }
    }["RequirementDetailPage.useEffect"], [
        id
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RequirementDetailPage.useEffect": ()=>{
            if (loadedFor !== id) return;
            const tab = new URLSearchParams(window.location.search).get("tab");
            const targetId = window.location.hash.slice(1) || (tab === "risk" || tab === "assurance" || tab === "tests" ? tab : "");
            if (targetId) {
                document.getElementById(targetId)?.scrollIntoView({
                    block: "start"
                });
            }
        }
    }["RequirementDetailPage.useEffect"], [
        id,
        loadedFor
    ]);
    async function generateScript() {
        setIsGeneratingScript(true);
        setScriptError("");
        setScriptMessage("");
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$backend$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["backendFetch"])(`assessments/${encodeURIComponent(id)}/generate-script`, {
                method: "POST"
            });
            const updated = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$backend$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["backendFetch"])(`requirements/${encodeURIComponent(id)}`);
            setRequirement(updated);
            setLoadedFor(id);
            setScriptMessage("Test script generated and saved for this requirement version.");
        } catch (cause) {
            setScriptError(cause instanceof Error ? cause.message : "The test script could not be generated.");
        } finally{
            setIsGeneratingScript(false);
        }
    }
    async function exportValidationPack() {
        setIsExporting(true);
        setExportError("");
        setExportSuccess("");
        try {
            const dataset = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$export$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["fetchValidationDataset"])([
                id
            ]);
            const zipBlob = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$export$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["generateValidationPackZip"])(dataset);
            // Download
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const selected = dataset.requirements[0];
            const label = selected?.display_key || selected?.req_key || dataset.pack_reference || "validation-pack";
            const filename = `RAVEN_Validation_Pack_${label}_${timestamp}.zip`;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$export$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["downloadBlob"])(zipBlob, filename);
            setExportSuccess(`Validation pack ZIP generated for ${label}.`);
        } catch (err) {
            console.error("Export failed:", err);
            setExportError(err instanceof Error ? `Failed to generate validation pack: ${err.message}` : "Failed to generate validation pack. Please try again.");
        } finally{
            setIsExporting(false);
        }
    }
    const hasGeneratedScript = requirement?.tests?.some((test)=>test.origin === "generated" && test.freshness !== "superseded") ?? false;
    const canGenerateScript = String(requirement?.assurance?.level ?? "").toLowerCase() === "scripted" && !hasGeneratedScript;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$DashboardLayout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                href: "/requirements",
                className: "inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-accent dark:text-zinc-300 dark:hover:text-white",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                        "aria-hidden": "true",
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 256,
                        columnNumber: 9
                    }, this),
                    "Requirements"
                ]
            }, void 0, true, {
                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                lineNumber: 252,
                columnNumber: 7
            }, this),
            exportSuccess && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "status",
                className: "mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                        "aria-hidden": "true",
                        className: "h-4 w-4 flex-shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 262,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: exportSuccess
                    }, void 0, false, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 263,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                lineNumber: 261,
                columnNumber: 9
            }, this),
            exportError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "alert",
                className: "mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                        "aria-hidden": "true",
                        className: "h-4 w-4 flex-shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 268,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: exportError
                    }, void 0, false, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 269,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                lineNumber: 267,
                columnNumber: 9
            }, this),
            error?.id === id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                role: "alert",
                className: "mt-6 rounded-xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-zinc-950",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 font-semibold text-red-800 dark:text-red-300",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                "aria-hidden": "true",
                                className: "h-5 w-5"
                            }, void 0, false, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 276,
                                columnNumber: 13
                            }, this),
                            "Requirement could not be loaded"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 275,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2 text-sm text-zinc-600 dark:text-zinc-300",
                        children: error.message
                    }, void 0, false, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 279,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                lineNumber: 274,
                columnNumber: 9
            }, this) : loading || loadedFor !== id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "status",
                className: "mt-8 flex items-center gap-2 text-sm text-zinc-500",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__["LoaderCircle"], {
                        "aria-hidden": "true",
                        className: "h-4 w-4 animate-spin"
                    }, void 0, false, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 283,
                        columnNumber: 11
                    }, this),
                    "Loading requirement…"
                ]
            }, void 0, true, {
                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                lineNumber: 282,
                columnNumber: 9
            }, this) : requirement ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: "mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "font-mono text-sm text-zinc-500",
                                    children: [
                                        requirement.req_key ?? requirement.id,
                                        requirement.version ? ` · v${requirement.version}` : ""
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                    lineNumber: 290,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "mt-2 max-w-4xl text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50",
                                    children: requirement.description
                                }, void 0, false, {
                                    fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                    lineNumber: 294,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                            lineNumber: 289,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 288,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 flex flex-wrap items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>void exportValidationPack(),
                                disabled: isExporting,
                                className: "inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
                                children: [
                                    isExporting ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__["LoaderCircle"], {
                                        "aria-hidden": "true",
                                        className: "h-4 w-4 animate-spin"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 308,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {
                                        "aria-hidden": "true",
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 310,
                                        columnNumber: 17
                                    }, this),
                                    isExporting ? "Generating report PDFs…" : "Export validation pack ZIP"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 301,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-zinc-500 dark:text-zinc-400",
                                children: "Five separate PDFs: Risk Assessment, Assurance Rationale, Test Scripts, Traceability Matrix, and Gap Report"
                            }, void 0, false, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 314,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 300,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "page-panel mt-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-base font-semibold text-zinc-900 dark:text-zinc-50",
                                children: "Current requirement text"
                            }, void 0, false, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 320,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300",
                                children: requirement.text || requirement.description
                            }, void 0, false, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 323,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 319,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 grid gap-4 md:grid-cols-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                id: "risk",
                                className: "page-panel scroll-mt-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-sm font-semibold text-zinc-900 dark:text-zinc-50",
                                        children: "Risk"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 330,
                                        columnNumber: 15
                                    }, this),
                                    requirement.risk ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                        className: "mt-3 space-y-2 text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                        className: "text-zinc-500",
                                                        children: "Band"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                        lineNumber: 333,
                                                        columnNumber: 63
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                        children: requirement.risk.band
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                        lineNumber: 333,
                                                        columnNumber: 102
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                lineNumber: 333,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                        className: "text-zinc-500",
                                                        children: "RPN"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                        lineNumber: 334,
                                                        columnNumber: 63
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                        children: requirement.risk.rpn
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                        lineNumber: 334,
                                                        columnNumber: 101
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                lineNumber: 334,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                        className: "text-zinc-500",
                                                        children: "Freshness"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                        lineNumber: 335,
                                                        columnNumber: 63
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                        children: requirement.risk.freshness
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                        lineNumber: 335,
                                                        columnNumber: 107
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                lineNumber: 335,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 332,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 text-sm text-zinc-500",
                                        children: "No persisted risk assessment."
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 337,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 329,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                id: "assurance",
                                className: "page-panel scroll-mt-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-sm font-semibold text-zinc-900 dark:text-zinc-50",
                                        children: "Assurance"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 340,
                                        columnNumber: 15
                                    }, this),
                                    requirement.assurance ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-2 text-sm capitalize text-zinc-700 dark:text-zinc-200",
                                                children: requirement.assurance.level
                                            }, void 0, false, {
                                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                lineNumber: 343,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-1 text-xs text-zinc-500",
                                                children: [
                                                    requirement.assurance.reason_code,
                                                    " · ",
                                                    requirement.assurance.freshness
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                lineNumber: 344,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-2 text-sm leading-5 text-zinc-600 dark:text-zinc-300",
                                                children: requirement.assurance.label
                                            }, void 0, false, {
                                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                lineNumber: 345,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 342,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 text-sm text-zinc-500",
                                        children: "No persisted assurance decision."
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 347,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 339,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                id: "tests",
                                className: "page-panel scroll-mt-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-sm font-semibold text-zinc-900 dark:text-zinc-50",
                                        children: "Current-version tests"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 350,
                                        columnNumber: 15
                                    }, this),
                                    requirement.tests?.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "mt-2 space-y-2 text-sm",
                                        children: requirement.tests?.map((test)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                id: `test-${test.id}`,
                                                className: "scroll-mt-6",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-medium",
                                                        children: test.title ?? test.external_code ?? "Test script"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                        lineNumber: 355,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "block text-xs text-zinc-500",
                                                        children: [
                                                            test.origin,
                                                            " · ",
                                                            test.freshness
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                        lineNumber: 356,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, test.id, true, {
                                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                lineNumber: 354,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 352,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 text-sm text-zinc-500",
                                        children: "No persisted tests for this version."
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 360,
                                        columnNumber: 19
                                    }, this),
                                    canGenerateScript ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-zinc-600 dark:text-zinc-300",
                                                children: "Scripted assurance requires a test script. Generate one when you are ready."
                                            }, void 0, false, {
                                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                lineNumber: 363,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>void generateScript(),
                                                disabled: isGeneratingScript,
                                                className: "mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400",
                                                children: [
                                                    isGeneratingScript ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LoaderCircle$3e$__["LoaderCircle"], {
                                                        "aria-hidden": "true",
                                                        className: "h-4 w-4 animate-spin"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                        lineNumber: 373,
                                                        columnNumber: 23
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {
                                                        "aria-hidden": "true",
                                                        className: "h-4 w-4"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                        lineNumber: 375,
                                                        columnNumber: 23
                                                    }, this),
                                                    isGeneratingScript ? "Generating script…" : "Generate test script"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                lineNumber: 366,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 362,
                                        columnNumber: 17
                                    }, this) : null,
                                    isGeneratingScript ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        role: "status",
                                        className: "mt-3 text-sm text-zinc-500 dark:text-zinc-400",
                                        children: "Generating and saving a script from the current requirement text."
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 382,
                                        columnNumber: 17
                                    }, this) : null,
                                    scriptMessage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        role: "status",
                                        className: "mt-3 text-sm text-emerald-700 dark:text-emerald-300",
                                        children: scriptMessage
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 387,
                                        columnNumber: 17
                                    }, this) : null,
                                    scriptError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        role: "alert",
                                        className: "mt-3 text-sm text-red-700 dark:text-red-300",
                                        children: scriptError
                                    }, void 0, false, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 392,
                                        columnNumber: 17
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 349,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 328,
                        columnNumber: 11
                    }, this),
                    requirement.tests?.some((test)=>test.origin === "generated" && test.freshness !== "superseded" && test.script) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "page-panel mt-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-sm font-semibold text-zinc-900 dark:text-zinc-50",
                                children: "Generated test script"
                            }, void 0, false, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 406,
                                columnNumber: 15
                            }, this),
                            requirement.tests?.filter((test)=>test.origin === "generated" && test.freshness !== "superseded" && test.script).map((test)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ScriptBlock, {
                                    script: test.script ?? ""
                                }, test.id, false, {
                                    fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                    lineNumber: 417,
                                    columnNumber: 19
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 405,
                        columnNumber: 13
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "page-panel mt-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-sm font-semibold text-zinc-900 dark:text-zinc-50",
                                children: "Version history"
                            }, void 0, false, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 423,
                                columnNumber: 13
                            }, this),
                            requirement.versions?.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                                className: "mt-3 space-y-3",
                                children: requirement.versions?.map((version)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: "border-l-2 border-zinc-200 pl-3 dark:border-zinc-700",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm font-medium",
                                                children: [
                                                    "v",
                                                    version.version,
                                                    version.is_current ? " · Current" : ""
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                lineNumber: 428,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300",
                                                children: version.text
                                            }, void 0, false, {
                                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                                lineNumber: 429,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, version.version, true, {
                                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                        lineNumber: 427,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 425,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-sm text-zinc-500",
                                children: "No version history is available."
                            }, void 0, false, {
                                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                                lineNumber: 433,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 422,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-3 text-xs text-zinc-500 dark:text-zinc-400",
                        children: "Analysis uses the configured backend pipeline and saves results against the current requirement version."
                    }, void 0, false, {
                        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                        lineNumber: 435,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
                lineNumber: 287,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/app/(pages)/requirements/[id]/page.tsx",
        lineNumber: 251,
        columnNumber: 5
    }, this);
}
_s1(RequirementDetailPage, "k7A8fOSSbYjdrQk7R1WKrprIdD0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"]
    ];
});
_c1 = RequirementDetailPage;
var _c, _c1;
__turbopack_context__.k.register(_c, "ScriptBlock");
__turbopack_context__.k.register(_c1, "RequirementDetailPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/DashboardLayout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DashboardLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clipboard-check.mjs [app-client] (ecmascript) <export default as ClipboardCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/download.mjs [app-client] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.mjs [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flask$2d$conical$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FlaskConical$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/flask-conical.mjs [app-client] (ecmascript) <export default as FlaskConical>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2d$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw-clock.mjs [app-client] (ecmascript) <export default as History>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-dashboard.mjs [app-client] (ecmascript) <export default as LayoutDashboard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.mjs [app-client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.mjs [app-client] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$network$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Network$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/network.mjs [app-client] (ecmascript) <export default as Network>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scale$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Scale$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/scale.mjs [app-client] (ecmascript) <export default as Scale>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-check.mjs [app-client] (ecmascript) <export default as ShieldCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.mjs [app-client] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$user$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-user.mjs [app-client] (ecmascript) <export default as UserCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const NAV_ITEMS = [
    {
        label: "Dashboard",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__["LayoutDashboard"],
        href: "/"
    },
    {
        label: "Requirements",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"],
        href: "/requirements"
    },
    {
        label: "Ingestion",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"],
        href: "/ingestion"
    },
    {
        label: "Assessments",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardCheck$3e$__["ClipboardCheck"],
        href: "/assessments"
    },
    {
        label: "Assurance",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"],
        href: "/assurance"
    },
    {
        label: "Tests",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flask$2d$conical$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FlaskConical$3e$__["FlaskConical"],
        href: "/tests"
    },
    {
        label: "Traceability",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$network$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Network$3e$__["Network"],
        href: "/traceability"
    },
    {
        label: "Changes",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2d$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__["History"],
        href: "/changes"
    },
    {
        label: "Compliance",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scale$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Scale$3e$__["Scale"],
        href: "/compliance"
    },
    {
        label: "Exports",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"],
        href: "/exports"
    },
    {
        label: "Settings",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"],
        href: "/settings"
    },
    {
        label: "Profile",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$user$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCircle$3e$__["UserCircle"],
        href: "/profile"
    }
];
function DashboardLayout({ children }) {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [mobileNavOpen, setMobileNavOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [sidebarCollapsed, setSidebarCollapsed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const sidebarRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isActive = (href)=>href === "/" ? pathname === "/" : pathname.startsWith(href);
    const handleMouseEnter = ()=>setSidebarCollapsed(false);
    const handleMouseLeave = ()=>setSidebarCollapsed(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DashboardLayout.useEffect": ()=>{
            try {
                const raw = window.localStorage.getItem("raven_user");
                if (raw) setUser(JSON.parse(raw));
            } catch  {
            // Ignore malformed session data; the proxy still gates the routes.
            }
        }
    }["DashboardLayout.useEffect"], []);
    function signOut() {
        window.localStorage.removeItem("raven_access_token");
        window.localStorage.removeItem("raven_user");
        document.cookie = "raven_session=; Path=/; Max-Age=0; SameSite=Lax";
        router.push("/login");
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex min-h-screen bg-canvas text-ink dark:bg-black dark:text-zinc-100",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                ref: sidebarRef,
                onMouseEnter: handleMouseEnter,
                onMouseLeave: handleMouseLeave,
                className: `hidden shrink-0 flex-col self-start border-r border-zinc-200 bg-[linear-gradient(180deg,#070708_0%,#111111_100%)] transition-[width] duration-200 md:sticky md:top-0 md:flex md:h-screen dark:border-zinc-800 dark:bg-black ${sidebarCollapsed ? "w-16" : "w-64"}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `flex h-16 items-center gap-2.5 border-b border-white/10 ${sidebarCollapsed ? "justify-center px-0" : "px-5"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": "true",
                                className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[13px] font-bold tracking-tight text-brand shadow-sm",
                                children: "R"
                            }, void 0, false, {
                                fileName: "[project]/components/DashboardLayout.tsx",
                                lineNumber: 83,
                                columnNumber: 11
                            }, this),
                            !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "leading-tight",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block text-[15px] font-bold tracking-wide text-white",
                                        children: "RAVEN"
                                    }, void 0, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 91,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block text-[11px] font-medium text-zinc-400",
                                        children: "Regulatory QA"
                                    }, void 0, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 94,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/DashboardLayout.tsx",
                                lineNumber: 90,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/DashboardLayout.tsx",
                        lineNumber: 82,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        "aria-label": "Primary",
                        className: "sidebar-nav flex-1 overscroll-contain overflow-y-auto p-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                            className: "space-y-1",
                            children: NAV_ITEMS.map((item)=>{
                                const Icon = item.icon;
                                if (item.href && isActive(item.href)) {
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: item.href,
                                            "aria-current": "page",
                                            title: sidebarCollapsed ? item.label : undefined,
                                            className: `relative flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${sidebarCollapsed ? "justify-center" : ""}`,
                                            children: [
                                                !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    "aria-hidden": "true",
                                                    className: "absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-full bg-accent"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DashboardLayout.tsx",
                                                    lineNumber: 115,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                    "aria-hidden": "true",
                                                    className: "h-4 w-4 shrink-0"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DashboardLayout.tsx",
                                                    lineNumber: 120,
                                                    columnNumber: 23
                                                }, this),
                                                !sidebarCollapsed && item.label
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/DashboardLayout.tsx",
                                            lineNumber: 108,
                                            columnNumber: 21
                                        }, this)
                                    }, item.label, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 107,
                                        columnNumber: 19
                                    }, this);
                                }
                                if (item.href) {
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: item.href,
                                            title: sidebarCollapsed ? item.label : undefined,
                                            className: `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-accent ${sidebarCollapsed ? "justify-center" : ""}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                    "aria-hidden": "true",
                                                    className: "h-4 w-4 shrink-0"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DashboardLayout.tsx",
                                                    lineNumber: 134,
                                                    columnNumber: 23
                                                }, this),
                                                !sidebarCollapsed && item.label
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/DashboardLayout.tsx",
                                            lineNumber: 129,
                                            columnNumber: 21
                                        }, this)
                                    }, item.label, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 128,
                                        columnNumber: 19
                                    }, this);
                                }
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        disabled: true,
                                        title: `${item.label} — coming soon`,
                                        className: `flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 opacity-80 ${sidebarCollapsed ? "justify-center" : ""}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                "aria-hidden": "true",
                                                className: "h-4 w-4 shrink-0"
                                            }, void 0, false, {
                                                fileName: "[project]/components/DashboardLayout.tsx",
                                                lineNumber: 148,
                                                columnNumber: 21
                                            }, this),
                                            !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "flex-1 text-left",
                                                children: item.label
                                            }, void 0, false, {
                                                fileName: "[project]/components/DashboardLayout.tsx",
                                                lineNumber: 149,
                                                columnNumber: 43
                                            }, this),
                                            !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "rounded border border-zinc-700 px-1.5 py-px text-[10px] font-semibold tracking-wide text-zinc-500 uppercase",
                                                children: "Soon"
                                            }, void 0, false, {
                                                fileName: "[project]/components/DashboardLayout.tsx",
                                                lineNumber: 151,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 142,
                                        columnNumber: 19
                                    }, this)
                                }, item.label, false, {
                                    fileName: "[project]/components/DashboardLayout.tsx",
                                    lineNumber: 141,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/components/DashboardLayout.tsx",
                            lineNumber: 102,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/DashboardLayout.tsx",
                        lineNumber: 101,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-t border-white/10 p-3",
                        children: [
                            !sidebarCollapsed && user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 px-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "truncate text-sm font-medium text-white",
                                        children: user.display_name || user.username
                                    }, void 0, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 165,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "truncate text-[11px] text-zinc-500",
                                        children: user.username
                                    }, void 0, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 168,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/DashboardLayout.tsx",
                                lineNumber: 164,
                                columnNumber: 13
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: signOut,
                                title: "Sign out",
                                className: `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-accent ${sidebarCollapsed ? "justify-center" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                        "aria-hidden": "true",
                                        className: "h-4 w-4 shrink-0"
                                    }, void 0, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 177,
                                        columnNumber: 13
                                    }, this),
                                    !sidebarCollapsed && "Sign out"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/DashboardLayout.tsx",
                                lineNumber: 171,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/DashboardLayout.tsx",
                        lineNumber: 162,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/DashboardLayout.tsx",
                lineNumber: 76,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex min-w-0 flex-1 flex-col",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: "sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/80",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center gap-2.5 md:hidden",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "aria-hidden": "true",
                                        className: "flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900",
                                        children: "R"
                                    }, void 0, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 186,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm font-bold tracking-wide",
                                        children: "RAVEN"
                                    }, void 0, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 192,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/DashboardLayout.tsx",
                                lineNumber: 185,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    "aria-label": mobileNavOpen ? "Close navigation" : "Open navigation",
                                    "aria-expanded": mobileNavOpen,
                                    "aria-controls": "mobile-primary-navigation",
                                    onClick: ()=>setMobileNavOpen((open)=>!open),
                                    className: "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
                                    children: mobileNavOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                        "aria-hidden": "true",
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 204,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                                        "aria-hidden": "true",
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 206,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/DashboardLayout.tsx",
                                    lineNumber: 195,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/DashboardLayout.tsx",
                                lineNumber: 194,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/DashboardLayout.tsx",
                        lineNumber: 184,
                        columnNumber: 9
                    }, this),
                    mobileNavOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        id: "mobile-primary-navigation",
                        "aria-label": "Primary",
                        className: "border-b border-zinc-200 bg-white/85 p-3 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/85",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "grid grid-cols-2 gap-1",
                                children: NAV_ITEMS.map((item)=>{
                                    const Icon = item.icon;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: item.href ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: item.href,
                                            "aria-current": isActive(item.href) ? "page" : undefined,
                                            onClick: ()=>setMobileNavOpen(false),
                                            className: `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ${isActive(item.href) ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white" : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                    "aria-hidden": "true",
                                                    className: "h-4 w-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DashboardLayout.tsx",
                                                    lineNumber: 234,
                                                    columnNumber: 25
                                                }, this),
                                                item.label
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/DashboardLayout.tsx",
                                            lineNumber: 224,
                                            columnNumber: 23
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-400",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                    "aria-hidden": "true",
                                                    className: "h-4 w-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DashboardLayout.tsx",
                                                    lineNumber: 239,
                                                    columnNumber: 25
                                                }, this),
                                                item.label,
                                                " · Soon"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/DashboardLayout.tsx",
                                            lineNumber: 238,
                                            columnNumber: 23
                                        }, this)
                                    }, item.label, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 222,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/components/DashboardLayout.tsx",
                                lineNumber: 218,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>{
                                    setMobileNavOpen(false);
                                    signOut();
                                },
                                className: "mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-accent dark:text-zinc-300 dark:hover:bg-zinc-900",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                        "aria-hidden": "true",
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/components/DashboardLayout.tsx",
                                        lineNumber: 255,
                                        columnNumber: 15
                                    }, this),
                                    "Sign out"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/DashboardLayout.tsx",
                                lineNumber: 247,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/DashboardLayout.tsx",
                        lineNumber: 213,
                        columnNumber: 11
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "mx-auto w-full max-w-6xl flex-1 px-6 py-8 md:py-10",
                        children: children
                    }, void 0, false, {
                        fileName: "[project]/components/DashboardLayout.tsx",
                        lineNumber: 261,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/DashboardLayout.tsx",
                lineNumber: 183,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/DashboardLayout.tsx",
        lineNumber: 75,
        columnNumber: 5
    }, this);
}
_s(DashboardLayout, "XlhsBT6AEGI8p9xbBxuKNN9LwJk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = DashboardLayout;
var _c;
__turbopack_context__.k.register(_c, "DashboardLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/backend-api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RAVEN_BASE_PATH",
    ()=>RAVEN_BASE_PATH,
    "backendFetch",
    ()=>backendFetch
]);
const RAVEN_BASE_PATH = "/raven";
async function backendFetch(path, init) {
    const normalizedPath = path.replace(/^\/+/, "");
    const accessToken = ("TURBOPACK compile-time truthy", 1) ? window.localStorage.getItem("raven_access_token") : "TURBOPACK unreachable";
    const response = await fetch(`${RAVEN_BASE_PATH}/api/v1/${normalizedPath}`, {
        ...init,
        cache: "no-store",
        headers: {
            ...init?.body ? {
                "Content-Type": "application/json"
            } : {},
            ...accessToken ? {
                Authorization: `Bearer ${accessToken}`
            } : {},
            ...init?.headers
        }
    });
    let body;
    try {
        body = await response.json();
    } catch  {
        body = null;
    }
    if (!response.ok) {
        const detail = typeof body === "object" && body !== null && "detail" in body && typeof body.detail === "string" ? body.detail : `Backend request failed (${response.status}).`;
        throw new Error(detail);
    }
    return body;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/export-utils.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "downloadBlob",
    ()=>downloadBlob,
    "fetchValidationDataset",
    ()=>fetchValidationDataset,
    "generateAssuranceRationalePDF",
    ()=>generateAssuranceRationalePDF,
    "generateGapReportPDF",
    ()=>generateGapReportPDF,
    "generateRiskAssessmentPDF",
    ()=>generateRiskAssessmentPDF,
    "generateTestScriptsPDF",
    ()=>generateTestScriptsPDF,
    "generateTraceabilityPDF",
    ()=>generateTraceabilityPDF,
    "generateValidationPackPDF",
    ()=>generateValidationPackPDF,
    "generateValidationPackZip",
    ()=>generateValidationPackZip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jszip$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jszip/lib/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$backend$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/backend-api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$layout$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/pdf-layout.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$sections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/pdf-sections.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validation-pack.ts [app-client] (ecmascript)");
"use client";
;
;
;
;
;
function assertDataset(data) {
    if (!data || typeof data !== "object" || !Array.isArray(data.requirements) || !data.requirements.length || !data.traceability || !Array.isArray(data.traceability.rows) || !Array.isArray(data.orphans) || !Array.isArray(data.changes)) {
        throw new Error("The backend returned an incomplete validation-pack dataset. No PDF or ZIP was created.");
    }
}
async function fetchValidationDataset(keys) {
    const unique = [
        ...new Set(keys.map((key)=>key.trim()).filter(Boolean))
    ];
    if (!unique.length) {
        throw new Error("Select at least one requirement before retrieving export data.");
    }
    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$backend$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["backendFetch"])(`validation-pack?requirement_keys=${encodeURIComponent(unique.join(","))}`);
    assertDataset(data);
    return data;
}
function sectionPdf(data, section, refs) {
    assertDataset(data);
    const generatedAt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateTime"])(data.generated_at);
    const builder = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$layout$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PdfBuilder"]({
        packReference: refs.packReference,
        generatedAt,
        title: `RAVEN — ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$sections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SECTION_TITLES"][section]}`
    });
    builder.cover({
        subtitle: "Validation evidence and traceability",
        scope: "Selected requirements",
        versionPolicy: "Current version per requirement",
        requirementCount: data.requirements.length,
        generatedAt,
        packReference: refs.packReference,
        requirementKeys: data.requirements.map(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requirementKey"]),
        contents: [
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$sections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SECTION_TITLES"][section]
        ]
    });
    switch(section){
        case "risk":
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$sections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["renderRiskAssessmentSection"])(builder, data, refs);
            break;
        case "assurance":
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$sections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["renderAssuranceSection"])(builder, data, refs);
            break;
        case "tests":
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$sections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["renderTestScriptsSection"])(builder, data, refs);
            break;
        case "traceability":
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$sections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["renderTraceabilitySection"])(builder, data, refs).then(()=>builder.finalize());
        case "gaps":
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$sections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["renderGapReportSection"])(builder, data, refs);
            break;
    }
    return Promise.resolve(builder.finalize());
}
function generateRiskAssessmentPDF(data, refs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildReportReferences"])(data)) {
    return sectionPdf(data, "risk", refs);
}
function generateAssuranceRationalePDF(data, refs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildReportReferences"])(data)) {
    return sectionPdf(data, "assurance", refs);
}
function generateTestScriptsPDF(data, refs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildReportReferences"])(data)) {
    return sectionPdf(data, "tests", refs);
}
function generateTraceabilityPDF(data, refs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildReportReferences"])(data)) {
    return sectionPdf(data, "traceability", refs);
}
function generateGapReportPDF(data, refs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildReportReferences"])(data)) {
    return sectionPdf(data, "gaps", refs);
}
function generateValidationPackPDF(data, refs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildReportReferences"])(data)) {
    assertDataset(data);
    const builder = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$layout$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PdfBuilder"]({
        packReference: refs.packReference,
        generatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateTime"])(data.generated_at),
        title: "RAVEN — Validation Pack Summary"
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$sections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["renderConsolidatedPack"])(builder, data, refs);
}
async function generateValidationPackZip(data) {
    assertDataset(data);
    const refs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildReportReferences"])(data);
    const zip = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jszip$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]();
    const sectionFiles = await Promise.all([
        generateRiskAssessmentPDF(data, refs).then((blob)=>[
                "01_Risk_Assessment.pdf",
                blob
            ]),
        generateAssuranceRationalePDF(data, refs).then((blob)=>[
                "02_Assurance_Rationale.pdf",
                blob
            ]),
        generateTestScriptsPDF(data, refs).then((blob)=>[
                "03_Test_Scripts.pdf",
                blob
            ]),
        generateTraceabilityPDF(data, refs).then((blob)=>[
                "04_Traceability_Matrix.pdf",
                blob
            ]),
        generateGapReportPDF(data, refs).then((blob)=>[
                "05_Gap_Report.pdf",
                blob
            ])
    ]);
    for (const [filename, blob] of sectionFiles)zip.file(filename, blob);
    return zip.generateAsync({
        type: "blob",
        compression: "DEFLATE"
    });
}
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url), 2000);
}
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/pdf-layout.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PdfBuilder",
    ()=>PdfBuilder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jspdf$2f$dist$2f$jspdf$2e$es$2e$min$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jspdf/dist/jspdf.es.min.js [app-client] (ecmascript)");
;
const MARGIN = 15;
const HEADER_HEIGHT = 15;
const FOOTER_HEIGHT = 12;
const BODY_FONT = 10.5;
const BODY_LINE = 5.1;
const ORANGE = [
    241,
    108,
    48
];
const PEACH = [
    255,
    236,
    229
];
const BORDER = [
    205,
    205,
    205
];
const TEXT = [
    17,
    17,
    17
];
const WHITE = [
    255,
    255,
    255
];
const MUTED = [
    82,
    82,
    82
];
const ROW_ALT = PEACH;
const CARD_HORIZONTAL_PADDING = 2.5;
const CARD_VERTICAL_PADDING = 5;
const CHAPTERS = {
    "Executive Summary": 1,
    "Risk Assessment": 2,
    "Assurance Rationale": 3,
    "Test Scripts": 4,
    "Traceability Matrix": 5,
    "Gap Report": 6,
    "Appendices": 7,
    "Evidence Index": 7,
    "Limitations and Methodology": 8
};
const CALLOUT_COLORS = {
    info: {
        fill: PEACH,
        border: ORANGE
    },
    success: {
        fill: PEACH,
        border: ORANGE
    },
    warning: {
        fill: PEACH,
        border: ORANGE
    },
    critical: {
        fill: PEACH,
        border: [
            194,
            66,
            21
        ]
    }
};
function asText(value) {
    if (value === null || value === undefined) return "";
    return String(value);
}
function pageFormat() {
    return "a4";
}
class PdfBuilder {
    doc;
    packReference;
    generatedAt;
    title;
    margin = MARGIN;
    y = 0;
    landscape = false;
    sectionTitle = "";
    sectionPages = new Map();
    sectionNumber = 0;
    subsectionNumber = 0;
    cardSegments = [];
    activeCard = null;
    finalized = false;
    hasCover = false;
    constructor(options){
        this.doc = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jspdf$2f$dist$2f$jspdf$2e$es$2e$min$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsPDF"]({
            unit: "mm",
            format: "a4",
            orientation: "portrait",
            compress: true
        });
        this.packReference = options.packReference;
        this.generatedAt = options.generatedAt;
        this.title = options.title || "RAVEN — Validation Pack";
        this.doc.setProperties({
            title: this.title,
            subject: "Selected-requirement validation pack",
            creator: "RAVEN",
            author: "RAVEN"
        });
        this.drawPageHeader();
        this.y = HEADER_HEIGHT + 10;
    }
    get pageWidth() {
        return this.doc.internal.pageSize.getWidth();
    }
    get pageHeight() {
        return this.doc.internal.pageSize.getHeight();
    }
    get contentWidth() {
        return this.pageWidth - this.margin * 2;
    }
    get currentPage() {
        return this.doc.getNumberOfPages();
    }
    bottomLimit() {
        return this.pageHeight - FOOTER_HEIGHT;
    }
    drawPageHeader() {
        const width = this.pageWidth;
        this.doc.setDrawColor(...BORDER);
        this.doc.setLineWidth(0.35);
        this.doc.line(this.margin, HEADER_HEIGHT, width - this.margin, HEADER_HEIGHT);
        this.doc.setTextColor(...ORANGE);
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(9.5);
        this.doc.text("RAVEN", this.margin, 10.5);
        this.doc.text("Validation Pack", width / 2, 10.5, {
            align: "center"
        });
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(8.5);
        this.doc.setTextColor(...MUTED);
        this.doc.text("LIMS", width - this.margin, 10.5, {
            align: "right"
        });
        this.doc.setTextColor(...TEXT);
    }
    newPage(section = this.sectionTitle, landscape = this.landscape) {
        if (this.activeCard && this.activeCard.page === this.currentPage) {
            this.cardSegments.push({
                page: this.currentPage,
                top: this.activeCard.top,
                bottom: Math.min(this.pageHeight - FOOTER_HEIGHT - 3, this.y + CARD_VERTICAL_PADDING),
                x: this.activeCard.x,
                width: this.activeCard.width
            });
        }
        this.doc.addPage(pageFormat(), landscape ? "landscape" : "portrait");
        this.landscape = landscape;
        this.sectionTitle = section;
        this.drawPageHeader();
        this.y = HEADER_HEIGHT + 10;
        if (this.activeCard) {
            this.activeCard = {
                page: this.currentPage,
                top: this.y - CARD_VERTICAL_PADDING,
                x: this.margin - CARD_HORIZONTAL_PADDING,
                width: this.contentWidth + CARD_HORIZONTAL_PADDING * 2
            };
        }
    }
    ensureSpace(height) {
        if (this.y + height > this.bottomLimit()) {
            this.newPage(this.sectionTitle, this.landscape);
        }
    }
    startSection(title, options = {}) {
        const newPage = options.newPage ?? true;
        const landscape = options.landscape ?? this.landscape;
        if (newPage) {
            this.sectionTitle = title;
            this.landscape = landscape;
            this.newPage(title, landscape);
        } else if (landscape !== this.landscape) {
            this.landscape = landscape;
            this.newPage(title, landscape);
        } else {
            this.sectionTitle = title;
        }
        this.sectionNumber = CHAPTERS[title] || 0;
        this.subsectionNumber = 0;
        if (options.recordPage !== false) {
            this.sectionPages.set(title, this.currentPage);
        }
        this.sectionHeading(title);
    }
    sectionHeading(title) {
        this.ensureSpace(26);
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(17);
        const lines = this.doc.splitTextToSize(title, this.contentWidth);
        this.doc.setTextColor(...ORANGE);
        const number = CHAPTERS[title];
        let headingX = this.margin;
        if (number) {
            const badgeSize = 10.5;
            this.doc.setFillColor(...ORANGE);
            this.doc.roundedRect(this.margin, this.y - 7, badgeSize, badgeSize, 0.8, 0.8, "F");
            this.doc.setFontSize(10.5);
            this.doc.setTextColor(...WHITE);
            this.doc.text(String(number), this.margin + badgeSize / 2, this.y, {
                align: "center"
            });
            this.doc.setFontSize(17);
            this.doc.setTextColor(...ORANGE);
            headingX += badgeSize + 3;
        }
        for (const line of lines){
            this.doc.text(line, headingX, this.y);
            this.y += 7;
        }
        this.y += 4;
    }
    subheading(title, options = {}) {
        this.ensureSpace(30);
        this.y += 2;
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(12);
        this.doc.setTextColor(...options.color || ORANGE);
        const numberedTitle = this.sectionNumber ? `${this.sectionNumber}.${++this.subsectionNumber}  ${title}` : title;
        const lines = this.doc.splitTextToSize(numberedTitle, this.contentWidth);
        for (const line of lines){
            if (this.y + 6 > this.bottomLimit()) this.newPage(this.sectionTitle, this.landscape);
            this.doc.text(line, this.margin, this.y);
            this.y += 6;
        }
        this.doc.setDrawColor(...PEACH);
        this.doc.setLineWidth(0.55);
        this.doc.line(this.margin, this.y - 2, this.pageWidth - this.margin, this.y - 2);
        this.doc.setLineWidth(0.2);
        this.y += 3;
        this.doc.setTextColor(...TEXT);
    }
    paragraph(value, options = {}) {
        const raw = asText(value);
        if (!raw.trim()) return;
        const fontSize = Math.max(options.fontSize ?? BODY_FONT, 9.5);
        const lineHeight = options.lineHeight ?? BODY_LINE;
        const x = options.x ?? this.margin;
        const width = options.width ?? this.contentWidth;
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(fontSize);
        this.doc.setTextColor(...options.color || TEXT);
        const paragraphs = raw.replace(/\r\n/g, "\n").split("\n");
        for (const paragraph of paragraphs){
            if (!paragraph.trim()) {
                this.y += lineHeight * 0.55;
                continue;
            }
            const lines = this.doc.splitTextToSize(paragraph, width);
            for (const line of lines){
                if (this.y + lineHeight > this.bottomLimit()) {
                    this.newPage(this.sectionTitle, this.landscape);
                    this.doc.setFont("helvetica", "normal");
                    this.doc.setFontSize(fontSize);
                    this.doc.setTextColor(...options.color || TEXT);
                }
                this.doc.text(line, x, this.y);
                this.y += lineHeight;
            }
        }
        this.doc.setTextColor(...TEXT);
        this.y += options.gapAfter ?? 2.5;
    }
    labelParagraph(label, body, options = {}) {
        const rawBody = asText(body);
        const labelFontSize = 10;
        const metaFontSize = 9;
        const labelLineHeight = 4.8;
        const metaLineHeight = 4.3;
        const bodyLineHeight = 5;
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(labelFontSize);
        const labelLines = this.doc.splitTextToSize(label, this.contentWidth);
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(metaFontSize);
        const metaLines = options.meta ? this.doc.splitTextToSize(options.meta, this.contentWidth) : [];
        this.doc.setFontSize(BODY_FONT);
        const bodyLines = rawBody.replace(/\r\n/g, "\n").split("\n").reduce((lines, line)=>{
            if (!line.trim()) {
                lines.push("");
                return lines;
            }
            return lines.concat(this.doc.splitTextToSize(line, this.contentWidth));
        }, []);
        const gapAfter = options.gapAfter ?? 3;
        const blockHeight = labelLines.length * labelLineHeight + (metaLines.length ? 1 + metaLines.length * metaLineHeight : 0) + 1.5 + bodyLines.length * bodyLineHeight + gapAfter;
        const fullPageHeight = this.bottomLimit() - (HEADER_HEIGHT + 10);
        this.ensureSpace(blockHeight <= fullPageHeight ? blockHeight : 24);
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(labelFontSize);
        this.doc.setTextColor(...ORANGE);
        for (const line of labelLines){
            if (this.y + labelLineHeight > this.bottomLimit()) this.newPage(this.sectionTitle, this.landscape);
            this.doc.text(line, this.margin, this.y);
            this.y += labelLineHeight;
        }
        if (metaLines.length) {
            this.y += 1;
            this.doc.setFont("helvetica", "normal");
            this.doc.setFontSize(metaFontSize);
            this.doc.setTextColor(...MUTED);
            for (const line of metaLines){
                if (this.y + metaLineHeight > this.bottomLimit()) this.newPage(this.sectionTitle, this.landscape);
                this.doc.text(line, this.margin, this.y);
                this.y += metaLineHeight;
            }
        }
        this.doc.setTextColor(...TEXT);
        this.y += 1.5;
        this.paragraph(rawBody, {
            fontSize: BODY_FONT,
            lineHeight: bodyLineHeight,
            gapAfter
        });
    }
    metaRow(label, value, options = {}) {
        const labelWidth = 48;
        const valueWidth = this.contentWidth - labelWidth;
        const valueText = asText(value) || "Not recorded";
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(10);
        const lines = this.doc.splitTextToSize(valueText, valueWidth);
        const rowLineHeight = 4.7;
        const height = Math.max(6.2, lines.length * rowLineHeight + 1.8);
        this.ensureSpace(height);
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(9.5);
        this.doc.setTextColor(...MUTED);
        this.doc.text(label, this.margin, this.y);
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(9.5);
        this.doc.setTextColor(...options.valueColor || TEXT);
        for(let index = 0; index < lines.length; index += 1){
            this.doc.text(lines[index], this.margin + labelWidth, this.y + index * rowLineHeight);
        }
        this.y += height;
    }
    metadataGroup(title, rows, options = {}) {
        this.subheading(title);
        for (const [label, value] of rows){
            this.metaRow(label, value, {
                valueColor: options.valueColors?.[label]
            });
        }
        this.y += 2;
    }
    bullets(items, options = {}) {
        const fontSize = Math.max(options.fontSize ?? BODY_FONT, 9.5);
        const lineHeight = fontSize * 0.5;
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(fontSize);
        this.doc.setTextColor(...TEXT);
        this.doc.setFillColor(...TEXT);
        for (const item of items){
            const lines = this.doc.splitTextToSize(asText(item), this.contentWidth - 5);
            this.ensureSpace(Math.max(5, lines.length * lineHeight));
            this.doc.circle(this.margin + 1, this.y - 1.2, 0.65, "F");
            for (const line of lines){
                if (this.y + lineHeight > this.bottomLimit()) {
                    this.newPage(this.sectionTitle, this.landscape);
                    this.doc.setFont("helvetica", "normal");
                    this.doc.setFontSize(fontSize);
                    this.doc.setTextColor(...TEXT);
                }
                this.doc.text(line, this.margin + 5, this.y);
                this.y += lineHeight;
            }
            this.y += 2.2;
        }
        this.y += 1;
    }
    numberedList(items) {
        const fontSize = BODY_FONT;
        const lineHeight = BODY_LINE;
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(fontSize);
        this.doc.setTextColor(...TEXT);
        items.forEach((item, index)=>{
            const number = `${index + 1}.`;
            const lines = this.doc.splitTextToSize(asText(item), this.contentWidth - 8);
            this.ensureSpace(Math.max(lineHeight, lines.length * lineHeight));
            this.doc.setFont("helvetica", "bold");
            this.doc.text(number, this.margin, this.y);
            this.doc.setFont("helvetica", "normal");
            lines.forEach((line)=>{
                if (this.y + lineHeight > this.bottomLimit()) {
                    this.newPage(this.sectionTitle, this.landscape);
                    this.doc.setFont("helvetica", "normal");
                    this.doc.setFontSize(fontSize);
                    this.doc.setTextColor(...TEXT);
                }
                this.doc.text(line, this.margin + 8, this.y);
                this.y += lineHeight;
            });
            this.y += 2;
        });
        this.y += 1;
    }
    divider() {
        this.ensureSpace(5);
        this.doc.setDrawColor(...BORDER);
        this.doc.setLineWidth(0.35);
        this.doc.line(this.margin, this.y, this.pageWidth - this.margin, this.y);
        this.doc.setLineWidth(0.2);
        this.y += 7;
    }
    callout(value, tone = "info") {
        const raw = asText(value);
        if (!raw.trim()) return;
        const inset = 4;
        const verticalPadding = 3;
        const fontSize = BODY_FONT;
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(fontSize);
        const lines = this.doc.splitTextToSize(raw, this.contentWidth - inset * 2);
        const textHeight = fontSize * 25.4 / 72;
        this.ensureSpace((lines.length - 1) * BODY_LINE + verticalPadding + 3);
        const boxTop = this.y - textHeight - verticalPadding;
        const height = textHeight + (lines.length - 1) * BODY_LINE + verticalPadding * 2;
        const colors = CALLOUT_COLORS[tone];
        this.doc.setFillColor(...colors.fill);
        this.doc.setDrawColor(...colors.border);
        this.doc.setLineWidth(0.35);
        this.doc.roundedRect(this.margin, boxTop, this.contentWidth, height, 1.5, 1.5, "FD");
        const accent = tone === "info" ? ORANGE : colors.border;
        this.doc.setFillColor(...accent);
        this.doc.rect(this.margin, boxTop, 1.2, height, "F");
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(fontSize);
        this.doc.setTextColor(...TEXT);
        lines.forEach((line, index)=>{
            this.doc.text(line, this.margin + inset, this.y + index * BODY_LINE);
        });
        this.y = boxTop + height + 3;
    }
    beginCard() {
        if (this.activeCard) this.endCard();
        this.ensureSpace(36);
        this.activeCard = {
            page: this.currentPage,
            top: this.y - CARD_VERTICAL_PADDING,
            x: this.margin - CARD_HORIZONTAL_PADDING,
            width: this.contentWidth + CARD_HORIZONTAL_PADDING * 2
        };
    }
    endCard() {
        if (!this.activeCard) return;
        this.cardSegments.push({
            page: this.activeCard.page,
            top: this.activeCard.top,
            bottom: Math.min(this.pageHeight - FOOTER_HEIGHT - 3, this.y + CARD_VERTICAL_PADDING),
            x: this.activeCard.x,
            width: this.activeCard.width
        });
        this.activeCard = null;
        this.y += CARD_VERTICAL_PADDING + 3;
    }
    table(columns, rows, options = {}) {
        if (!columns.length) return;
        const naturalWidth = columns.reduce((sum, column)=>sum + column.width, 0);
        const scale = this.contentWidth / naturalWidth;
        const widths = columns.map((column)=>column.width * scale);
        const fontSize = Math.max(options.fontSize ?? 9.5, 9.5);
        const headerFontSize = options.headerFontSize ?? 10;
        const lineHeight = Math.max(4.5, fontSize * 0.48);
        const headerLineHeight = Math.max(4.6, headerFontSize * 0.46);
        const headerFill = options.headerFill || ORANGE;
        const cellInset = 1.8;
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(fontSize);
        const splitCells = (row)=>columns.map((column, index)=>this.doc.splitTextToSize(asText(row[column.key]) || "", Math.max(4, widths[index] - cellInset * 2)));
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(headerFontSize);
        const headerLines = columns.map((column, index)=>this.doc.splitTextToSize(column.header, Math.max(4, widths[index] - cellInset * 2)));
        const headerHeight = Math.max(...headerLines.map((lines)=>lines.length)) * headerLineHeight + 4;
        const drawHeader = ()=>{
            this.ensureSpace(headerHeight + 2);
            const y = this.y;
            this.doc.setFillColor(...headerFill);
            this.doc.rect(this.margin, y, this.contentWidth, headerHeight, "F");
            this.doc.setDrawColor(...BORDER);
            this.doc.setLineWidth(0.2);
            this.doc.rect(this.margin, y, this.contentWidth, headerHeight);
            this.doc.setFont("helvetica", "bold");
            this.doc.setFontSize(headerFontSize);
            this.doc.setTextColor(...WHITE);
            let x = this.margin;
            headerLines.forEach((lines, index)=>{
                lines.forEach((line, lineIndex)=>{
                    this.doc.text(line, x + cellInset, y + 3 + lineIndex * headerLineHeight);
                });
                x += widths[index];
            });
            this.doc.setTextColor(...TEXT);
            this.y = y + headerHeight;
        };
        drawHeader();
        for(let rowIndex = 0; rowIndex < rows.length; rowIndex += 1){
            const row = rows[rowIndex];
            const cells = splitCells(row);
            const rowHeight = Math.max(...cells.map((lines)=>lines.length)) * lineHeight + 4.5;
            if (this.y + rowHeight > this.bottomLimit()) {
                this.newPage(this.sectionTitle, this.landscape);
                drawHeader();
            }
            const y = this.y;
            const rowFill = rowIndex % 2 === 0 ? WHITE : ROW_ALT;
            this.doc.setFillColor(...rowFill);
            this.doc.rect(this.margin, y, this.contentWidth, rowHeight, "F");
            this.doc.setDrawColor(...BORDER);
            this.doc.rect(this.margin, y, this.contentWidth, rowHeight);
            let x = this.margin;
            cells.forEach((lines, index)=>{
                const column = columns[index];
                this.doc.setFont("helvetica", "normal");
                this.doc.setFontSize(fontSize);
                this.doc.setTextColor(...TEXT);
                this.doc.line(x, y, x, y + rowHeight);
                const align = column.align || "left";
                lines.forEach((line, lineIndex)=>{
                    const textX = align === "right" ? x + widths[index] - cellInset : align === "center" ? x + widths[index] / 2 : x + cellInset;
                    this.doc.text(line, textX, y + 3 + lineIndex * lineHeight, {
                        align
                    });
                });
                x += widths[index];
            });
            this.y = y + rowHeight;
        }
        this.y += 3;
    }
    cover(options) {
        const width = this.pageWidth;
        this.hasCover = true;
        this.doc.setFillColor(...WHITE);
        this.doc.rect(0, 0, width, this.pageHeight, "F");
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(8.5);
        this.doc.setTextColor(...ORANGE);
        this.doc.text("RAVEN", width - this.margin, 9, {
            align: "right"
        });
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(...MUTED);
        this.doc.text("Regulatory Validation Workspace", width - this.margin, 14, {
            align: "right"
        });
        const panelWidth = width * 0.75;
        const panelTop = 25;
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(11);
        const requirementLines = this.doc.splitTextToSize(options.requirementKeys.join(", "), panelWidth - this.margin * 2 - 8);
        const subtitleLines = this.doc.splitTextToSize(options.subtitle, panelWidth - this.margin * 2 - 8);
        const requirementTop = panelTop + 42;
        const requirementLineHeight = 5.5;
        const subtitleTop = requirementTop + requirementLines.length * requirementLineHeight + 4;
        const dividerY = subtitleTop + subtitleLines.length * 5 + 4;
        const contents = options.contents || [];
        const contentLineHeight = 8;
        const panelHeight = Math.max(90, dividerY - panelTop + 13 + Math.max(0, contents.length - 1) * contentLineHeight + 8);
        this.doc.setFillColor(...ORANGE);
        this.doc.rect(0, panelTop, panelWidth, panelHeight, "F");
        this.doc.setFillColor(...PEACH);
        this.doc.triangle(panelWidth, panelTop + panelHeight, panelWidth - 24, panelTop + panelHeight, panelWidth, panelTop + panelHeight - 24, "F");
        this.doc.setTextColor(...TEXT);
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(24);
        this.doc.text("Requirement No.", this.margin + 4, panelTop + 29);
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(11);
        this.doc.setTextColor(...TEXT);
        requirementLines.forEach((line, index)=>{
            this.doc.text(line, this.margin + 4, requirementTop + index * requirementLineHeight);
        });
        subtitleLines.forEach((line, index)=>{
            this.doc.text(line, this.margin + 4, subtitleTop + index * 5);
        });
        this.doc.setDrawColor(...ORANGE);
        this.doc.setLineWidth(0.5);
        this.doc.line(this.margin + 4, dividerY, panelWidth - this.margin - 4, dividerY);
        this.doc.setFontSize(9);
        contents.forEach((item, index)=>{
            this.doc.text(item, this.margin + 5, dividerY + 13 + index * contentLineHeight);
        });
        this.doc.setTextColor(...TEXT);
        const cardTop = panelTop + panelHeight + 10;
        const rows = [
            [
                "Project Name",
                "LIMS"
            ],
            [
                "Requirements Included",
                String(options.requirementCount)
            ],
            [
                "Version Selection",
                options.versionPolicy
            ],
            [
                "Generated Date",
                options.generatedAt
            ],
            [
                "Pack Reference",
                options.packReference
            ],
            [
                "Scope",
                options.scope
            ]
        ];
        const controlFontSize = 11;
        const rowLineHeight = 5.5;
        const valueWidth = this.contentWidth - 82;
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(controlFontSize);
        const rowData = rows.map(([label, value])=>({
                label,
                valueLines: this.doc.splitTextToSize(value, valueWidth)
            }));
        const rowHeights = rowData.map(({ valueLines })=>Math.max(rowLineHeight, valueLines.length * rowLineHeight) + 2);
        const cardHeight = 21 + rowHeights.reduce((total, rowHeight)=>total + rowHeight, 0) + 4;
        this.doc.setFillColor(...PEACH);
        this.doc.setDrawColor(...BORDER);
        this.doc.setLineWidth(0.35);
        this.doc.roundedRect(this.margin, cardTop, this.contentWidth, cardHeight, 1.8, 1.8, "FD");
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(11);
        this.doc.setTextColor(...ORANGE);
        this.doc.text("DOCUMENT CONTROL", this.margin + 7, cardTop + 10);
        let rowY = cardTop + 21;
        rowData.forEach(({ label, valueLines }, index)=>{
            this.doc.setFont("helvetica", "bold");
            this.doc.setFontSize(controlFontSize);
            this.doc.setTextColor(...MUTED);
            this.doc.text(label, this.margin + 8, rowY);
            this.doc.setFont("helvetica", "normal");
            this.doc.setFontSize(controlFontSize);
            this.doc.setTextColor(...TEXT);
            this.doc.text(":", this.margin + 64, rowY);
            valueLines.forEach((line, lineIndex)=>{
                this.doc.text(line, this.margin + 70, rowY + lineIndex * rowLineHeight);
            });
            rowY += rowHeights[index];
        });
        this.y = this.pageHeight - FOOTER_HEIGHT;
    }
    addToc(entries) {
        this.startSection("Table of Contents", {
            newPage: true,
            landscape: false
        });
        const result = [];
        const tableTop = this.y;
        const numberWidth = 18;
        const pageColumnWidth = 24;
        const sectionWidth = this.contentWidth - numberWidth - pageColumnWidth;
        const headerHeight = 10;
        const rowHeight = 9;
        this.doc.setFillColor(...ORANGE);
        this.doc.rect(this.margin, tableTop, this.contentWidth, headerHeight, "F");
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(8);
        this.doc.setTextColor(...WHITE);
        this.doc.text("No.", this.margin + 2, tableTop + 6.5);
        this.doc.text("Section", this.margin + numberWidth + 2, tableTop + 6.5);
        this.doc.text("Page", this.margin + numberWidth + sectionWidth + 2, tableTop + 6.5);
        this.y = tableTop + headerHeight;
        entries.forEach((title, index)=>{
            const rowTop = this.y;
            this.doc.setFillColor(...index % 2 === 0 ? WHITE : ROW_ALT);
            this.doc.rect(this.margin, rowTop, this.contentWidth, rowHeight, "F");
            this.doc.setDrawColor(...BORDER);
            this.doc.setLineWidth(0.2);
            this.doc.rect(this.margin, rowTop, this.contentWidth, rowHeight);
            this.doc.line(this.margin + numberWidth, rowTop, this.margin + numberWidth, rowTop + rowHeight);
            this.doc.line(this.margin + numberWidth + sectionWidth, rowTop, this.margin + numberWidth + sectionWidth, rowTop + rowHeight);
            const page = this.sectionPages.get(title) || 0;
            this.doc.setFont("helvetica", "normal");
            this.doc.setFontSize(8);
            this.doc.setTextColor(...TEXT);
            this.doc.text(String(index + 1), this.margin + 2, rowTop + 5.8);
            this.doc.text(title, this.margin + numberWidth + 2, rowTop + 5.8);
            // Section pages are not known until the body has been rendered. Leave the
            // value blank here; fillToc writes the real page after all sections exist.
            result.push({
                title,
                page,
                tocPage: this.currentPage,
                y: rowTop,
                pageX: this.margin + numberWidth + sectionWidth,
                pageColumnWidth
            });
            this.y = rowTop + rowHeight;
        });
        this.y += 3;
        return result;
    }
    fillToc(entries) {
        for (const entry of entries){
            const page = this.sectionPages.get(entry.title) || entry.page;
            if (!page) continue;
            this.doc.setPage(entry.tocPage);
            this.doc.setFont("helvetica", "normal");
            this.doc.setFontSize(8);
            this.doc.setTextColor(...TEXT);
            this.doc.text(String(page), entry.pageX + entry.pageColumnWidth - 2, entry.y + 5.8, {
                align: "right"
            });
        }
    }
    finalize() {
        if (this.finalized) return this.doc.output("blob");
        this.finalized = true;
        if (this.activeCard) this.endCard();
        const total = this.doc.getNumberOfPages();
        for (const segment of this.cardSegments){
            if (segment.bottom <= segment.top) continue;
            this.doc.setPage(segment.page);
            this.doc.setDrawColor(...BORDER);
            this.doc.setLineWidth(0.35);
            this.doc.roundedRect(segment.x, segment.top, segment.width, segment.bottom - segment.top, 1.2, 1.2, "S");
        }
        for(let page = 1; page <= total; page += 1){
            this.doc.setPage(page);
            const width = this.pageWidth;
            const height = this.pageHeight;
            this.doc.setDrawColor(...BORDER);
            this.doc.setLineWidth(0.35);
            if (!(page === 1 && this.hasCover)) {
                this.doc.line(this.margin, height - FOOTER_HEIGHT, width - this.margin, height - FOOTER_HEIGHT);
            }
            this.doc.setFont("helvetica", "normal");
            this.doc.setFontSize(8);
            this.doc.setTextColor(...MUTED);
            if (page === 1 && this.hasCover) {
                this.doc.text("LIMS  |  VALIDATION PACK", width - this.margin, height - 6.5, {
                    align: "right"
                });
            } else {
                this.doc.text("RAVEN — Validation Pack", this.margin, height - 6.5);
                this.doc.text(`Generated ${this.generatedAt}`, width / 2, height - 6.5, {
                    align: "center"
                });
                this.doc.text(`Page ${page} of ${total}`, width - this.margin, height - 6.5, {
                    align: "right"
                });
            }
        }
        return this.doc.output("blob");
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/pdf-sections.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SECTION_TITLES",
    ()=>SECTION_TITLES,
    "renderAssuranceSection",
    ()=>renderAssuranceSection,
    "renderConsolidatedPack",
    ()=>renderConsolidatedPack,
    "renderEvidenceIndexSection",
    ()=>renderEvidenceIndexSection,
    "renderGapReportSection",
    ()=>renderGapReportSection,
    "renderLimitationsSection",
    ()=>renderLimitationsSection,
    "renderRiskAssessmentSection",
    ()=>renderRiskAssessmentSection,
    "renderTestScriptsSection",
    ()=>renderTestScriptsSection,
    "renderTraceabilitySection",
    ()=>renderTraceabilitySection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html2canvas$2f$dist$2f$html2canvas$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/html2canvas/dist/html2canvas.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/traceability-graph-visuals.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validation-pack.ts [app-client] (ecmascript)");
;
;
;
const SECTION_TITLES = {
    risk: "Risk Assessment",
    assurance: "Assurance Rationale",
    tests: "Test Scripts",
    traceability: "Traceability Matrix",
    gaps: "Gap Report",
    appendices: "Appendices",
    evidence: "Evidence Index",
    limitations: "Limitations and Methodology"
};
function orderedRequirements(data) {
    return [
        ...data.requirements
    ].sort((a, b)=>(a.display_key || a.req_key || a.id).localeCompare(b.display_key || b.req_key || b.id, "en"));
}
function requirementSummary(builder, requirement) {
    builder.subheading(`${requirement.display_key || requirement.req_key || "Requirement"} — Requirement`);
    builder.paragraph(requirement.title || requirement.requirement_title || "Untitled requirement", {
        fontSize: 9.8,
        gapAfter: 1.2
    });
    builder.metaRow("Requirement version", requirement.version ? `Version ${requirement.version}` : "Not recorded");
}
function renderEvidenceGroup(builder, evidence, group) {
    const fields = group.fields.map(([key, label])=>({
            key,
            label,
            field: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEvidenceField"])(evidence, key)
        })).filter((entry)=>entry.field !== null);
    if (!fields.length) return false;
    builder.subheading(group.title);
    for (const entry of fields){
        const field = entry.field;
        if (!field) continue;
        builder.labelParagraph(`${entry.label} — ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatValue"])(field.value)}`, field.evidence || "No supporting sentence was stored for this field.", {
            meta: `Confidence: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatConfidence"])(field.confidence)}`
        });
    }
    return true;
}
function renderEvidenceNarrative(builder, evidence, refs, relatedRisks) {
    builder.subheading("Supporting evidence");
    builder.metaRow("Evidence record", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["evidenceReference"])(refs, evidence.id));
    builder.metaRow("Recorded", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateTime"])(evidence.created_at));
    if (relatedRisks.length) {
        builder.metaRow("Related risk assessment", relatedRisks.join(", "));
    } else {
        builder.metaRow("Related risk assessment", "No risk assessment is linked to this evidence record");
    }
    let rendered = false;
    for (const group of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EVIDENCE_GROUPS"]){
        rendered = renderEvidenceGroup(builder, evidence, group) || rendered;
    }
    if (!rendered) {
        builder.paragraph("The linked evidence record has no readable field values. No evidence sentence is substituted.");
    }
}
function renderDerivedClassifications(builder, risk, evidence) {
    builder.subheading("Derived classifications");
    builder.labelParagraph(`GxP impact — ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatValue"])(risk.gxp_impact)}`, risk.gxp_reason || "No GxP rationale was stored.");
    builder.labelParagraph(`GAMP category — ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatValue"])(risk.gamp_category)}`, risk.gamp_reason || "No GAMP rationale was stored.");
    const gxpField = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEvidenceField"])(evidence, "gxp_impact");
    const gampField = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEvidenceField"])(evidence, "gamp_category");
    if (gxpField?.evidence && gxpField.evidence !== risk.gxp_reason) {
        builder.labelParagraph("GxP derivation evidence", gxpField.evidence, {
            meta: `Confidence: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatConfidence"])(gxpField.confidence)}`
        });
    }
    if (gampField?.evidence && gampField.evidence !== risk.gamp_reason) {
        builder.labelParagraph("GAMP derivation evidence", gampField.evidence, {
            meta: `Confidence: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatConfidence"])(gampField.confidence)}`
        });
    }
}
function renderFactorTrace(builder, label, score, trace) {
    builder.subheading(`${label} — ${score ?? "Not recorded"}`);
    builder.metaRow("Scoring rule", `${trace?.rule_id || "Not recorded"} · Version ${trace?.rule_version || "Not recorded"}`);
    const steps = Array.isArray(trace?.decision_path) ? trace.decision_path.filter((step)=>step !== null && typeof step === "object" && !Array.isArray(step)) : [];
    const inputSteps = steps.filter((step)=>typeof step.check === "string" && step.check !== "computation");
    const calculation = steps.find((step)=>step.check === "computation");
    const inputRows = inputSteps.map((step)=>({
            input: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["humanizeKey"])(step.check),
            result: typeof step.result === "boolean" ? step.result ? "Yes" : "No" : step.result ?? "—",
            points: step.points ?? "—",
            weight: step.weight ?? "—",
            evidence: step.evidence || "—"
        }));
    const calculationLabels = {
        sum: "Input total",
        mapped: "Mapped score",
        mapped_score: "Mapped score",
        gamp_category: "GAMP category",
        gamp_modifier: "GAMP modifier",
        controls_floor: "Controls floor",
        floor_applied: "Controls floor applied",
        final_score: "Final score",
        outcome: "Outcome"
    };
    const calculationRows = calculation ? Object.entries(calculation).filter(([key, value])=>key !== "check" && value !== null && value !== undefined).map(([key, value])=>({
            step: calculationLabels[key] || (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["humanizeKey"])(key),
            value: typeof value === "boolean" ? value ? "Yes" : "No" : value
        })) : [];
    const rationale = trace?.reasoning?.replace(/\s+Supporting evidence:[\s\S]*$/, "");
    builder.labelParagraph("Scoring rationale", rationale || "No scoring rationale was stored for this factor.", {
        gapAfter: 2
    });
    if (inputRows.length) {
        builder.table([
            {
                header: "Input",
                key: "input",
                width: 25
            },
            {
                header: "Result",
                key: "result",
                width: 15
            },
            {
                header: "Points",
                key: "points",
                width: 10,
                align: "center"
            },
            {
                header: "Weight",
                key: "weight",
                width: 10,
                align: "center"
            },
            {
                header: "Supporting evidence",
                key: "evidence",
                width: 90
            }
        ], inputRows, {
            fontSize: 8.8,
            headerFontSize: 9
        });
    }
    if (calculationRows.length) {
        builder.table([
            {
                header: "Calculation",
                key: "step",
                width: 35
            },
            {
                header: "Value",
                key: "value",
                width: 25
            }
        ], calculationRows, {
            fontSize: 8.8,
            headerFontSize: 9
        });
    }
}
function riskBandColor(value) {
    switch(value.toLowerCase()){
        case "low":
            return [
                241,
                108,
                48
            ];
        case "medium":
            return [
                204,
                81,
                35
            ];
        case "high":
            return [
                157,
                57,
                23
            ];
        case "critical":
            return [
                17,
                17,
                17
            ];
        default:
            return undefined;
    }
}
function renderRiskRecord(builder, requirement, risk, refs) {
    const key = requirement.display_key || requirement.req_key || "Requirement";
    const riskRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["riskReference"])(refs, risk.id);
    const evidence = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["evidenceRecordForRisk"])(requirement, risk);
    builder.subheading(`Risk Assessment — ${key}, Version ${requirement.version ?? "Not recorded"}`);
    builder.metaRow("Report reference", riskRef);
    builder.metaRow("Freshness", risk.freshness || "Not recorded");
    builder.metaRow("Current assessment", risk.is_current ? "Yes" : "No");
    builder.metaRow("Created", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateTime"])(risk.created_at));
    builder.metaRow("Last updated", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateTime"])(risk.updated_at));
    builder.metaRow("GxP impact", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatValue"])(risk.gxp_impact));
    builder.metaRow("GAMP category", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatValue"])(risk.gamp_category));
    builder.subheading("Risk score");
    builder.table([
        {
            header: "Factor",
            key: "factor",
            width: 30
        },
        {
            header: "Score",
            key: "score",
            width: 15,
            align: "center"
        },
        {
            header: "Rule",
            key: "rule",
            width: 35
        },
        {
            header: "Rule version",
            key: "rule_version",
            width: 25
        }
    ], [
        [
            "Severity",
            risk.severity,
            risk.severity_result
        ],
        [
            "Probability",
            risk.probability,
            risk.probability_result
        ],
        [
            "Detectability",
            risk.detectability,
            risk.detectability_result
        ]
    ].map(([factor, score, trace])=>({
            factor,
            score: score ?? "Not recorded",
            rule: trace?.rule_id || "Not recorded",
            rule_version: trace?.rule_version || "Not recorded"
        })), {
        fontSize: 8.6
    });
    const riskBand = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["riskBandLabel"])(risk.band);
    builder.metadataGroup("Derived classification", [
        [
            "RPN points",
            risk.rpn_points ?? "Not recorded"
        ],
        [
            "Normalized RPN",
            risk.rpn ?? "Not recorded"
        ],
        [
            "Risk band",
            riskBand
        ],
        [
            "Configuration version",
            risk.configuration_version ?? "Not recorded"
        ]
    ], {
        valueColors: {
            "Risk band": riskBandColor(riskBand)
        }
    });
    builder.subheading("Scoring rule trace");
    renderFactorTrace(builder, "Severity", risk.severity, risk.severity_result);
    renderFactorTrace(builder, "Probability", risk.probability, risk.probability_result);
    renderFactorTrace(builder, "Detectability", risk.detectability, risk.detectability_result);
    renderDerivedClassifications(builder, risk, evidence);
    if (evidence) {
        renderEvidenceNarrative(builder, evidence, refs, risk.evidence_id ? [
            riskRef
        ] : []);
    } else {
        builder.subheading("Supporting evidence");
        builder.paragraph("No supporting evidence record is linked to this risk assessment. No evidence is substituted.");
    }
}
function renderRiskAssessmentSection(builder, data, refs) {
    builder.startSection(SECTION_TITLES.risk, {
        newPage: true,
        landscape: false
    });
    builder.callout("Each assessment below is scoped to the selected current requirement version. Scores, classifications, and rationales are reproduced from the stored record.");
    orderedRequirements(data).forEach((requirement)=>{
        requirementSummary(builder, requirement);
        if (!requirement.risks.length) {
            builder.paragraph("No risk assessment is stored for the current requirement version. This is an absence of a record; no risk score is inferred.");
            return;
        }
        const sorted = [
            ...requirement.risks
        ].sort((a, b)=>(a.created_at || "").localeCompare(b.created_at || "", "en"));
        sorted.forEach((risk)=>{
            builder.divider();
            builder.beginCard();
            renderRiskRecord(builder, requirement, risk, refs);
            builder.endCard();
        });
    });
}
function renderAssuranceRecord(builder, requirement, assurance, refs) {
    const key = requirement.display_key || requirement.req_key || "Requirement";
    const assuranceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assuranceReference"])(refs, assurance.id);
    const risk = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["relatedRiskForAssurance"])(requirement, assurance);
    const riskRef = risk ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["riskReference"])(refs, risk.id) : "Not linked";
    builder.subheading(`Assurance Decision — ${key}, Version ${requirement.version ?? "Not recorded"}`);
    builder.metaRow("Report reference", assuranceRef);
    builder.metaRow("Assurance level", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assuranceLevelLabel"])(assurance.assurance_level));
    builder.metaRow("Test generation requested", assurance.generate_test ? "Yes" : "No");
    builder.metaRow("Freshness", assurance.freshness || "Not recorded");
    builder.metaRow("Recorded", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateTime"])(assurance.created_at));
    builder.metaRow("Related risk assessment", riskRef);
    if (risk) {
        const riskBand = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["riskBandLabel"])(risk.band);
        builder.metaRow("Risk band", riskBand, {
            valueColor: riskBandColor(riskBand)
        });
        builder.metaRow("Severity score", risk.severity ?? "Not recorded");
    }
    builder.subheading("Decision inputs");
    const inputLines = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["humanizeDecisionPath"])(assurance.decision_path);
    if (inputLines.length && inputLines[0] !== "Not recorded") {
        builder.bullets(inputLines);
    } else {
        builder.paragraph("No decision inputs were stored for this assurance decision.");
    }
    builder.subheading("Decision rule");
    builder.metaRow("Rule", assurance.rule_id || "Not recorded");
    builder.metaRow("Rule version", assurance.rule_version || "Not recorded");
    builder.labelParagraph("Rule explanation", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["describeAssuranceRule"])(assurance.rule_id));
    builder.labelParagraph("Stored rationale", assurance.reasoning || "No assurance rationale was stored.");
    builder.subheading("Related test scripts");
    const tests = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["testsForAssurance"])(requirement, assurance);
    if (!tests.length) {
        builder.paragraph(assurance.generate_test ? "The assurance decision requests test generation, but no test script is linked to this decision." : "This assurance decision does not request test generation, and no test script is linked to it.");
    } else {
        for (const test of tests){
            builder.labelParagraph(`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["testReference"])(refs, test.id)} — ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["testDisplayTitle"])(test, (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["testReference"])(refs, test.id))}`, `Freshness: ${test.freshness || "Not recorded"}`);
        }
    }
}
function renderAssuranceSection(builder, data, refs) {
    builder.startSection(SECTION_TITLES.assurance, {
        newPage: true,
        landscape: false
    });
    builder.callout("The assurance level and rule below are stored decisions. The explanation is derived from the current deterministic assurance implementation; it does not replace the stored rationale.");
    orderedRequirements(data).forEach((requirement)=>{
        requirementSummary(builder, requirement);
        if (!requirement.assurance.length) {
            builder.paragraph("No assurance decision is stored for the current requirement version. No assurance level is inferred.");
            return;
        }
        const sorted = [
            ...requirement.assurance
        ].sort((a, b)=>(a.created_at || "").localeCompare(b.created_at || "", "en"));
        sorted.forEach((assurance)=>{
            builder.beginCard();
            renderAssuranceRecord(builder, requirement, assurance, refs);
            builder.endCard();
        });
    });
}
function renderTestRecord(builder, requirement, test, refs) {
    const key = requirement.display_key || requirement.req_key || "Requirement";
    const testRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["testReference"])(refs, test.id);
    const assurance = requirement.assurance.find((item)=>item.id === test.assurance_decision_id);
    const risk = assurance ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["relatedRiskForAssurance"])(requirement, assurance) : null;
    builder.subheading(`Test Script — ${key}, Version ${requirement.version ?? "Not recorded"}`);
    builder.metaRow("Report reference", testRef);
    builder.metaRow("Title", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["testDisplayTitle"])(test, testRef));
    builder.metaRow("External code", test.external_code || "Not recorded");
    builder.metaRow("Freshness", test.freshness || "Not recorded");
    builder.metaRow("Script revision", test.version ?? "Not recorded");
    builder.metaRow("Origin", test.origin || "Not recorded");
    builder.metaRow("Recorded", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateTime"])(test.created_at));
    builder.metaRow("Related assurance decision", assurance ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assuranceReference"])(refs, assurance.id) : "Not linked");
    builder.metaRow("Related risk assessment", risk ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["riskReference"])(refs, risk.id) : "Not linked");
    builder.metaRow("Prompt provenance", test.prompt_version ? `${test.prompt_version.agent_name} · version ${test.prompt_version.version}` : "Not recorded");
    builder.callout("Execution results are not recorded in the export dataset; no pass or fail result is implied.", "warning");
    const parsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseTestScript"])(test.script);
    if (!parsed.parsed) {
        builder.subheading("Stored test script");
        builder.paragraph(test.script || "No script text was stored.");
        return;
    }
    builder.subheading("Preconditions");
    const preconditions = parsed.preconditions.split(/\r?\n/).map((line)=>line.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean);
    if (preconditions.length) {
        builder.bullets(preconditions);
    } else {
        builder.paragraph("No preconditions were stored.");
    }
    builder.subheading("Test steps");
    if (!parsed.steps.length) {
        builder.paragraph("No numbered test steps could be parsed. The stored script is shown below.");
        builder.paragraph(parsed.raw);
        return;
    }
    builder.numberedList(parsed.steps.map((step)=>step.action || "No action text was stored."));
}
function renderTestScriptsSection(builder, data, refs) {
    builder.startSection(SECTION_TITLES.tests, {
        newPage: true,
        landscape: false
    });
    builder.paragraph("Test scripts are reproduced from the stored script text. Execution results are not stored by RAVEN.", {
        color: [
            82,
            82,
            82
        ],
        fontSize: 8.6
    });
    orderedRequirements(data).forEach((requirement)=>{
        requirementSummary(builder, requirement);
        if (!requirement.tests.length) {
            builder.paragraph("No test script is stored for the current requirement version. This is an absence of a record; no test result is inferred.");
            return;
        }
        const sorted = [
            ...requirement.tests
        ].sort((a, b)=>(a.created_at || "").localeCompare(b.created_at || "", "en"));
        sorted.forEach((test)=>{
            builder.divider();
            builder.beginCard();
            renderTestRecord(builder, requirement, test, refs);
            builder.endCard();
        });
    });
}
const TRACE_RISK_COLUMNS = [
    {
        header: "Requirement",
        key: "requirement_id",
        width: 19
    },
    {
        header: "Version",
        key: "requirement_version",
        width: 9
    },
    {
        header: "Risk reference",
        key: "risk_id",
        width: 27
    },
    {
        header: "Severity",
        key: "severity",
        width: 8,
        align: "center"
    },
    {
        header: "Probability",
        key: "probability",
        width: 9,
        align: "center"
    },
    {
        header: "Detectability",
        key: "detectability",
        width: 9,
        align: "center"
    },
    {
        header: "RPN points",
        key: "rpn_points",
        width: 11,
        align: "center"
    },
    {
        header: "Normalized RPN",
        key: "rpn",
        width: 13,
        align: "center"
    },
    {
        header: "Risk band",
        key: "band",
        width: 12
    },
    {
        header: "Stale",
        key: "stale",
        width: 8,
        align: "center"
    }
];
const TRACE_COVERAGE_COLUMNS = [
    {
        header: "Requirement",
        key: "requirement_id",
        width: 19
    },
    {
        header: "Version",
        key: "requirement_version",
        width: 12
    },
    {
        header: "Assurance level",
        key: "assurance_level",
        width: 13
    },
    {
        header: "Assurance label",
        key: "assurance_label",
        width: 23
    },
    {
        header: "Reason code",
        key: "reason_code",
        width: 20
    },
    {
        header: "Test reference",
        key: "test_id",
        width: 24
    },
    {
        header: "Test title",
        key: "test_title",
        width: 26
    },
    {
        header: "Test origin",
        key: "test_origin",
        width: 12
    },
    {
        header: "Coverage status",
        key: "coverage_status",
        width: 20
    },
    {
        header: "Orphan flags",
        key: "orphan_flags",
        width: 14
    }
];
function traceabilityDisplayRows(data) {
    return data.traceability.rows.map((row)=>({
            ...row,
            requirement_id: row.requirement_id || "Unlinked",
            requirement_version: row.requirement_version || "—",
            risk_id: row.risk_id || "—",
            rpn_points: row.rpn_points ?? "—",
            rpn: row.rpn ?? "—",
            band: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["riskBandLabel"])(row.band),
            assurance_level: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assuranceLevelLabel"])(row.assurance_level),
            assurance_label: row.assurance_label || "—",
            reason_code: row.reason_code || "—",
            test_title: row.test_title || "—",
            test_id: row.test_id || "—",
            test_origin: row.test_origin || "—",
            coverage_status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["coverageLabel"])(row.coverage_status),
            stale: row.stale ? "Yes" : "No",
            orphan_flags: String(row.orphan_flags || "").replace(/;/g, ", ") || "—"
        }));
}
const TRACE_GRAPH_NODE_TYPES = [
    "requirement",
    "risk",
    "assurance",
    "test"
];
const TRACE_GRAPH_WIDTH = 1240;
const TRACE_GRAPH_HEIGHT = 500;
function wrapGraphLabel(value, maxLength) {
    const words = value.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const word of words){
        if (line && `${line} ${word}`.length > maxLength) {
            lines.push(line);
            line = word;
        } else {
            line = line ? `${line} ${word}` : word;
        }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [
        ""
    ];
}
function escapeSvgText(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function hasTraceEdgeVisual(type) {
    return Object.prototype.hasOwnProperty.call(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_EDGE_VISUALS"], type);
}
function traceabilityGraphSvg(data) {
    const graph = data.traceability.graph;
    if (!graph || !graph.edges.length) return null;
    const nodes = graph.nodes.filter((node)=>TRACE_GRAPH_NODE_TYPES.includes(node.type));
    const nodePositions = new Map();
    const columnCounts = new Map();
    const presentTypes = TRACE_GRAPH_NODE_TYPES.filter((type)=>nodes.some((node)=>node.type === type));
    for (const node of nodes){
        const type = node.type;
        const column = presentTypes.indexOf(type);
        const row = columnCounts.get(type) ?? 0;
        columnCounts.set(type, row + 1);
        const labelLines = wrapGraphLabel(node.label, 26);
        nodePositions.set(node.id, {
            x: column * __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_COLUMN_GAP"],
            y: row * __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_ROW_GAP"],
            height: 24 + (labelLines.length + 1) * 18,
            labelLines,
            type,
            orphaned: node.orphaned === true
        });
    }
    const maxX = Math.max(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_NODE_WIDTH"], ...[
        ...nodePositions.values()
    ].map((position)=>position.x + __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_NODE_WIDTH"]));
    const maxY = Math.max(66, ...[
        ...nodePositions.values()
    ].map((position)=>position.y + position.height));
    const graphArea = {
        x: 24,
        y: 20,
        width: TRACE_GRAPH_WIDTH - 48,
        height: 390
    };
    const scale = Math.min(2, graphArea.width / maxX, graphArea.height / maxY);
    const transformX = graphArea.x + (graphArea.width - maxX * scale) / 2;
    const transformY = graphArea.y + (graphArea.height - maxY * scale) / 2;
    const edgesSvg = graph.edges.flatMap((edge)=>{
        const source = nodePositions.get(edge.source);
        const target = nodePositions.get(edge.target);
        if (!source || !target || !hasTraceEdgeVisual(edge.type)) return [];
        const color = source.orphaned || target.orphaned ? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_ORPHAN_EDGE_COLOR"] : __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_EDGE_VISUALS"][edge.type].color;
        const x1 = transformX + (source.x + __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_NODE_WIDTH"] / 2) * scale;
        const y1 = transformY + (source.y + source.height) * scale;
        const x2 = transformX + (target.x + __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_NODE_WIDTH"] / 2) * scale;
        const y2 = transformY + target.y * scale;
        const curve = Math.max(28, Math.abs(y2 - y1) / 2);
        const dashed = source.orphaned || target.orphaned;
        return [
            `<path d="M ${x1} ${y1} C ${x1} ${y1 + curve}, ${x2} ${y2 - curve}, ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="1.8"${dashed ? ' stroke-dasharray="6 4"' : ""} marker-end="url(#arrow-${color.slice(1)})"/>`
        ];
    });
    const nodesSvg = nodes.map((node)=>{
        const position = nodePositions.get(node.id);
        if (!position) return "";
        const style = position.orphaned ? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_ORPHAN_STYLE"][position.type] : __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_CURRENT_STYLE"][position.type];
        const border = style.border.match(/(\d+)px (solid|dashed) (#[0-9a-f]+)/i);
        const strokeWidth = Number(border?.[1] ?? 2);
        const dash = border?.[2] === "dashed" ? ' stroke-dasharray="6 4"' : "";
        const x = transformX + position.x * scale;
        const y = transformY + position.y * scale;
        const width = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_NODE_WIDTH"] * scale;
        const height = position.height * scale;
        const title = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_TYPE_LABEL"][position.type];
        const lines = position.labelLines;
        const textY = y + height / 2 - (lines.length + 1) * 18 * scale / 2 + 13 * scale;
        return `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_NODE_RADIUS"] * scale}" fill="${style.background}" stroke="${border?.[3] ?? style.color}" stroke-width="${strokeWidth * scale}"${dash}/><text x="${x + width / 2}" y="${textY}" text-anchor="middle" fill="${style.color}" font-family="Arial, Helvetica, sans-serif" font-size="${12 * scale}" font-weight="600"><tspan x="${x + width / 2}" dy="0">${escapeSvgText(title)}</tspan>${lines.map((line)=>`<tspan x="${x + width / 2}" dy="${18 * scale}">${escapeSvgText(line)}</tspan>`).join("")}</text></g>`;
    });
    const edgeTypes = [
        ...new Set(graph.edges.map((edge)=>edge.type).filter(hasTraceEdgeVisual))
    ];
    let legendX = 20;
    let legendY = 464;
    const legendSvg = edgeTypes.map((type)=>{
        const visual = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_EDGE_VISUALS"][type];
        const label = escapeSvgText(visual.label);
        const entryWidth = 27 + visual.label.length * 7 + 20;
        if (legendX + entryWidth > TRACE_GRAPH_WIDTH - 20) {
            legendX = 20;
            legendY += 20;
        }
        const entry = `<g><line x1="${legendX}" y1="${legendY}" x2="${legendX + 20}" y2="${legendY}" stroke="${visual.color}" stroke-width="2"/><text x="${legendX + 27}" y="${legendY + 4}" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="11">${label}</text></g>`;
        legendX += entryWidth;
        return entry;
    }).join("");
    const hasOrphans = nodes.some((node)=>node.orphaned);
    const orphanLegend = hasOrphans ? `<g><rect x="20" y="482" width="12" height="12" rx="2" fill="#FFFBEB" stroke="#D97706" stroke-width="2" stroke-dasharray="4 3"/><text x="39" y="492" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="11">Orphaned artifact — superseded version or retired requirement</text></g>` : "";
    const markerTypes = [
        ...new Set(edgeTypes.map((type)=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$traceability$2d$graph$2d$visuals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRACE_GRAPH_EDGE_VISUALS"][type].color))
    ].map((color)=>`<marker id="arrow-${color.slice(1)}" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M 0 0 L 12 6 L 0 12 z" fill="${color}"/></marker>`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${TRACE_GRAPH_WIDTH}" height="${TRACE_GRAPH_HEIGHT}" viewBox="0 0 ${TRACE_GRAPH_WIDTH} ${TRACE_GRAPH_HEIGHT}"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#FFECE5"/></pattern>${markerTypes}</defs><rect width="100%" height="100%" fill="#ffffff"/><rect width="100%" height="430" fill="url(#dots)"/>${edgesSvg.join("")}${nodesSvg.join("")}${legendSvg}${orphanLegend}</svg>`;
}
async function renderTraceabilityGraph(builder, data) {
    const svg = traceabilityGraphSvg(data);
    if (!svg) {
        builder.paragraph("No graph edges are available for the selected requirement versions. The matrix below preserves the available row-level traceability data.", {
            color: [
                82,
                82,
                82
            ],
            fontSize: 9
        });
        return;
    }
    builder.newPage(builder.sectionTitle, true);
    builder.subheading("Relationship graph");
    builder.paragraph("This image uses the same relationship graph design shown in the RAVEN traceability workspace.", {
        color: [
            82,
            82,
            82
        ],
        fontSize: 9
    });
    const imageWidth = builder.contentWidth;
    const imageHeight = imageWidth * TRACE_GRAPH_HEIGHT / TRACE_GRAPH_WIDTH;
    builder.ensureSpace(imageHeight + 2);
    const snapshotRoot = document.createElement("div");
    snapshotRoot.style.position = "fixed";
    snapshotRoot.style.left = "0";
    snapshotRoot.style.top = "0";
    snapshotRoot.style.zIndex = "-1";
    snapshotRoot.style.pointerEvents = "none";
    snapshotRoot.style.width = `${TRACE_GRAPH_WIDTH}px`;
    snapshotRoot.style.height = `${TRACE_GRAPH_HEIGHT}px`;
    snapshotRoot.innerHTML = svg;
    document.body.appendChild(snapshotRoot);
    let canvas;
    try {
        canvas = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html2canvas$2f$dist$2f$html2canvas$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(snapshotRoot, {
            background: "#ffffff",
            height: TRACE_GRAPH_HEIGHT,
            logging: false,
            width: TRACE_GRAPH_WIDTH
        });
    } finally{
        snapshotRoot.remove();
    }
    builder.doc.addImage(canvas, "PNG", builder.margin, builder.y, imageWidth, imageHeight, "raven-traceability-graph");
    builder.y += imageHeight + 2;
    builder.newPage(builder.sectionTitle, false);
    const graph = data.traceability.graph;
    if (!graph) return;
    const nodeById = new Map(graph.nodes.map((node)=>[
            node.id,
            node
        ]));
    const nodeLabel = (id)=>{
        const node = nodeById.get(id);
        if (!node) return "Unresolved node";
        const type = node.type.charAt(0).toUpperCase() + node.type.slice(1);
        return `${type}: ${node.label}${node.orphaned ? " (orphaned)" : ""}`;
    };
    builder.subheading("Directed relationships");
    builder.table([
        {
            header: "From node",
            key: "from",
            width: 72
        },
        {
            header: "Relationship",
            key: "relationship",
            width: 30
        },
        {
            header: "To node",
            key: "to",
            width: 72
        },
        {
            header: "State",
            key: "state",
            width: 24
        }
    ], graph.edges.map((edge)=>({
            from: nodeLabel(edge.source),
            relationship: edge.type.replace(/_/g, " "),
            to: nodeLabel(edge.target),
            state: edge.stale || nodeById.get(edge.source)?.orphaned || nodeById.get(edge.target)?.orphaned ? "Stale / orphaned" : "Current"
        })), {
        fontSize: 8.6
    });
}
async function renderTraceabilitySection(builder, data, _refs) {
    void _refs;
    builder.startSection(SECTION_TITLES.traceability, {
        newPage: true,
        landscape: false
    });
    const summary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["traceabilitySummary"])(data);
    builder.callout("Coverage and orphan semantics are supplied by the backend traceability service. O2 orphan tests have no linked requirement and are shown as Unlinked.");
    builder.subheading("Coverage summary");
    builder.table([
        {
            header: "Coverage category",
            key: "category",
            width: 38
        },
        {
            header: "Count",
            key: "count",
            width: 14,
            align: "center"
        },
        {
            header: "Definition",
            key: "definition",
            width: 98
        }
    ], [
        {
            category: "Requirements",
            count: summary.requirements,
            definition: "Selected requirement versions"
        },
        {
            category: "Covered by tests",
            count: summary.covered_by_tests,
            definition: "At least one active test covers the requirement"
        },
        {
            category: "Covered by assurance",
            count: summary.covered_by_assurance,
            definition: "An assurance decision covers the requirement"
        },
        {
            category: "Uncovered",
            count: summary.uncovered,
            definition: "No test or assurance coverage is recorded"
        },
        {
            category: "Stale",
            count: summary.stale,
            definition: "Coverage is present but marked stale"
        }
    ], {
        fontSize: 8.8
    });
    builder.y += 3;
    builder.table([
        {
            header: "Traceability measure",
            key: "measure",
            width: 52
        },
        {
            header: "Count",
            key: "count",
            width: 14,
            align: "center"
        },
        {
            header: "Orphan finding",
            key: "orphan",
            width: 84
        }
    ], [
        {
            measure: "Traceability rows",
            count: summary.rows,
            orphan: "O1 — requirement coverage issue"
        },
        {
            measure: "Stale rows",
            count: summary.stale_rows,
            orphan: "O2 — test has no linked requirement"
        },
        {
            measure: "Orphan findings",
            count: summary.orphans.total,
            orphan: "O3 — risk or assurance linkage issue"
        },
        {
            measure: "O1 / O2 / O3 breakdown",
            count: `${summary.orphans.O1} / ${summary.orphans.O2} / ${summary.orphans.O3}`,
            orphan: "Counts are shown in O1 / O2 / O3 order"
        }
    ], {
        fontSize: 8.8
    });
    builder.y += 2;
    await renderTraceabilityGraph(builder, data);
    builder.y += 3;
    if (!data.traceability.rows.length) {
        builder.paragraph("No traceability rows are available for the selected requirement versions. No coverage is inferred.");
        return;
    }
    const rows = traceabilityDisplayRows(data);
    builder.newPage(builder.sectionTitle, true);
    builder.subheading("Risk and scoring trace");
    builder.table(TRACE_RISK_COLUMNS, rows, {
        fontSize: 8.8,
        headerFontSize: 8.5
    });
    builder.y += 4;
    builder.subheading("Assurance and coverage trace");
    builder.table(TRACE_COVERAGE_COLUMNS, rows, {
        fontSize: 8.5,
        headerFontSize: 8.5
    });
    builder.callout("The matrix is a point-in-time export. A row with no test is not evidence that the requirement is untestable; it means no test script was recorded against the selected current version.");
}
function renderGapReportSection(builder, data, refs) {
    builder.startSection(SECTION_TITLES.gaps, {
        newPage: true,
        landscape: false
    });
    const findings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deriveGapFindings"])(data, refs);
    builder.callout("Findings are deterministic export-time calculations from the selected records. They are not persisted approvals, CAPA records, or compliance verdicts. Persisted compliance results are labelled separately.", "warning");
    builder.metadataGroup("Finding summary", [
        [
            "Total findings",
            String(findings.length)
        ],
        [
            "Derived findings",
            String(findings.filter((finding)=>finding.status === "Derived finding").length)
        ],
        [
            "Persisted compliance results",
            String(findings.filter((finding)=>finding.status === "Persisted compliance result").length)
        ],
        [
            "By category",
            [
                ...new Set(findings.map((finding)=>finding.category))
            ].join(" · ") || "None"
        ]
    ]);
    if (!findings.length) {
        builder.paragraph("No gap findings were derived for the selected records. This is not a statement that the records are compliant or complete; it means the deterministic checks found no gap in the loaded data.");
        return;
    }
    findings.forEach((finding)=>{
        builder.beginCard();
        builder.subheading(`${finding.id} — ${finding.category}`);
        builder.metaRow("Requirement", finding.requirementRef);
        builder.metaRow("Requirement version", finding.requirementVersion);
        builder.metaRow("Related references", finding.related.length ? finding.related.join(" · ") : "None");
        builder.metaRow("Source", finding.source);
        builder.metaRow("Status", finding.status);
        builder.labelParagraph("Finding", finding.finding);
        builder.labelParagraph("Recommendation", finding.recommendation);
        builder.labelParagraph("Closure evidence", finding.closureEvidence);
        builder.endCard();
    });
}
function renderEvidenceIndexRecord(builder, requirement, evidence, refs) {
    const relatedRiskRefs = requirement.risks.filter((risk)=>risk.evidence_id === evidence.id).map((risk)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["riskReference"])(refs, risk.id));
    builder.subheading(`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["evidenceReference"])(refs, evidence.id)} — Evidence record`);
    builder.metaRow("Requirement", requirement.display_key || requirement.req_key || "Requirement");
    builder.metaRow("Requirement version", requirement.version ? `Version ${requirement.version}` : "Not recorded");
    builder.metaRow("Recorded", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateTime"])(evidence.created_at));
    builder.metaRow("Related risk assessment", relatedRiskRefs.length ? relatedRiskRefs.join(", ") : "No risk assessment is linked");
    let rendered = false;
    for (const group of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EVIDENCE_GROUPS"]){
        rendered = renderEvidenceGroup(builder, evidence, group) || rendered;
    }
    if (!rendered) {
        builder.paragraph("No readable evidence fields were stored for this evidence record. No sentence is substituted.");
    }
    const gxpField = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEvidenceField"])(evidence, "gxp_impact");
    const gampField = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEvidenceField"])(evidence, "gamp_category");
    if (gxpField) {
        builder.labelParagraph(`GxP impact derivation — ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatValue"])(gxpField.value)}`, gxpField.evidence || "No derivation sentence was stored.", {
            meta: `Confidence: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatConfidence"])(gxpField.confidence)}`
        });
    }
    if (gampField) {
        builder.labelParagraph(`GAMP category derivation — ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatValue"])(gampField.value)}`, gampField.evidence || "No derivation sentence was stored.", {
            meta: `Confidence: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatConfidence"])(gampField.confidence)}`
        });
    }
}
function renderEvidenceIndexSection(builder, data, refs) {
    builder.startSection(SECTION_TITLES.evidence, {
        newPage: true,
        landscape: false
    });
    builder.paragraph("Evidence references are scoped to this export pack. Supporting sentences are reproduced in full; confidence values are shown as percentages.", {
        color: [
            82,
            82,
            82
        ],
        fontSize: 8.6
    });
    orderedRequirements(data).forEach((requirement)=>{
        requirementSummary(builder, requirement);
        if (!requirement.evidence.length) {
            builder.paragraph("No evidence record is stored for the current requirement version. This is an absence of a record.");
            return;
        }
        const sorted = [
            ...requirement.evidence
        ].sort((a, b)=>(a.created_at || "").localeCompare(b.created_at || "", "en"));
        sorted.forEach((evidence)=>{
            builder.divider();
            renderEvidenceIndexRecord(builder, requirement, evidence, refs);
        });
        const riskRefs = requirement.risks.map((risk)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["riskReference"])(refs, risk.id));
        if (riskRefs.length) {
            builder.metaRow("Risk assessments for this requirement", riskRefs.join(", "));
        }
    });
}
function renderLimitationsSection(builder) {
    builder.startSection(SECTION_TITLES.appendices, {
        newPage: true,
        landscape: false
    });
    builder.callout("This pack is a faithful presentation of the selected records. It is not a substitute for an approved validation dossier, and it does not create approval, execution, or compliance evidence.");
    builder.bullets([
        "Report references such as RA-001, ASR-001, TS-001, and EV-001 are scoped to this pack. They are not persistent database identifiers.",
        "The pack reflects the current requirement version selected at generation time. Historical versions are not substituted.",
        "Freshness is preserved as fresh, stale, or superseded. Stale and superseded records remain visible with their freshness.",
        "Where no ComplianceResult exists, the pack records an absence of the record. It does not present that absence as compliance.",
        "Findings labelled Derived finding are deterministic export-time calculations. They are not persisted CAPA records.",
        "No owners, mitigations, residual-risk values, approvals, signatures, or acceptance decisions are invented.",
        "A machine-readable identifier crosswalk is included in the ZIP metadata. Database identifiers are intentionally not displayed in the reader-facing PDFs."
    ]);
}
async function renderConsolidatedPack(builder, data, refs) {
    const requirementCount = data.requirements.length;
    builder.cover({
        subtitle: "Validation evidence, assurance decisions, test scripts, and traceability",
        scope: "Selected requirements",
        versionPolicy: "Current version per requirement",
        requirementCount,
        generatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateTime"])(data.generated_at),
        packReference: refs.packReference,
        requirementKeys: data.requirements.map(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requirementKey"]),
        contents: [
            SECTION_TITLES.risk,
            SECTION_TITLES.assurance,
            SECTION_TITLES.tests,
            SECTION_TITLES.traceability,
            SECTION_TITLES.gaps
        ]
    });
    const summary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2d$pack$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["traceabilitySummary"])(data);
    const toc = builder.addToc([
        "Executive Summary",
        SECTION_TITLES.risk,
        SECTION_TITLES.assurance,
        SECTION_TITLES.tests,
        SECTION_TITLES.traceability,
        SECTION_TITLES.gaps,
        SECTION_TITLES.appendices
    ]);
    builder.startSection("Executive Summary", {
        newPage: true
    });
    builder.callout(`${requirementCount} selected requirement version(s) are included. The pack contains ${summary.requirements} requirement record(s), ${data.requirements.reduce((count, item)=>count + item.risks.length, 0)} risk assessment(s), ${data.requirements.reduce((count, item)=>count + item.assurance.length, 0)} assurance decision(s), and ${data.requirements.reduce((count, item)=>count + item.tests.length, 0)} test script(s).`);
    builder.bullets([
        `Traceability: ${summary.covered_by_tests} covered by tests, ${summary.covered_by_assurance} covered by assurance, ${summary.uncovered} uncovered, and ${summary.stale} stale.`,
        `Orphan findings: O1 ${summary.orphans.O1}, O2 ${summary.orphans.O2}, O3 ${summary.orphans.O3}.`,
        data.compliance_evaluated ? "Persisted compliance results are included where available; their stored status is reproduced." : "Compliance was not evaluated: no persisted ComplianceResult is available for the selected requirements.",
        "Test execution was not recorded. The test scripts section reproduces script content only."
    ]);
    renderRiskAssessmentSection(builder, data, refs);
    renderAssuranceSection(builder, data, refs);
    renderTestScriptsSection(builder, data, refs);
    await renderTraceabilitySection(builder, data, refs);
    renderGapReportSection(builder, data, refs);
    renderLimitationsSection(builder);
    builder.fillToc(toc);
    return builder.finalize();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/traceability-graph-visuals.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TRACE_GRAPH_COLUMN_GAP",
    ()=>TRACE_GRAPH_COLUMN_GAP,
    "TRACE_GRAPH_CURRENT_STYLE",
    ()=>TRACE_GRAPH_CURRENT_STYLE,
    "TRACE_GRAPH_EDGE_VISUALS",
    ()=>TRACE_GRAPH_EDGE_VISUALS,
    "TRACE_GRAPH_NODE_RADIUS",
    ()=>TRACE_GRAPH_NODE_RADIUS,
    "TRACE_GRAPH_NODE_WIDTH",
    ()=>TRACE_GRAPH_NODE_WIDTH,
    "TRACE_GRAPH_ORPHAN_EDGE_COLOR",
    ()=>TRACE_GRAPH_ORPHAN_EDGE_COLOR,
    "TRACE_GRAPH_ORPHAN_STYLE",
    ()=>TRACE_GRAPH_ORPHAN_STYLE,
    "TRACE_GRAPH_ROW_GAP",
    ()=>TRACE_GRAPH_ROW_GAP,
    "TRACE_GRAPH_TYPE_LABEL",
    ()=>TRACE_GRAPH_TYPE_LABEL
]);
const TRACE_GRAPH_NODE_WIDTH = 220;
const TRACE_GRAPH_NODE_RADIUS = 8;
const TRACE_GRAPH_COLUMN_GAP = 320;
const TRACE_GRAPH_ROW_GAP = 120;
const TRACE_GRAPH_ORPHAN_EDGE_COLOR = "#D97706";
const TRACE_GRAPH_EDGE_VISUALS = {
    has_risk: {
        color: "#DC2626",
        label: "Has risk"
    },
    assessed_as: {
        color: "#71717A",
        label: "Assessed as"
    },
    mitigated_by: {
        color: "#2563EB",
        label: "Mitigated by"
    },
    verifies: {
        color: "#059669",
        label: "Verifies"
    }
};
const TRACE_GRAPH_CURRENT_STYLE = {
    requirement: {
        background: "#FAFAFA",
        border: "2px solid #52525B",
        color: "#18181B"
    },
    risk: {
        background: "#FEF2F2",
        border: "2px solid #B91C1C",
        color: "#7F1D1D"
    },
    assurance: {
        background: "#F4F4F5",
        border: "2px solid #A1A1AA",
        color: "#3F3F46"
    },
    test: {
        background: "#EFF6FF",
        border: "2px solid #1D4ED8",
        color: "#1E3A8A"
    }
};
const TRACE_GRAPH_ORPHAN_STYLE = {
    requirement: {
        background: "#FEF08A",
        border: "2px solid #CA8A04",
        color: "#713F12"
    },
    risk: {
        background: "#FFFBEB",
        border: "2px dashed #D97706",
        color: "#92400E"
    },
    assurance: {
        background: "#FFFBEB",
        border: "2px dashed #D97706",
        color: "#92400E"
    },
    test: {
        background: "#FFFBEB",
        border: "2px dashed #D97706",
        color: "#92400E"
    }
};
const TRACE_GRAPH_TYPE_LABEL = {
    requirement: "Requirement",
    risk: "Risk assessment",
    assurance: "Assurance decision",
    test: "Test script"
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/validation-pack.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Validation-pack domain helpers.
 *
 * The backend payload is the source of truth.  This module only adapts it for
 * presentation and derives transparent, export-time findings.  Database IDs
 * remain available for the ZIP metadata crosswalk, but reader-facing labels
 * are built from requirement keys, versions, and report-scoped references.
 */ __turbopack_context__.s([
    "EVIDENCE_GROUPS",
    ()=>EVIDENCE_GROUPS,
    "RISK_BAND_LABELS",
    ()=>RISK_BAND_LABELS,
    "assuranceLevelLabel",
    ()=>assuranceLevelLabel,
    "assuranceReference",
    ()=>assuranceReference,
    "buildMetadataCrosswalk",
    ()=>buildMetadataCrosswalk,
    "buildReportReferences",
    ()=>buildReportReferences,
    "coverageLabel",
    ()=>coverageLabel,
    "deriveGapFindings",
    ()=>deriveGapFindings,
    "describeAssuranceRule",
    ()=>describeAssuranceRule,
    "evidenceRecordForRisk",
    ()=>evidenceRecordForRisk,
    "evidenceReference",
    ()=>evidenceReference,
    "filterRequirements",
    ()=>filterRequirements,
    "formatConfidence",
    ()=>formatConfidence,
    "formatDateTime",
    ()=>formatDateTime,
    "formatValue",
    ()=>formatValue,
    "getEvidenceField",
    ()=>getEvidenceField,
    "humanizeDecisionPath",
    ()=>humanizeDecisionPath,
    "humanizeKey",
    ()=>humanizeKey,
    "matrixToCsv",
    ()=>matrixToCsv,
    "matrixToReadableCsv",
    ()=>matrixToReadableCsv,
    "parseTestScript",
    ()=>parseTestScript,
    "relatedAssuranceForTest",
    ()=>relatedAssuranceForTest,
    "relatedRiskForAssurance",
    ()=>relatedRiskForAssurance,
    "requirementDisplayTitle",
    ()=>requirementDisplayTitle,
    "requirementForReference",
    ()=>requirementForReference,
    "requirementHeading",
    ()=>requirementHeading,
    "requirementKey",
    ()=>requirementKey,
    "riskBandLabel",
    ()=>riskBandLabel,
    "riskReference",
    ()=>riskReference,
    "testDisplayTitle",
    ()=>testDisplayTitle,
    "testReference",
    ()=>testReference,
    "testsForAssurance",
    ()=>testsForAssurance,
    "traceabilitySummary",
    ()=>traceabilitySummary
]);
const EVIDENCE_GROUPS = [
    {
        title: "Impact and severity evidence",
        fields: [
            [
                "patient_safety",
                "Patient safety"
            ],
            [
                "product_quality",
                "Product quality"
            ],
            [
                "batch_release",
                "Batch release"
            ],
            [
                "data_integrity",
                "Data integrity"
            ],
            [
                "regulatory_compliance",
                "Regulatory compliance"
            ],
            [
                "business_continuity",
                "Business continuity"
            ]
        ]
    },
    {
        title: "Complexity and probability evidence",
        fields: [
            [
                "functional_complexity",
                "Functional complexity"
            ],
            [
                "dependency_complexity",
                "Dependency complexity"
            ],
            [
                "workflow_complexity",
                "Workflow complexity"
            ]
        ]
    },
    {
        title: "Detection and detectability evidence",
        fields: [
            [
                "detection_controls",
                "Detection controls"
            ],
            [
                "traceability",
                "Traceability"
            ],
            [
                "failure_visibility",
                "Failure visibility"
            ]
        ]
    }
];
const RISK_BAND_LABELS = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    low: "Low",
    medium: "Medium",
    high: "High"
};
function text(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
}
function finiteNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function formatValue(value) {
    if (value === null || value === undefined || value === "") return "Not recorded";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(value);
    return text(value) || "Not recorded";
}
function formatConfidence(value) {
    const numeric = finiteNumber(value);
    if (numeric === null) return "Not recorded";
    const percent = numeric <= 1 ? numeric * 100 : numeric;
    return `${Math.round(percent)}%`;
}
function formatDateTime(value) {
    if (!value) return "Not recorded";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return `${parsed.toISOString().slice(0, 10)} ${parsed.toISOString().slice(11, 16)} UTC`;
}
function humanizeKey(value) {
    return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/^./, (character)=>character.toUpperCase());
}
function humanizeScalar(value) {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (value === null || value === undefined || value === "") return "Not recorded";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    return text(value) || "Not recorded";
}
const DECISION_FIELD_LABELS = {
    severity: "Severity score",
    probability: "Probability score",
    detectability: "Detectability score",
    band: "Risk band",
    level: "Selected assurance level",
    assurance_level: "Assurance level",
    generate_test: "Test generation requested",
    rule: "Rule",
    rule_id: "Rule identifier",
    rule_version: "Rule version"
};
function humanizeDecisionPath(value, depth = 0) {
    if (value === null || value === undefined) return [
        "Not recorded"
    ];
    if (Array.isArray(value)) {
        if (!value.length) return [
            "Not recorded"
        ];
        return value.flatMap((item, index)=>{
            if (item !== null && typeof item === "object") {
                const nested = humanizeDecisionPath(item, depth + 1);
                return [
                    `${index + 1}. ${nested[0]}`,
                    ...nested.slice(1).map((line)=>`   ${line}`)
                ];
            }
            return [
                `${index + 1}. ${humanizeScalar(item)}`
            ];
        });
    }
    if (typeof value === "object") {
        const entries = Object.entries(value);
        if (!entries.length) return [
            "Not recorded"
        ];
        return entries.flatMap(([key, item])=>{
            const label = DECISION_FIELD_LABELS[key] || humanizeKey(key);
            if (item === null || item === undefined) return [
                `${label}: Not recorded`
            ];
            if (Array.isArray(item)) {
                if (!item.length) return [
                    `${label}: Not recorded`
                ];
                const nested = humanizeDecisionPath(item, depth + 1);
                return [
                    `${label}:`,
                    ...nested.map((line)=>`  ${line}`)
                ];
            }
            if (typeof item === "object") {
                const nested = humanizeDecisionPath(item, depth + 1);
                return [
                    `${label}:`,
                    ...nested.map((line)=>`  ${line}`)
                ];
            }
            const scalar = key === "level" || key === "assurance_level" ? humanizeKey(humanizeScalar(item)) : humanizeScalar(item);
            return [
                `${label}: ${scalar}`
            ];
        });
    }
    return [
        humanizeScalar(value)
    ];
}
function describeAssuranceRule(ruleId) {
    switch(ruleId){
        case "ASR-SEV-FLOOR":
            return "The deterministic assurance implementation checks the severity floor first. A severity score of 4 or 5 selects scripted testing regardless of the overall risk band.";
        case "ASR-BAND-HIGH":
            return "The deterministic assurance implementation selects scripted testing when the overall risk band is High.";
        case "ASR-BAND-MEDIUM":
            return "The deterministic assurance implementation selects exploratory testing when the overall risk band is Medium.";
        case "ASR-BAND-LOW":
            return "The deterministic assurance implementation selects unscripted testing when the overall risk band is Low.";
        default:
            return "The stored rule identifier is shown above. The current implementation does not provide a generic explanation for this rule, so no behaviour is inferred from its name.";
    }
}
function riskBandLabel(value) {
    const raw = text(value);
    return RISK_BAND_LABELS[raw] || raw || "Not recorded";
}
function assuranceLevelLabel(value) {
    const raw = text(value);
    if (!raw) return "Not recorded";
    return humanizeKey(raw);
}
function requirementKey(requirement) {
    return text(requirement.display_key) || text(requirement.req_key) || `REQ-${requirement.id.slice(0, 8).toUpperCase()}`;
}
function requirementHeading(requirement) {
    return `${requirementKey(requirement)} — Version ${requirement.version ?? "Not recorded"}`;
}
function requirementDisplayTitle(requirement) {
    return text(requirement.title) || text(requirement.requirement_title) || "Untitled requirement";
}
function testDisplayTitle(test, reference) {
    return text(test.title) || text(test.external_code) || `${reference} — Test script for the selected requirement version`;
}
function fieldObject(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const value = raw;
    return {
        value: value.value,
        confidence: finiteNumber(value.confidence),
        evidence: text(value.evidence) || null
    };
}
function getEvidenceField(evidence, field) {
    if (!evidence) return null;
    return fieldObject(evidence.fields[field]);
}
function evidenceRecordForRisk(requirement, risk) {
    if (risk.evidence) return risk.evidence;
    return requirement.evidence.find((record)=>record.id === risk.evidence_id) || null;
}
function stableCompare(a, b) {
    return a.localeCompare(b, "en");
}
function assignUnique(base, used) {
    if (!used.has(base)) {
        used.add(base);
        return base;
    }
    let suffix = 2;
    while(used.has(`${base}-${suffix}`))suffix += 1;
    const result = `${base}-${suffix}`;
    used.add(result);
    return result;
}
function referenceHash(value) {
    let hash = 0x811c9dc5;
    for(let index = 0; index < value.length; index += 1){
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}
function sortedRequirements(data) {
    return [
        ...data.requirements
    ].sort((a, b)=>{
        const keyCompare = stableCompare(requirementKey(a), requirementKey(b));
        return keyCompare || stableCompare(a.id, b.id);
    });
}
function buildReportReferences(data) {
    const requirements = sortedRequirements(data);
    const requirementRefs = new Map();
    const riskRefs = new Map();
    const assuranceRefs = new Map();
    const testRefs = new Map();
    const evidenceRefs = new Map();
    const requirementForRisk = new Map();
    const requirementForAssurance = new Map();
    const requirementForTest = new Map();
    const requirementForEvidence = new Map();
    const riskForAssurance = new Map();
    const usedRequirements = new Set();
    let riskCounter = 0;
    let assuranceCounter = 0;
    let testCounter = 0;
    let evidenceCounter = 0;
    for (const requirement of requirements){
        const base = requirementKey(requirement);
        requirementRefs.set(requirement.id, assignUnique(base, usedRequirements));
        const sortedRisks = [
            ...requirement.risks
        ].sort((a, b)=>{
            const created = stableCompare(a.created_at || "", b.created_at || "");
            return created || stableCompare(a.id, b.id);
        });
        const riskOrder = new Map();
        for (const risk of sortedRisks){
            riskCounter += 1;
            riskRefs.set(risk.id, `RA-${String(riskCounter).padStart(3, "0")}`);
            requirementForRisk.set(risk.id, requirement.id);
            riskOrder.set(risk.id, riskCounter);
        }
        const sortedAssurance = [
            ...requirement.assurance
        ].sort((a, b)=>{
            const riskA = riskOrder.get(a.risk_assessment_id) || 0;
            const riskB = riskOrder.get(b.risk_assessment_id) || 0;
            return riskA - riskB || stableCompare(a.created_at || "", b.created_at || "") || stableCompare(a.id, b.id);
        });
        for (const assurance of sortedAssurance){
            assuranceCounter += 1;
            assuranceRefs.set(assurance.id, `ASR-${String(assuranceCounter).padStart(3, "0")}`);
            requirementForAssurance.set(assurance.id, requirement.id);
            riskForAssurance.set(assurance.id, assurance.risk_assessment_id);
        }
        const sortedTests = [
            ...requirement.tests
        ].sort((a, b)=>{
            const created = stableCompare(a.created_at || "", b.created_at || "");
            return created || stableCompare(a.id, b.id);
        });
        for (const test of sortedTests){
            testCounter += 1;
            testRefs.set(test.id, `TS-${String(testCounter).padStart(3, "0")}`);
            requirementForTest.set(test.id, requirement.id);
        }
        const sortedEvidence = [
            ...requirement.evidence
        ].sort((a, b)=>{
            const created = stableCompare(a.created_at || "", b.created_at || "");
            return created || stableCompare(a.id, b.id);
        });
        for (const evidence of sortedEvidence){
            evidenceCounter += 1;
            evidenceRefs.set(evidence.id, `EV-${String(evidenceCounter).padStart(3, "0")}`);
            requirementForEvidence.set(evidence.id, requirement.id);
        }
    }
    const scope = requirements.map((requirement)=>`${requirementRefs.get(requirement.id)}:${requirement.version_id || "no-version"}`).join("|");
    const packReference = text(data.pack_reference) || `VP-${referenceHash(scope)}`;
    return {
        packReference,
        requirementRefs,
        riskRefs,
        assuranceRefs,
        testRefs,
        evidenceRefs,
        requirementForRisk,
        requirementForAssurance,
        requirementForTest,
        requirementForEvidence,
        riskForAssurance
    };
}
function requirementForReference(refs, requirementId, data) {
    return data.requirements.find((item)=>item.id === requirementId) || null;
}
function riskReference(refs, riskId) {
    return refs.riskRefs.get(riskId) || "Risk assessment reference unavailable";
}
function assuranceReference(refs, assuranceId) {
    return refs.assuranceRefs.get(assuranceId) || "Assurance decision reference unavailable";
}
function testReference(refs, testId) {
    return refs.testRefs.get(testId) || "Test script reference unavailable";
}
function evidenceReference(refs, evidenceId) {
    return refs.evidenceRefs.get(evidenceId) || "Evidence reference unavailable";
}
function relatedRiskForAssurance(requirement, assurance) {
    return requirement.risks.find((risk)=>risk.id === assurance.risk_assessment_id) || null;
}
function relatedAssuranceForTest(requirement, test) {
    if (!test.assurance_decision_id) return null;
    return requirement.assurance.find((assurance)=>assurance.id === test.assurance_decision_id) || null;
}
function testsForAssurance(requirement, assurance) {
    return requirement.tests.filter((test)=>test.assurance_decision_id === assurance.id);
}
function traceabilitySummary(data) {
    const coverage = new Map();
    for (const row of data.traceability.rows){
        const key = text(row.requirement_id);
        if (key && !coverage.has(key)) coverage.set(key, text(row.coverage_status));
    }
    const items = sortedRequirements(data);
    for (const item of items){
        const key = requirementKey(item);
        if (!coverage.has(key)) coverage.set(key, "uncovered");
    }
    const orphanCounts = {
        O1: 0,
        O2: 0,
        O3: 0,
        total: data.orphans.length
    };
    for (const orphan of data.orphans){
        if (orphan.type === "O1" || orphan.type === "O2" || orphan.type === "O3") {
            orphanCounts[orphan.type] += 1;
        }
    }
    return {
        requirements: items.length,
        covered_by_tests: [
            ...coverage.values()
        ].filter((value)=>value === "covered_by_tests").length,
        covered_by_assurance: [
            ...coverage.values()
        ].filter((value)=>value === "covered_by_assurance").length,
        uncovered: [
            ...coverage.values()
        ].filter((value)=>value === "uncovered").length,
        stale: [
            ...coverage.values()
        ].filter((value)=>value === "stale").length,
        rows: data.traceability.rows.length,
        stale_rows: data.traceability.rows.filter((row)=>row.stale === true).length,
        orphans: orphanCounts
    };
}
function coverageLabel(value) {
    switch(text(value)){
        case "covered_by_tests":
            return "Covered by tests";
        case "covered_by_assurance":
            return "Covered by assurance";
        case "uncovered":
            return "Uncovered";
        case "stale":
            return "Stale coverage";
        default:
            return text(value) || "Not recorded";
    }
}
function parseTestScript(script) {
    const raw = script || "";
    const preconditionsMatch = /(^|\n)\s*preconditions?\s*:/i.exec(raw);
    const stepsMatch = /(^|\n)\s*(test\s+steps?|steps?)\s*:/i.exec(raw);
    let preconditions = "";
    let stepsText = "";
    if (preconditionsMatch && stepsMatch && stepsMatch.index > preconditionsMatch.index) {
        const preStart = preconditionsMatch.index + preconditionsMatch[0].length;
        preconditions = raw.slice(preStart, stepsMatch.index).trim();
        stepsText = raw.slice(stepsMatch.index + stepsMatch[0].length).trim();
    } else if (stepsMatch) {
        stepsText = raw.slice(stepsMatch.index + stepsMatch[0].length).trim();
    } else {
        return {
            preconditions: "",
            steps: [],
            raw,
            parsed: false
        };
    }
    const stepLines = stepsText.split(/\r?\n/);
    const steps = [];
    let current = null;
    for (const line of stepLines){
        const match = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
        if (match) {
            if (current) steps.push(current);
            const body = match[2].trim();
            const expectedMatch = /(?:expected(?:\s+result)?|expected:)\s*[:\-]?\s*(.*)$/i.exec(body);
            if (expectedMatch) {
                current = {
                    number: Number(match[1]),
                    action: body.slice(0, expectedMatch.index).replace(/[\s:;-]+$/, "").trim(),
                    expected: expectedMatch[1].trim() || "Not recorded"
                };
            } else {
                current = {
                    number: Number(match[1]),
                    action: body,
                    expected: "Not recorded"
                };
            }
        } else if (current && line.trim()) {
            current.action = `${current.action}\n${line.trim()}`;
        }
    }
    if (current) steps.push(current);
    if (!steps.length) {
        return {
            preconditions,
            steps: [],
            raw,
            parsed: false
        };
    }
    return {
        preconditions,
        steps,
        raw,
        parsed: true
    };
}
function orphanEntityRef(refs, orphan) {
    if (orphan.entity_type === "test") {
        return refs.testRefs.get(orphan.entity_id) || orphan.entity_key || "Test script";
    }
    if (orphan.entity_type === "risk") {
        return refs.riskRefs.get(orphan.entity_id) || orphan.entity_key || "Risk assessment";
    }
    return refs.requirementRefs.get(orphan.entity_id) || orphan.entity_key || "Requirement";
}
function orphanRequirement(refs, data, orphan) {
    let requirementId = "";
    if (orphan.entity_type === "requirement") {
        requirementId = orphan.entity_id;
    } else if (orphan.entity_type === "risk") {
        requirementId = refs.requirementForRisk.get(orphan.entity_id) || "";
    } else if (orphan.entity_type === "test") {
        requirementId = refs.requirementForTest.get(orphan.entity_id) || "";
    }
    if (!requirementId) return null;
    return requirementForReference(refs, requirementId, data);
}
function gapCategoryForOrphan(orphan) {
    if (orphan.type === "O1") return "Requirement coverage gap";
    if (orphan.type === "O2") return "Orphaned test script";
    if (orphan.type === "O3") return "Risk without fresh assurance";
    return "Traceability finding";
}
function gapRecommendationForOrphan(orphan) {
    if (orphan.reason === "scripted_no_tests") {
        return "Create or import a test script and link it to the requirement before relying on this pack.";
    }
    if (orphan.reason === "no_assurance") {
        return "Run the assurance decision workflow for the current risk assessment.";
    }
    if (orphan.reason === "stale_only") {
        return "Re-run the affected analysis and traceability synchronization so fresh artifacts cover the requirement.";
    }
    if (orphan.reason === "not_analyzed") {
        return "Run the risk assessment workflow for the current requirement version.";
    }
    if (orphan.type === "O2") {
        return "Link the test script to the intended requirement or retire the orphaned script.";
    }
    return "Review the traceability record and restore the missing active link.";
}
function gapClosureForOrphan(orphan) {
    if (orphan.type === "O2") {
        return "An active verifies link connects the test script to the selected requirement.";
    }
    if (orphan.type === "O3") {
        return "A fresh assurance decision is reachable from the risk assessment through an active trace link.";
    }
    return "Fresh coverage exists: either a fresh linked test or a fresh exploratory/unscripted assurance decision.";
}
function deriveGapFindings(data, refs = buildReportReferences(data)) {
    const findings = [];
    const seen = new Set();
    const add = (finding)=>{
        const key = [
            finding.category,
            finding.requirementRef,
            finding.related.join(","),
            finding.finding
        ].join("|");
        if (seen.has(key)) return;
        seen.add(key);
        findings.push({
            id: "",
            ...finding
        });
    };
    const orphanReasons = new Map();
    for (const orphan of data.orphans){
        const requirement = orphanRequirement(refs, data, orphan);
        const reqRef = requirement ? refs.requirementRefs.get(requirement.id) || requirementKey(requirement) : "Unlinked";
        if (!orphanReasons.has(reqRef)) orphanReasons.set(reqRef, new Set());
        orphanReasons.get(reqRef)?.add(orphan.reason);
        add({
            category: gapCategoryForOrphan(orphan),
            requirementRef: reqRef,
            requirementVersion: requirement?.version ? `Version ${requirement.version}` : "Not recorded",
            related: [
                orphanEntityRef(refs, orphan)
            ],
            finding: orphan.detail,
            source: `Traceability ${orphan.type} · ${orphan.reason}`,
            recommendation: gapRecommendationForOrphan(orphan),
            status: "Derived finding",
            closureEvidence: gapClosureForOrphan(orphan)
        });
    }
    for (const requirement of sortedRequirements(data)){
        const reqRef = refs.requirementRefs.get(requirement.id) || requirementKey(requirement);
        const version = requirement.version ? `Version ${requirement.version}` : "Not recorded";
        const reasons = orphanReasons.get(reqRef) || new Set();
        const hasReason = (...values)=>values.some((value)=>reasons.has(value));
        if (!requirement.version_id) {
            add({
                category: "Requirement version",
                requirementRef: reqRef,
                requirementVersion: "Not recorded",
                related: [],
                finding: "No current requirement version is stored for this requirement.",
                source: "Requirement record",
                recommendation: "Restore or create a current requirement version before exporting this requirement.",
                status: "Derived finding",
                closureEvidence: "A current RequirementVersion exists and is selected for export."
            });
        }
        if (!requirement.risks.length && !hasReason("not_analyzed")) {
            add({
                category: "Missing risk assessment",
                requirementRef: reqRef,
                requirementVersion: version,
                related: [],
                finding: "No risk assessment is stored for the current requirement version.",
                source: "Validation-pack dataset",
                recommendation: "Run the risk assessment workflow for this requirement version.",
                status: "Derived finding",
                closureEvidence: "A risk assessment is stored for the current requirement version."
            });
        }
        if (!requirement.assurance.length) {
            if (!hasReason("no_assurance", "not_analyzed", "stale_only")) {
                add({
                    category: "Missing assurance decision",
                    requirementRef: reqRef,
                    requirementVersion: version,
                    related: requirement.risks.map((risk)=>riskReference(refs, risk.id)),
                    finding: "No assurance decision is stored for the current requirement version.",
                    source: "Validation-pack dataset",
                    recommendation: "Run the assurance workflow for the current risk assessment.",
                    status: "Derived finding",
                    closureEvidence: "A fresh assurance decision is stored for the risk assessment."
                });
            }
        }
        for (const risk of requirement.risks){
            const riskRef = riskReference(refs, risk.id);
            if (risk.freshness === "stale" || risk.freshness === "superseded") {
                if (!hasReason("stale_only")) {
                    add({
                        category: risk.freshness === "stale" ? "Stale risk assessment" : "Superseded risk assessment",
                        requirementRef: reqRef,
                        requirementVersion: version,
                        related: [
                            riskRef
                        ],
                        finding: `The risk assessment freshness is ${risk.freshness}.`,
                        source: `Risk assessment ${riskRef}`,
                        recommendation: "Re-run the risk assessment for the current requirement version and preserve the historical record.",
                        status: "Derived finding",
                        closureEvidence: "A fresh risk assessment is linked to the selected requirement version."
                    });
                }
            }
            if (risk.severity === null || risk.probability === null || risk.detectability === null) {
                add({
                    category: "Incomplete risk assessment",
                    requirementRef: reqRef,
                    requirementVersion: version,
                    related: [
                        riskRef
                    ],
                    finding: "One or more risk scoring sub-results are missing.",
                    source: `Risk assessment ${riskRef}`,
                    recommendation: "Complete the severity, probability, and detectability results before relying on the assessment.",
                    status: "Derived finding",
                    closureEvidence: "All three scoring results and the deterministic rule trace are stored."
                });
            }
        }
        for (const assurance of requirement.assurance){
            const assuranceRef = assuranceReference(refs, assurance.id);
            const risk = relatedRiskForAssurance(requirement, assurance);
            const riskRef = risk ? riskReference(refs, risk.id) : "Risk reference unavailable";
            if (assurance.freshness === "stale" || assurance.freshness === "superseded") {
                if (!hasReason("stale_only")) {
                    add({
                        category: assurance.freshness === "stale" ? "Stale assurance decision" : "Superseded assurance decision",
                        requirementRef: reqRef,
                        requirementVersion: version,
                        related: [
                            assuranceRef,
                            riskRef
                        ],
                        finding: `The assurance decision freshness is ${assurance.freshness}.`,
                        source: `Assurance decision ${assuranceRef}`,
                        recommendation: "Re-run the assurance decision for the current risk assessment and preserve the historical record.",
                        status: "Derived finding",
                        closureEvidence: "A fresh assurance decision is linked to the current risk assessment."
                    });
                }
            }
            if (assurance.generate_test && !testsForAssurance(requirement, assurance).length) {
                if (!hasReason("scripted_no_tests")) {
                    add({
                        category: "Required test script missing",
                        requirementRef: reqRef,
                        requirementVersion: version,
                        related: [
                            assuranceRef,
                            riskRef
                        ],
                        finding: "The assurance decision requests test generation, but no test script is linked to it.",
                        source: `Assurance decision ${assuranceRef}`,
                        recommendation: "Generate or import a test script and associate it with the assurance decision.",
                        status: "Derived finding",
                        closureEvidence: "At least one test script is linked to the assurance decision."
                    });
                }
            }
        }
        for (const test of requirement.tests){
            const testRef = testReference(refs, test.id);
            if (test.freshness === "stale" || test.freshness === "superseded") {
                if (!hasReason("stale_only")) {
                    add({
                        category: test.freshness === "stale" ? "Stale test script" : "Superseded test script",
                        requirementRef: reqRef,
                        requirementVersion: version,
                        related: [
                            testRef
                        ],
                        finding: `The test script freshness is ${test.freshness}.`,
                        source: `Test script ${testRef}`,
                        recommendation: "Review or regenerate the test script for the current requirement version.",
                        status: "Derived finding",
                        closureEvidence: "A fresh test script is linked to the selected requirement version."
                    });
                }
            }
        }
        if (!requirement.compliance.length) {
            add({
                category: "Compliance evaluation not recorded",
                requirementRef: reqRef,
                requirementVersion: version,
                related: [],
                finding: "No persisted compliance result is available for this requirement version. This is an absence of a record, not a compliance verdict.",
                source: "ComplianceResult read path",
                recommendation: "Evaluate the applicable compliance topics if the validation scope requires a compliance conclusion.",
                status: "Derived finding",
                closureEvidence: "A persisted ComplianceResult exists for the selected requirement version."
            });
        } else {
            for (const record of requirement.compliance){
                const status = text(record.status).toUpperCase();
                if (status !== "COMPLIANT" && status !== "NOT_APPLICABLE") {
                    add({
                        category: "Persisted compliance result",
                        requirementRef: reqRef,
                        requirementVersion: version,
                        related: [],
                        finding: `${record.framework} ${record.clause}: stored status is ${text(record.status) || "Not recorded"} with coverage ${formatConfidence(record.coverage)}.`,
                        source: `Compliance result for ${record.framework} ${record.clause}`,
                        recommendation: "Review the persisted compliance result and its reasoning against the applicable framework.",
                        status: "Persisted compliance result",
                        closureEvidence: "A subsequent persisted compliance result reflects the reviewed position; this export does not create one."
                    });
                }
            }
        }
    }
    for (const change of data.changes){
        const status = text(change.status).toLowerCase();
        if (status !== "open" && status !== "reanalyzed") continue;
        const requirement = data.requirements.find((item)=>item.id === change.requirement_id);
        if (!requirement) continue;
        const reqRef = refs.requirementRefs.get(requirement.id) || requirementKey(requirement);
        add({
            category: "Unresolved change event",
            requirementRef: reqRef,
            requirementVersion: requirement.version ? `Version ${requirement.version}` : "Not recorded",
            related: [],
            finding: `Change event status is ${text(change.status) || "Not recorded"}${change.kind ? ` (${change.kind})` : ""}.`,
            source: `Change event dated ${formatDateTime(change.created_at)}`,
            recommendation: "Resolve or reanalyse the change and synchronize the affected traceability records.",
            status: "Derived finding",
            closureEvidence: "The change event is resolved and the affected current-version records have been reanalysed."
        });
    }
    findings.sort((a, b)=>stableCompare(a.requirementRef, b.requirementRef) || stableCompare(a.category, b.category) || stableCompare(a.finding, b.finding));
    return findings.map((finding, index)=>({
            ...finding,
            id: `GAP-${String(index + 1).padStart(3, "0")}`
        }));
}
function filterRequirements(requirements, query) {
    const needle = query.trim().toLowerCase();
    if (!needle) return requirements;
    return requirements.filter((requirement)=>{
        const haystack = [
            requirementKey(requirement),
            requirement.req_key,
            requirement.title,
            requirement.requirement_title,
            requirement.text,
            requirement.status
        ].map((value)=>text(value).toLowerCase()).join(" ");
        return haystack.includes(needle);
    });
}
function matrixToCsv(data) {
    const columns = data.traceability.columns.length ? data.traceability.columns : [
        "requirement_id",
        "requirement_version",
        "risk_id",
        "severity",
        "probability",
        "detectability",
        "rpn_points",
        "rpn",
        "band",
        "assurance_level",
        "assurance_label",
        "reason_code",
        "test_id",
        "test_title",
        "test_origin",
        "coverage_status",
        "stale",
        "orphan_flags"
    ];
    const escape = (value)=>{
        const raw = typeof value === "boolean" ? value ? "true" : "false" : text(value);
        if (/[",\r\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
        return raw;
    };
    const lines = [
        columns.join(",")
    ];
    for (const row of data.traceability.rows){
        lines.push(columns.map((column)=>escape(row[column])).join(","));
    }
    return `${lines.join("\n")}\n`;
}
function matrixToReadableCsv(data) {
    const columns = [
        [
            "Requirement",
            "requirement_id"
        ],
        [
            "Version",
            "requirement_version"
        ],
        [
            "Risk reference",
            "risk_id"
        ],
        [
            "Severity",
            "severity"
        ],
        [
            "Probability",
            "probability"
        ],
        [
            "Detectability",
            "detectability"
        ],
        [
            "RPN points",
            "rpn_points"
        ],
        [
            "Normalized RPN",
            "rpn"
        ],
        [
            "Risk band",
            "band"
        ],
        [
            "Assurance level",
            "assurance_level"
        ],
        [
            "Assurance label",
            "assurance_label"
        ],
        [
            "Reason code",
            "reason_code"
        ],
        [
            "Test reference",
            "test_id"
        ],
        [
            "Test title",
            "test_title"
        ],
        [
            "Test origin",
            "test_origin"
        ],
        [
            "Coverage status",
            "coverage_status"
        ],
        [
            "Stale",
            "stale"
        ],
        [
            "Orphan flags",
            "orphan_flags"
        ]
    ];
    const escape = (value)=>{
        const raw = typeof value === "boolean" ? value ? "Yes" : "No" : text(value);
        return /[",\r\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
    };
    const display = (key, value)=>{
        if (key === "coverage_status") return coverageLabel(value);
        if (key === "assurance_level") return assuranceLevelLabel(value);
        if (key === "band") return riskBandLabel(value);
        if (key === "orphan_flags") return text(value).replace(/;/g, ", ");
        return value;
    };
    return [
        columns.map(([header])=>escape(header)).join(","),
        ...data.traceability.rows.map((row)=>columns.map(([, key])=>escape(display(key, row[key]))).join(",")),
        ""
    ].join("\n");
}
function buildMetadataCrosswalk(data, refs) {
    return {
        pack_reference: refs.packReference,
        generated_at: data.generated_at,
        version_selection: "Current version per requirement",
        note: "Report references are scoped to this export pack. Database identifiers are retained in this machine-readable crosswalk only and are not displayed in the reader-facing PDFs.",
        requirements: sortedRequirements(data).map((requirement)=>({
                report_reference: refs.requirementRefs.get(requirement.id),
                requirement_id: requirement.id,
                requirement_key: requirement.req_key,
                display_key: requirementKey(requirement),
                title: requirementDisplayTitle(requirement),
                version: requirement.version,
                version_id: requirement.version_id,
                status: requirement.status,
                risks: requirement.risks.map((risk, index)=>({
                        report_reference: refs.riskRefs.get(risk.id),
                        risk_assessment_id: risk.id,
                        evidence_id: risk.evidence_id,
                        evidence_report_reference: refs.evidenceRefs.get(risk.evidence_id),
                        sort_index: index
                    })),
                assurance_decisions: requirement.assurance.map((assurance)=>({
                        report_reference: refs.assuranceRefs.get(assurance.id),
                        assurance_decision_id: assurance.id,
                        risk_assessment_id: assurance.risk_assessment_id,
                        risk_report_reference: refs.riskRefs.get(assurance.risk_assessment_id)
                    })),
                test_scripts: requirement.tests.map((test)=>({
                        report_reference: refs.testRefs.get(test.id),
                        test_script_id: test.id,
                        assurance_decision_id: test.assurance_decision_id
                    })),
                evidence_records: requirement.evidence.map((evidence)=>({
                        report_reference: refs.evidenceRefs.get(evidence.id),
                        evidence_id: evidence.id
                    }))
            }))
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_1gsocae._.js.map