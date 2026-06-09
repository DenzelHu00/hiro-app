/**
 * HiRO Web Push — client subscription and status.
 */
(function () {
  const SUBSCRIPTION_STORAGE_KEY = "hiro-push-subscription";

  function isPushSupported() {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  function isStandaloneDisplay() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function getVapidPublicKey() {
    const key = window.HIRO_PUSH_CONFIG?.vapidPublicKey?.trim();
    return key || "";
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function wantsAnyNotifications(settings) {
    return settings.newsAlerts || settings.messageAlerts || settings.studyAlerts;
  }

  async function registerServiceWorker() {
    if (!isPushSupported()) return null;
    try {
      return await navigator.serviceWorker.register(new URL("sw.js", window.location.href));
    } catch (error) {
      console.error("HiRO service worker registration failed:", error);
      return null;
    }
  }

  async function getPushRegistration() {
    if (!isPushSupported()) return null;
    await registerServiceWorker();
    return navigator.serviceWorker.ready;
  }

  async function getActiveSubscription() {
    const registration = await getPushRegistration();
    if (!registration) return null;
    return registration.pushManager.getSubscription();
  }

  function saveSubscriptionLocally(subscription) {
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription.toJSON()));
  }

  function clearSubscriptionLocally() {
    localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
  }

  function getLocalSubscriptionJson() {
    try {
      const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function subscribeToPush() {
    if (!isPushSupported()) {
      return { ok: false, reason: "unsupported" };
    }

    const vapidPublicKey = getVapidPublicKey();
    if (!vapidPublicKey) {
      return { ok: false, reason: "not_configured" };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: "denied" };
    }

    try {
      const registration = await getPushRegistration();
      if (!registration) {
        return {
          ok: false,
          reason: "error",
          message: "Could not register the notification service. Try refreshing the page.",
        };
      }

      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        subscription = null;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      saveSubscriptionLocally(subscription);
      return { ok: true, subscription };
    } catch (error) {
      console.error("HiRO push subscribe failed:", error);
      return {
        ok: false,
        reason: "error",
        message: error.message || "Push subscription failed.",
      };
    }
  }

  async function unsubscribeFromPush() {
    if (!isPushSupported()) return { ok: true };

    try {
      const subscription = await getActiveSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    } catch (error) {
      console.error("HiRO push unsubscribe failed:", error);
    }

    clearSubscriptionLocally();
    return { ok: true };
  }

  async function syncPushWithSettings(settings) {
    if (!isPushSupported()) {
      return { ok: false, reason: "unsupported" };
    }

    if (!wantsAnyNotifications(settings)) {
      await unsubscribeFromPush();
      return { ok: true, subscribed: false };
    }

    if (Notification.permission === "denied") {
      return { ok: false, reason: "denied" };
    }

    const result = await subscribeToPush();
    return { ...result, subscribed: result.ok };
  }

  async function refreshPushStatus() {
    if (!isPushSupported()) {
      return {
        state: "unsupported",
        message: "Push notifications are not supported in this browser.",
      };
    }

    if (!getVapidPublicKey()) {
      return {
        state: "not_configured",
        message:
          "Push is not configured on this site yet. The team needs to deploy push-config.js with a VAPID public key.",
      };
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIos && !isStandaloneDisplay()) {
      return {
        state: "ios_standalone",
        message:
          "On iPhone: open HiRO from your Home Screen icon (not the Safari tab), then save preferences again.",
      };
    }

    if (Notification.permission === "denied") {
      return {
        state: "denied",
        message: "Notifications are blocked. Enable them in your phone or browser settings, then try again.",
      };
    }

    try {
      const subscription = await getActiveSubscription();
      if (subscription) {
        saveSubscriptionLocally(subscription);
        return {
          state: "enabled",
          message: "Push notifications are enabled on this device.",
          subscribed: true,
        };
      }
    } catch (error) {
      return {
        state: "error",
        message: `Push check failed: ${error.message}`,
      };
    }

    if (Notification.permission === "granted") {
      return {
        state: "incomplete",
        message:
          "Notification permission granted, but push is not active yet. Tap “Enable push notifications” below.",
      };
    }

    return {
      state: "pending",
      message: "Turn on notification toggles above, then tap “Enable push notifications” or Save preferences.",
    };
  }

  window.HiroPush = {
    isPushSupported,
    isStandaloneDisplay,
    getVapidPublicKey,
    registerServiceWorker,
    subscribeToPush,
    unsubscribeFromPush,
    syncPushWithSettings,
    refreshPushStatus,
    getLocalSubscriptionJson,
    wantsAnyNotifications,
  };
})();
