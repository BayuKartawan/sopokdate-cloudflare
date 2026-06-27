// app/plugins/pwa.client.ts

export default defineNuxtPlugin(() => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "Service Worker registered successfully with scope:",
            registration.scope,
          );
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
      register();
    } else {
      window.addEventListener("load", register);
    }
  }
});
