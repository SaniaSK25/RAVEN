import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";

Object.defineProperty(globalThis, "TextEncoder", { value: TextEncoder });
Object.defineProperty(globalThis, "TextDecoder", { value: TextDecoder });

jest.mock("html2canvas", () => ({
  __esModule: true,
  default: jest.fn(async () => document.createElement("canvas")),
}));
