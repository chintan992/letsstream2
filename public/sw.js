if (!self.define) {
  let s,
    e = {};
  const i = (i, n) => (
    (i = new URL(i + ".js", n).href),
    e[i] ||
      new Promise(e => {
        if ("document" in self) {
          const s = document.createElement("script");
          ((s.src = i), (s.onload = e), document.head.appendChild(s));
        } else ((s = i), importScripts(i), e());
      }).then(() => {
        let s = e[i];
        if (!s) throw new Error(`Module ${i} didn’t register its module`);
        return s;
      })
  );
  self.define = (n, r) => {
    const l =
      s ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (e[l]) return;
    let a = {};
    const o = s => i(s, l),
      t = { module: { uri: l }, exports: a, require: o };
    e[l] = Promise.all(n.map(s => t[s] || o(s))).then(s => (r(...s), a));
  };
}
define(["./workbox-4cded710"], function (s) {
  "use strict";
  (s.enable(),
    self.skipWaiting(),
    s.clientsClaim(),
    s.precacheAndRoute(
      [
        {
          url: "apple-icon-180.png",
          revision: "78c33c287dc4c8130d3596826ceb6fdb",
        },
        { url: "assets/avatar-C2BCovJQ.js", revision: null },
        { url: "assets/ContentRemoval-BDX2YKDq.js", revision: null },
        { url: "assets/ContentRow-CPYJ0JhZ.js", revision: null },
        { url: "assets/data-visualization-D16Qyb6g.js", revision: null },
        { url: "assets/DMCANotice-CTLQopw1.js", revision: null },
        { url: "assets/en-US-wfBU2YNu.js", revision: null },
        { url: "assets/firebase-auth-Dui5qcX-.js", revision: null },
        { url: "assets/Footer-OmBEpHAi.js", revision: null },
        { url: "assets/format-CKHqWWuY.js", revision: null },
        { url: "assets/formatDistanceToNow-3UBXKcFR.js", revision: null },
        { url: "assets/icons-DEdE-P6L.js", revision: null },
        { url: "assets/Index-B6psmTuU.js", revision: null },
        { url: "assets/index-BGO9EYld.js", revision: null },
        { url: "assets/index-CgeXZHYO.js", revision: null },
        { url: "assets/index-DTpBcGZk.css", revision: null },
        { url: "assets/index-NyEuOLrx.js", revision: null },
        { url: "assets/index-tXW-eHMy.js", revision: null },
        { url: "assets/Login-och1wTrt.js", revision: null },
        { url: "assets/MediaCard-3EWDXKdR.js", revision: null },
        { url: "assets/MediaGrid-DrYN8nQr.js", revision: null },
        { url: "assets/MediaSkeleton-D--XtCNt.js", revision: null },
        { url: "assets/MovieDetails-CHA8sSMY.js", revision: null },
        { url: "assets/Movies--cK3InYN.js", revision: null },
        { url: "assets/movies-DihOabGN.js", revision: null },
        { url: "assets/Navbar-CM6EFjd8.js", revision: null },
        { url: "assets/NotFound-qaCEl9Wu.js", revision: null },
        { url: "assets/PageTransition-BLTxWYtv.js", revision: null },
        { url: "assets/Player-Dy6wh76q.js", revision: null },
        { url: "assets/PrivacyPolicy-CcOApImm.js", revision: null },
        { url: "assets/Profile-HK2fS6Ez.js", revision: null },
        { url: "assets/react-vendor-CUPrMTU-.js", revision: null },
        { url: "assets/ReviewSection-CYlf1qgk.js", revision: null },
        { url: "assets/Search-BOtgGHTf.js", revision: null },
        { url: "assets/SecondaryContent-VIGsWk-l.js", revision: null },
        { url: "assets/separator-Bq9ji08x.js", revision: null },
        { url: "assets/Signup-CMQiEGC2.js", revision: null },
        { url: "assets/SportMatch-D1Mxvi9g.js", revision: null },
        { url: "assets/SportMatchPlayer-DUAOKjpi.js", revision: null },
        { url: "assets/sports-api-XYPbbegy.js", revision: null },
        { url: "assets/Sports-CQjhMDGg.js", revision: null },
        { url: "assets/TermsOfService-C45TKRKV.js", revision: null },
        { url: "assets/Trending-Ds3zWaFu.js", revision: null },
        { url: "assets/trending-DvJsbhSq.js", revision: null },
        { url: "assets/tv-DoLy2h2g.js", revision: null },
        { url: "assets/TVDetails-Ch-gEtsi.js", revision: null },
        { url: "assets/ui-components-w_QqZSfp.js", revision: null },
        { url: "assets/useQuery-CLE2877f.js", revision: null },
        { url: "assets/video-sources-CeOFKngD.js", revision: null },
        { url: "assets/watch-history-PUuQtamw.js", revision: null },
        { url: "assets/WatchHistory-B9BXvvdJ.js", revision: null },
        { url: "favicon.ico", revision: "1c29dd2a7ba58b92cd9a31771741db02" },
        {
          url: "iframe-proxy-sw.js",
          revision: "1e61c6432dab544b8f707c6727e9225d",
        },
        { url: "index.html", revision: "f03b36863e84fa87aef66b3ed096d65f" },
        {
          url: "manifest-icon-192.maskable.png",
          revision: "cd249b2a4608f21a123c1182546f0c53",
        },
        {
          url: "manifest-icon-512.maskable.png",
          revision: "b14ccf1effd171a797b8d033dd55867f",
        },
        { url: "manifest.json", revision: "6a487612e3d5d14a4fde3f8969dd4d68" },
        { url: "offline.html", revision: "77345e15c929c1097b9ecec4d0c590d5" },
        {
          url: "placeholder.svg",
          revision: "4f5971b1402ef510ad31e8d0e816ebbe",
        },
        { url: "registerSW.js", revision: "4492e38a5068c9341e38fa79ec9af8d1" },
        {
          url: "screenshots/1.png",
          revision: "a3ed003ae509e7e935ac17fe06083123",
        },
        {
          url: "screenshots/2.png",
          revision: "26bcdd3bc1e8443f118c40078f367eda",
        },
        {
          url: "screenshots/3.png",
          revision: "459086e6b3bef2edacdb0dfb4245727a",
        },
        {
          url: "sw-analytics.js",
          revision: "3abbfea453146743477db5e6b15b03b0",
        },
        { url: "sw-core.js", revision: "a4572d06909d612633b964604cbeb414" },
        { url: "sw-logging.js", revision: "2c5cad85f01ea2cdecadd60cdd0fd1fe" },
        { url: "sw-network.js", revision: "1f53c35f9bede9b8a7cdb369a0b28257" },
        {
          url: "sw-performance.js",
          revision: "601f39d9c9faae58ed77a8cf941bcdca",
        },
        {
          url: "apple-icon-180.png",
          revision: "78c33c287dc4c8130d3596826ceb6fdb",
        },
        { url: "favicon.ico", revision: "1c29dd2a7ba58b92cd9a31771741db02" },
        {
          url: "manifest-icon-192.maskable.png",
          revision: "cd249b2a4608f21a123c1182546f0c53",
        },
        {
          url: "manifest-icon-512.maskable.png",
          revision: "b14ccf1effd171a797b8d033dd55867f",
        },
        { url: "offline.html", revision: "77345e15c929c1097b9ecec4d0c590d5" },
        {
          url: "manifest.webmanifest",
          revision: "bfc27035e06556a352a3a6134904fbee",
        },
      ],
      {}
    ),
    s.cleanupOutdatedCaches(),
    s.registerRoute(
      new s.NavigationRoute(s.createHandlerBoundToURL("index.html"))
    ),
    s.registerRoute(
      ({ request: s }) => "navigate" === s.mode,
      new s.NetworkFirst({
        cacheName: "pages-cache-v0.0.0",
        networkTimeoutSeconds: 3,
        plugins: [
          {
            requestWillFetch: async ({ event: s }) => {
              try {
                if (s.preloadResponse) {
                  const e = await s.preloadResponse;
                  if (e) return e;
                }
                return s.request;
              } catch (e) {
                return (
                  console.error("Error handling preload response:", e),
                  s.request
                );
              }
            },
            handlerDidError: async ({ request: s }) => {
              try {
                const s = await self.caches.open(CACHE_NAMES.pages),
                  e = await s.match("/offline.html");
                if (e) return e;
                const i = await fetch("/offline.html");
                return i.ok
                  ? (await s.put("/offline.html", i.clone()), i)
                  : void 0;
              } catch (s) {
                return void console.error("Error serving offline page:", s);
              }
            },
          },
        ],
      }),
      "GET"
    ),
    s.registerRoute(
      /\.(css|js|woff2|ttf)$/i,
      new s.CacheFirst({
        cacheName: "static-assets-v0.0.0",
        plugins: [
          new s.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 2592e3 }),
          new s.CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
      "GET"
    ),
    s.registerRoute(
      /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      new s.CacheFirst({
        cacheName: "images-cache-v0.0.0",
        plugins: [
          new s.ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 2592e3 }),
          new s.CacheableResponsePlugin({ statuses: [0, 200] }),
          {
            handlerDidError: async ({ request: s }) =>
              (await self.caches.open(CACHE_NAMES.static)).match(
                "/placeholder.svg"
              ),
          },
        ],
      }),
      "GET"
    ),
    s.registerRoute(
      /^https:\/\/api\.themoviedb\.org\/3\/.*/i,
      new s.NetworkFirst({
        cacheName: "tmdb-api-v0.0.0",
        networkTimeoutSeconds: 3,
        plugins: [
          {
            cacheWillUpdate: async ({ response: s }) => {
              if (s && 200 === s.status)
                try {
                  const e = s.clone(),
                    i = await e.json();
                  if (i && !i.error) return s;
                } catch (s) {
                  console.error("Error parsing TMDB response:", s);
                }
              return null;
            },
          },
          new s.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET"
    ),
    s.registerRoute(
      /^https:\/\/image\.tmdb\.org\/t\/p\/.*/i,
      new s.CacheFirst({
        cacheName: "tmdb-images-v0.0.0",
        matchOptions: { ignoreVary: !0 },
        plugins: [
          new s.ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 2592e3 }),
          new s.CacheableResponsePlugin({ statuses: [0, 200] }),
          {
            handlerDidError: async () =>
              (await self.caches.open(CACHE_NAMES.static)).match(
                "/placeholder.svg"
              ),
          },
        ],
      }),
      "GET"
    ),
    s.registerRoute(
      ({ url: s }) =>
        s.hostname.includes("firestore.googleapis.com") ||
        s.hostname.includes("firebase.googleapis.com") ||
        s.hostname.includes("firebaseio.com"),
      new s.NetworkOnly({
        plugins: [
          {
            fetchDidFail: async () => {
              console.error("Firebase request failed - network only strategy");
            },
          },
        ],
      }),
      "GET"
    ),
    s.registerRoute(
      /^https:\/\/(apis\.google\.com|www\.googleapis\.com)\/.*/i,
      new s.NetworkFirst({
        cacheName: "google-apis-v0.0.0",
        networkTimeoutSeconds: 3,
        plugins: [
          new s.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 3600 }),
          {
            handlerDidError: async ({ request: s }) => {
              console.error("Google API request failed:", s.url);
            },
          },
        ],
      }),
      "GET"
    ),
    s.initialize({ parameterOverrides: { cd1: "offline" } }));
});
