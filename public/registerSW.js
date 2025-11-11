// This script registers the service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        type: "classic",
      })
      .then(function (registration) {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );
      })
      .catch(function (error) {
        console.error("ServiceWorker registration failed: ", error);
      });
  });
}
