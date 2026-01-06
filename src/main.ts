// src/main.ts
import "./style.css";
import { App } from "./app";

const app = new App();
try {
  await app.bootstrap();
} catch (error) {
  console.error("Failed to bootstrap app:", error);
}
