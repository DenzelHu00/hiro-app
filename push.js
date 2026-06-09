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
    return navigator.serviceWorker.register(new URL("sw.js", window.location.href));
  }

  async function getPushRegistration() {
    if (!isPushSupported()) return null;
    await registerServiceWorker();
    return navigator.serviceWorker.ready;
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

    const registration = await getPushRegistration();
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    saveSubscriptionLocally(subscription);
    return { ok: true, subscription };
  }

  async function unsubscribeFromPush() {
    if (!isPushSupported()) return { ok: true };

    const registration = await getPushRegistration();
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
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

  function getPushStatusMessage() {
    if (!isPushSupported()) {
      return "Push notifications are not supported in this browser.";
    }

    if (!getVapidPublicKey()) {
      return "Push is not configured yet. Add a VAPID public key in push-config.js (see push-server/README).";
    }

    if (Notification.permission === "denied") {
      return "Notifications are blocked. Enable them in your browser or phone settings.";
    }

    if (Notification.permission === "granted" && getLocalSubscriptionJson()) {
      return "Push notifications are enabled on this device.";
    }

    if (Notification.permission === "granted") {
      return "Notification permission granted. Save preferences to finish setup.";
    }

    return "Save preferences with notifications on to enable push on this device.";
  }

  window.HiroPush = {
    isPushSupported,
    getVapidPublicKey,
    registerServiceWorker,
    subscribeToPush,
    unsubscribeFromPush,
    syncPushWithSettings,
    getPushStatusMessage,
    getLocalSubscriptionJson,
    wantsAnyNotifications,
  };
})();
