// Service Worker básico para evitar erro 404
// Este arquivo existe apenas para evitar o erro 404 quando o navegador tenta acessar /sw.js

// Não faz nada, apenas evita o erro 404
self.addEventListener("install", () => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  // Claim all clients immediately
  self.clients.claim();
});

self.addEventListener("fetch", () => {
  // Não intercepta nenhuma requisição - deixa o navegador lidar normalmente
  return;
});
