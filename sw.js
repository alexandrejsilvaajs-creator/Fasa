const CACHE_NAME = 'fasa-shell-v1';
const SHELL_FILES = ['./manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Página principal (HTML) e navegação: NUNCA usa cache — sempre busca a versão mais nova,
  // pra garantir que atualizações apareçam assim que forem publicadas.
  const isNavegacao = event.request.mode === 'navigate' || event.request.destination === 'document';
  if (isNavegacao) {
    event.respondWith(fetch(event.request).catch(() => caches.match('./manifest.json')));
    return;
  }
  // Outros arquivos (ícones, manifest): busca da rede, guarda cópia, usa cache só se ficar offline.
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
