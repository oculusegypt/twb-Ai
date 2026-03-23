import { Router } from "express";
import https from "https";
import http from "http";

const router = Router();

router.get("/audio-proxy/quran/:reciter/:file", (req, res) => {
  const { reciter, file } = req.params;
  if (!file?.endsWith(".mp3") || !reciter) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const url = `https://cdn.islamic.network/quran/audio/128/${reciter}/${file}`;
  const get = url.startsWith("https") ? https.get : http.get;
  get(url, (upstream) => {
    if (upstream.statusCode && upstream.statusCode >= 400) {
      res.status(upstream.statusCode ?? 502).end();
      return;
    }
    res.setHeader("Content-Type", upstream.headers["content-type"] ?? "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (upstream.headers["content-length"]) {
      res.setHeader("Content-Length", upstream.headers["content-length"]);
    }
    upstream.pipe(res);
  }).on("error", () => {
    res.status(502).end();
  });
});

export default router;
