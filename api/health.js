// Vercel serverless health endpoint for the isolated Intelligent AI backend.
// This endpoint does not read or modify the existing frontend or its data.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  return res.status(200).json({
    ok: true,
    service: "intelligent-ai-backend",
    version: "0.1.0",
    deployment: "backend-only"
  });
}
