// Sample Vitest test to demonstrate it's working
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

// Simple test component
function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} type="button">
      {children}
    </button>
  );
}

describe("Vitest Integration Test", () => {
  it("should render a button", () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("should call onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should work with async operations", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ data: "test" }),
      })
    );

    global.fetch = mockFetch as any;

    const result = await fetch("/api/test").then((r) => r.json());

    expect(result).toEqual({ data: "test" });
    expect(mockFetch).toHaveBeenCalled();
  });

  it("should demonstrate Vitest speed", () => {
    // Vitest runs this incredibly fast!
    const start = Date.now();
    const numbers = Array.from({ length: 1000 }, (_, i) => i);
    const sum = numbers.reduce((a, b) => a + b, 0);
    const end = Date.now();

    expect(sum).toBe(499500);
    expect(end - start).toBeLessThan(100); // Should be nearly instant
  });
});
