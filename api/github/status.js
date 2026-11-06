// Reports configuration readiness only. Never returns credential values.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const appConfigured = Boolean(
    process.env.GITHUB_APP_ID &&
    process.env.GITHUB_APP_PRIVATE_KEY &&
    process.env.GITHUB_APP_INSTALLATION_ID
  );
  return res.status(200).json({
    ok: true,
    provider: "github",
    authentication: "github-app",
    configured: appConfigured,
    permissions: appConfigured ? "server-side app credentials detected" : "setup required",
    tokenStoredInBrowser: false,
    personalAccessTokenRequired: false,
    repository: "BahuBali1111/intelligent-AI",
    writeMode: "not enabled until explicit server-side setup and approval"
  });
}
