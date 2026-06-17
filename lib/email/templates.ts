export interface RainAlertEmailData {
  locationName: string;
  minutesUntilRain: number;
  rainStartTime: string;
  probability: number;
  confidence: number;
  appUrl: string;
}

export function buildRainAlertEmail(data: RainAlertEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `☔ Rain expected near ${data.locationName}`;

  const text = [
    `Rain is expected near ${data.locationName} in approximately ${data.minutesUntilRain} minutes.`,
    "",
    "Take an umbrella if you are heading out.",
    "",
    `Expected rain: ${data.rainStartTime}`,
    `Probability: ${data.probability}%`,
    `Confidence: ${data.confidence}/100`,
    "",
    `View details: ${data.appUrl}/locations`,
    "",
    "RainGuard - Smart Rainfall Monitoring",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:24px auto">
    <tr>
      <td style="background:#2563eb;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">RainGuard</h1>
        <p style="color:#93c5fd;margin:4px 0 0;font-size:14px">Rainfall Monitoring System</p>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
        <h2 style="color:#111827;margin:0 0 16px;font-size:20px">Rain expected soon</h2>
        <p style="color:#374151;margin:0 0 8px;font-size:15px;line-height:1.6">
          Rain is expected near <strong style="color:#111827">${data.locationName}</strong> in approximately
          <strong style="color:#2563eb">${data.minutesUntilRain} minutes</strong>.
        </p>
        <p style="color:#374151;margin:0 0 24px;font-size:15px;line-height:1.6">
          Take an umbrella if you are heading out.
        </p>
        <table style="background:#f3f4f6;padding:16px;border-radius:8px;width:100%">
          <tr>
            <td style="padding:4px 16px 4px 0;font-size:14px;color:#6b7280;white-space:nowrap">Expected rain</td>
            <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:500">${data.rainStartTime}</td>
          </tr>
          <tr>
            <td style="padding:4px 16px 4px 0;font-size:14px;color:#6b7280;white-space:nowrap">Probability</td>
            <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:500">${data.probability}%</td>
          </tr>
          <tr>
            <td style="padding:4px 16px 4px 0;font-size:14px;color:#6b7280;white-space:nowrap">Confidence</td>
            <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:500">${data.confidence}/100</td>
          </tr>
        </table>
        <p style="margin:24px 0 0">
          <a href="${data.appUrl}/locations" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:500">
            View on RainGuard
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f9fafb;padding:20px 32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;border-top:none;text-align:center">
        <p style="color:#9ca3af;margin:0;font-size:12px">RainGuard &mdash; Smart Rainfall Monitoring</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
