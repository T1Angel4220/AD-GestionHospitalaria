import { app } from "./app";

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`[SERVER] listening :${PORT}`);
  console.log("[ROUTER] /api montado");
});
