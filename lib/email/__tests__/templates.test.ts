import { describe, it, expect } from "vitest";
import { buildRainAlertEmail } from "../templates";

describe("buildRainAlertEmail", () => {
  const baseData = {
    locationName: "London, UK",
    minutesUntilRain: 15,
    rainStartTime: "Mon, Jun 16, 2:15 PM",
    probability: 80,
    confidence: 75,
    appUrl: "http://localhost:3000",
  };

  it("returns subject 'Rain expected soon'", () => {
    const { subject } = buildRainAlertEmail(baseData);
    expect(subject).toBe("Rain expected soon");
  });

  it("includes location name in text body", () => {
    const { text } = buildRainAlertEmail(baseData);
    expect(text).toContain("London, UK");
  });

  it("includes minutes until rain in text body", () => {
    const { text } = buildRainAlertEmail(baseData);
    expect(text).toContain("15 minutes");
  });

  it("includes probability in text body", () => {
    const { text } = buildRainAlertEmail(baseData);
    expect(text).toContain("80%");
  });

  it("includes confidence in text body", () => {
    const { text } = buildRainAlertEmail(baseData);
    expect(text).toContain("75/100");
  });

  it("includes app URL in text body", () => {
    const { text } = buildRainAlertEmail(baseData);
    expect(text).toContain("http://localhost:3000/locations");
  });

  it("includes location name in HTML body", () => {
    const { html } = buildRainAlertEmail(baseData);
    expect(html).toContain("London, UK");
  });

  it("includes rain start time in HTML body", () => {
    const { html } = buildRainAlertEmail(baseData);
    expect(html).toContain("Mon, Jun 16, 2:15 PM");
  });

  it("includes the 'take an umbrella' message in text", () => {
    const { text } = buildRainAlertEmail(baseData);
    expect(text).toContain("Take an umbrella");
  });

  it("includes the 'take an umbrella' message in HTML", () => {
    const { html } = buildRainAlertEmail(baseData);
    expect(html).toContain("Take an umbrella");
  });

  it("generates valid HTML with a CTA link", () => {
    const { html } = buildRainAlertEmail(baseData);
    expect(html).toContain('href="http://localhost:3000/locations"');
    expect(html).toContain("View on RainGuard");
  });

  it("handles 1 minute until rain", () => {
    const { text } = buildRainAlertEmail({ ...baseData, minutesUntilRain: 1 });
    expect(text).toContain("1 minutes");
  });

  it("handles high probability gracefully", () => {
    const { html } = buildRainAlertEmail({ ...baseData, probability: 100 });
    expect(html).toContain("100%");
  });
});
