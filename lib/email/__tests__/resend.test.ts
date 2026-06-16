import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ResendClient } from "../resend";

const { MockResend } = vi.hoisted(() => {
  class MockResend {
    emails: { send: ReturnType<typeof vi.fn> };
    constructor(_apiKey: string) {
      this.emails = {
        send: vi.fn(),
      };
    }
  }
  return { MockResend };
});

vi.mock("resend", () => ({
  Resend: MockResend,
}));

describe("ResendClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("throws if no API key provided", () => {
    expect(
      () => new ResendClient({ apiKey: "", fromAddress: "test@example.com" })
    ).toThrow("Resend API key is required");
  });

  it("throws if no fromAddress provided", () => {
    expect(
      () => new ResendClient({ apiKey: "re_123", fromAddress: "" })
    ).toThrow("Resend fromAddress is required");
  });

  it("sends email successfully", async () => {
    const client = new ResendClient({
      apiKey: "re_123",
      fromAddress: "rainguard@example.com",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).client.emails.send.mockResolvedValue({
      data: { id: "mock-email-id-123" },
      error: null,
    });

    const result = await client.sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>test</p>",
      text: "test",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("mock-email-id-123");
  });

  it("returns error result when send fails", async () => {
    const client = new ResendClient({
      apiKey: "re_123",
      fromAddress: "rainguard@example.com",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).client.emails.send.mockResolvedValue({
      data: null,
      error: { message: "Rate limit exceeded" },
    });

    const result = await client.sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>test</p>",
      text: "test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Rate limit exceeded");
  });

  it("retries on failure and returns error after retries exhausted", async () => {
    const client = new ResendClient({
      apiKey: "re_123",
      fromAddress: "rainguard@example.com",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).client.emails.send.mockRejectedValue(
      new TypeError("fetch failed")
    );

    const promise = client.sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>test</p>",
      text: "test",
    });

    await vi.advanceTimersByTimeAsync(100000);
    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.error).toBe("fetch failed");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((client as any).client.emails.send).toHaveBeenCalledTimes(3);
  });
});
