import { describe, it, expect, vi } from "vitest";
import { formatTime, generateShareId, debounce } from "@/lib/utils";

describe("formatTime", () => {
  it("formats zero correctly", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  it("formats seconds only", () => {
    expect(formatTime(45)).toBe("0:45");
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(125)).toBe("2:05");
  });

  it("formats exactly one minute", () => {
    expect(formatTime(60)).toBe("1:00");
  });

  it("pads single-digit seconds", () => {
    expect(formatTime(61)).toBe("1:01");
  });

  it("handles large values", () => {
    expect(formatTime(3600)).toBe("60:00");
  });
});

describe("generateShareId", () => {
  it("returns an 8-character string", () => {
    const id = generateShareId();
    expect(id).toHaveLength(8);
  });

  it("returns alphanumeric characters", () => {
    const id = generateShareId();
    expect(id).toMatch(/^[a-f0-9-]+$/);
  });

  it("generates unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateShareId()));
    expect(ids.size).toBe(100);
  });
});

describe("debounce", () => {
  it("calls the function after the specified delay", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("cancels previous calls when invoked again within delay", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(200);

    debounced();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("passes arguments to the original function", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("a", 1);
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith("a", 1);
    vi.useRealTimers();
  });
});
