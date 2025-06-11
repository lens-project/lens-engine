import { Hono } from "@hono/hono";

const router = new Hono();

router.get("/", (c) => {
  const requestId = c.res.headers.get("X-Request-ID") || crypto.randomUUID();

  return c.json({
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
    data: {
      message: "hello",
    },
  });
});

export default router;
