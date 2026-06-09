/**
 * HiRO — Hearts in Rhythm Organization
 * Tab navigation and local settings persistence
 */

const STORAGE_KEY = "hiro-settings";

const MESSAGE_CATEGORIES = [
  { key: "genetics", label: "Genetics" },
  { key: "geneticTesting", label: "Genetic testing" },
  { key: "lqts", label: "LQTS" },
  { key: "brugada", label: "Brugada syndrome" },
  { key: "arvc", label: "ARVC" },
  { key: "hcm", label: "HCM" },
  { key: "cpvt", label: "CPVT" },
  { key: "scd", label: "Sudden cardiac arrest" },
  { key: "icd", label: "ICD" },
  { key: "pacemaker", label: "Pacemaker" },
  { key: "familyScreening", label: "Family screening" },
  { key: "researchStudies", label: "Research studies" },
  { key: "medications", label: "Medications" },
  { key: "mentalHealth", label: "Mental health" },
  { key: "exercise", label: "Exercise & activity" },
  { key: "appointments", label: "Appointments" },
  { key: "hiroNews", label: "HiRO News" },
  { key: "symposium", label: "Symposium & events" },
];

const MESSAGE_CATEGORY_KEYS = MESSAGE_CATEGORIES.map((category) => category.key);

const DEFAULT_MESSAGE_CATEGORIES = Object.fromEntries(
  MESSAGE_CATEGORY_KEYS.map((key) => [key, false])
);

const DEFAULT_SETTINGS = {
  displayName: "",
  email: "",
  registryId: "",
  newsAlerts: true,
  messageAlerts: true,
  studyAlerts: false,
  messageCategories: { ...DEFAULT_MESSAGE_CATEGORIES },
};

const panels = {
  news: document.getElementById("panel-news"),
  resources: document.getElementById("panel-resources"),
  messages: document.getElementById("panel-messages"),
  settings: document.getElementById("panel-settings"),
};

const allTabButtons = document.querySelectorAll(".tab-bar__btn");
const messagesTabBtn = document.getElementById("tab-messages");
const settingsForm = document.getElementById("settings-form");
const settingsSaved = document.getElementById("settings-saved");
const messageList = document.getElementById("message-list");
const messageListEmpty = document.getElementById("message-list-empty");
const categorySubscribed = document.getElementById("category-subscribed");
const categoryAvailable = document.getElementById("category-available");
const categorySearch = document.getElementById("category-search");
const categorySubscribedEmpty = document.getElementById("category-subscribed-empty");
const categoryAvailableEmpty = document.getElementById("category-available-empty");

let categoryPickerState = { ...DEFAULT_MESSAGE_CATEGORIES };

function normalizeMessageCategories(categories) {
  const normalized = { ...DEFAULT_MESSAGE_CATEGORIES };
  if (!categories || typeof categories !== "object") return normalized;
  MESSAGE_CATEGORY_KEYS.forEach((key) => {
    if (typeof categories[key] === "boolean") {
      normalized[key] = categories[key];
    }
  });
  return normalized;
}

function getMessageCategoriesFromForm() {
  return { ...categoryPickerState };
}

function applyMessageCategoriesToForm(categories) {
  categoryPickerState = normalizeMessageCategories(categories);
  if (categorySearch) categorySearch.value = "";
  renderCategoryPicker();
}

function renderCategoryPicker() {
  if (!categorySubscribed || !categoryAvailable) return;

  const query = categorySearch?.value.trim().toLowerCase() ?? "";
  categorySubscribed.innerHTML = "";
  categoryAvailable.innerHTML = "";

  let subscribedCount = 0;
  let availableCount = 0;

  MESSAGE_CATEGORIES.forEach(({ key, label }) => {
    const isSubscribed = categoryPickerState[key];

    if (isSubscribed) {
      subscribedCount += 1;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "category-bubble category-bubble--subscribed";
      btn.dataset.category = key;
      btn.setAttribute("aria-label", `Remove ${label} from subscribed categories`);
      btn.innerHTML = `${label}<span class="category-bubble__remove" aria-hidden="true">×</span>`;
      btn.addEventListener("click", () => {
        categoryPickerState[key] = false;
        renderCategoryPicker();
      });
      categorySubscribed.appendChild(btn);
    } else {
      const matchesSearch =
        !query ||
        label.toLowerCase().includes(query) ||
        key.toLowerCase().includes(query);

      if (matchesSearch) {
        availableCount += 1;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "category-bubble";
        btn.dataset.category = key;
        btn.textContent = label;
        btn.setAttribute("aria-label", `Subscribe to ${label}`);
        btn.addEventListener("click", () => {
          categoryPickerState[key] = true;
          renderCategoryPicker();
        });
        categoryAvailable.appendChild(btn);
      }
    }
  });

  if (categorySubscribedEmpty) {
    categorySubscribedEmpty.hidden = subscribedCount > 0;
  }
  if (categoryAvailableEmpty) {
    categoryAvailableEmpty.hidden = availableCount > 0;
  }
}

function messageCategoriesAreEqual(a, b) {
  return MESSAGE_CATEGORY_KEYS.every((key) => a[key] === b[key]);
}

function getSavedSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const data = JSON.parse(raw);
    return {
      displayName: String(data.displayName ?? "").trim(),
      email: String(data.email ?? "").trim(),
      registryId: String(data.registryId ?? "").trim(),
      newsAlerts: data.newsAlerts !== false,
      messageAlerts: data.messageAlerts !== false,
      studyAlerts: Boolean(data.studyAlerts),
      messageCategories: normalizeMessageCategories(data.messageCategories),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function getFormSettings() {
  return {
    displayName: settingsForm.displayName.value.trim(),
    email: settingsForm.email.value.trim(),
    registryId: settingsForm.registryId.value.trim(),
    newsAlerts: settingsForm.newsAlerts.checked,
    messageAlerts: settingsForm.messageAlerts.checked,
    studyAlerts: settingsForm.studyAlerts.checked,
    messageCategories: getMessageCategoriesFromForm(),
  };
}

function applySettingsToForm(data) {
  settingsForm.displayName.value = data.displayName;
  settingsForm.email.value = data.email;
  settingsForm.registryId.value = data.registryId;
  settingsForm.newsAlerts.checked = data.newsAlerts;
  settingsForm.messageAlerts.checked = data.messageAlerts;
  settingsForm.studyAlerts.checked = data.studyAlerts;
  applyMessageCategoriesToForm(data.messageCategories);
}

function settingsAreDirty() {
  const saved = getSavedSettings();
  const current = getFormSettings();
  return (
    saved.displayName !== current.displayName ||
    saved.email !== current.email ||
    saved.registryId !== current.registryId ||
    saved.newsAlerts !== current.newsAlerts ||
    saved.messageAlerts !== current.messageAlerts ||
    saved.studyAlerts !== current.studyAlerts ||
    !messageCategoriesAreEqual(saved.messageCategories, current.messageCategories)
  );
}

function revertUnsavedSettings() {
  if (!settingsAreDirty()) return;
  applySettingsToForm(getSavedSettings());
  updateMessagesTabVisibility();
  filterMessagesByCategory();
  settingsSaved.hidden = true;
}

function filterMessagesByCategory() {
  if (!messageList) return;

  const { messageCategories } = getSavedSettings();
  const messageItems = messageList.querySelectorAll("li[data-categories]");
  let visibleCount = 0;

  messageItems.forEach((item) => {
    const categories = item.dataset.categories
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const isVisible = categories.some((category) => messageCategories[category]);
    item.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  if (messageListEmpty) {
    messageListEmpty.hidden = visibleCount > 0;
  }
}

function hasMessagesAccess() {
  const { email, registryId } = getSavedSettings();
  return Boolean(email) || Boolean(registryId);
}

function getActiveTab() {
  return Object.entries(panels).find(([, panel]) => panel.classList.contains("panel--active"))?.[0];
}

function getVisibleTabButtons() {
  return Array.from(allTabButtons).filter((btn) => !btn.hidden);
}

function updateMessagesTabVisibility() {
  const showMessages = hasMessagesAccess();
  messagesTabBtn.hidden = !showMessages;

  if (!showMessages) {
    const onMessages =
      messagesTabBtn.classList.contains("tab-bar__btn--active") ||
      panels.messages.classList.contains("panel--active");
    if (onMessages) {
      switchTab("news", { skipRevert: true });
    }
  }
}

function switchTab(tabId, options = {}) {
  const { skipRevert = false } = options;
  const previousTab = getActiveTab();

  if (!skipRevert && previousTab === "settings" && tabId !== "settings") {
    revertUnsavedSettings();
  }

  if (tabId === "messages" && !hasMessagesAccess()) {
    tabId = "news";
  }

  Object.entries(panels).forEach(([id, panel]) => {
    const isActive = id === tabId;
    panel.hidden = !isActive;
    panel.classList.toggle("panel--active", isActive);
  });

  allTabButtons.forEach((btn) => {
    if (btn.hidden) {
      btn.classList.remove("tab-bar__btn--active");
      btn.setAttribute("aria-selected", "false");
      return;
    }
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle("tab-bar__btn--active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  document.getElementById(`tab-${tabId}`)?.focus({ preventScroll: true });

  if (tabId === "messages") {
    filterMessagesByCategory();
  }
}

allTabButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

allTabButtons.forEach((btn) => {
  btn.addEventListener("keydown", (e) => {
    const tabs = getVisibleTabButtons();
    const index = tabs.indexOf(btn);
    if (index < 0) return;

    let next = -1;

    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;

    if (next >= 0) {
      e.preventDefault();
      tabs[next].click();
      tabs[next].focus();
    }
  });
});

function loadSettings() {
  applySettingsToForm(getSavedSettings());
  updateMessagesTabVisibility();
  filterMessagesByCategory();
}

async function saveSettings(e) {
  e.preventDefault();
  const data = getFormSettings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  applySettingsToForm(data);
  updateMessagesTabVisibility();
  filterMessagesByCategory();

  if (window.HiroPush) {
    const pushResult = await window.HiroPush.syncPushWithSettings(data);
    await updatePushStatusUI(pushResult);
  }

  settingsSaved.hidden = false;
  setTimeout(() => {
    settingsSaved.hidden = true;
  }, 3000);
}

settingsForm.addEventListener("submit", saveSettings);

if (categorySearch) {
  categorySearch.addEventListener("input", renderCategoryPicker);
  categorySearch.addEventListener("search", renderCategoryPicker);
}

const pushStatusEl = document.getElementById("push-status");
const pushEnableBtn = document.getElementById("push-enable-btn");
const pushCopySubscriptionBtn = document.getElementById("push-copy-subscription");

async function updatePushStatusUI(pushResult) {
  if (!pushStatusEl || !window.HiroPush) return;

  const status = await window.HiroPush.refreshPushStatus();

  if (pushResult?.reason === "denied") {
    status.state = "denied";
    status.message =
      "Notifications are blocked. Enable them in your phone or browser settings, then try again.";
  }

  if (pushResult?.reason === "error" && pushResult.message) {
    status.state = "error";
    status.message = pushResult.message;
  }

  pushStatusEl.textContent = status.message;
  pushStatusEl.classList.remove("push-status--enabled", "push-status--warning");
  if (status.state === "enabled") {
    pushStatusEl.classList.add("push-status--enabled");
  } else {
    pushStatusEl.classList.add("push-status--warning");
  }

  const subscribed = status.state === "enabled";
  if (pushEnableBtn) {
    pushEnableBtn.hidden = subscribed;
  }
  if (pushCopySubscriptionBtn) {
    pushCopySubscriptionBtn.hidden = !subscribed;
  }
}

async function enablePushNotifications() {
  if (!window.HiroPush) return;

  const settings = getFormSettings();
  if (!window.HiroPush.wantsAnyNotifications(settings)) {
    pushStatusEl.textContent =
      "Turn on at least one notification toggle above, then try again.";
    pushStatusEl.classList.add("push-status--warning");
    return;
  }

  const result = await window.HiroPush.syncPushWithSettings(settings);
  await updatePushStatusUI(result);
}

if (pushEnableBtn) {
  pushEnableBtn.addEventListener("click", () => enablePushNotifications());
}

if (pushCopySubscriptionBtn) {
  pushCopySubscriptionBtn.addEventListener("click", async () => {
    const subscription = window.HiroPush?.getLocalSubscriptionJson();
    if (!subscription) return;

    const json = JSON.stringify(subscription, null, 2);

    try {
      await navigator.clipboard.writeText(json);
      pushCopySubscriptionBtn.textContent = "Copied!";
      setTimeout(() => {
        pushCopySubscriptionBtn.textContent = "Copy push subscription for admin";
      }, 2000);
    } catch {
      prompt("Copy this subscription JSON into push-server/subscriptions.json:", json);
    }
  });
}

async function initPushNotifications() {
  if (!window.HiroPush) return;
  await window.HiroPush.registerServiceWorker();
  const saved = getSavedSettings();
  if (window.HiroPush.wantsAnyNotifications(saved) && Notification.permission === "granted") {
    await window.HiroPush.syncPushWithSettings(saved);
  }
  await updatePushStatusUI();
}

loadSettings();
initPushNotifications();

/* News — pull to refresh & last updated */
const mainContent = document.getElementById("main-content");
const newsLastUpdated = document.getElementById("news-last-updated");
const newsPullIndicator = document.getElementById("news-pull-indicator");
const newsPullLabel = document.getElementById("news-pull-label");
const PULL_THRESHOLD = 72;
let pullStartY = 0;
let pullTracking = false;
let isRefreshingNews = false;

function formatLastUpdated(date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function setNewsLastUpdated(date = new Date()) {
  newsLastUpdated.textContent = `Last updated: ${formatLastUpdated(date)}`;
}

function resetPullIndicator() {
  pullTracking = false;
  newsPullIndicator.classList.remove("is-visible", "is-ready", "is-refreshing");
  newsPullIndicator.style.height = "";
  newsPullIndicator.style.marginBottom = "";
  newsPullLabel.textContent = "Pull down to refresh";
}

function updatePullIndicator(distance) {
  const clamped = Math.min(Math.max(distance, 0), 110);
  newsPullIndicator.classList.toggle("is-visible", clamped > 8);
  newsPullIndicator.classList.toggle("is-ready", clamped >= PULL_THRESHOLD);
  newsPullIndicator.style.height = `${Math.max(0, clamped * 0.35)}px`;
  newsPullIndicator.style.marginBottom = clamped > 20 ? "0.5rem" : "0";
  newsPullLabel.textContent =
    clamped >= PULL_THRESHOLD ? "Release to refresh" : "Pull down to refresh";
}

function refreshNews() {
  if (isRefreshingNews) return Promise.resolve();
  isRefreshingNews = true;
  newsPullIndicator.classList.add("is-visible", "is-refreshing");
  newsPullLabel.textContent = "Updating…";

  return new Promise((resolve) => {
    setTimeout(() => {
      setNewsLastUpdated(new Date());
      resetPullIndicator();
      isRefreshingNews = false;
      resolve();
    }, 700);
  });
}

mainContent.addEventListener(
  "touchstart",
  (e) => {
    if (getActiveTab() !== "news" || isRefreshingNews) return;
    if (mainContent.scrollTop > 0) return;
    pullStartY = e.touches[0].clientY;
    pullTracking = true;
  },
  { passive: true }
);

mainContent.addEventListener(
  "touchmove",
  (e) => {
    if (!pullTracking || getActiveTab() !== "news" || isRefreshingNews) return;
    const distance = e.touches[0].clientY - pullStartY;
    if (distance > 0 && mainContent.scrollTop <= 0) {
      if (distance > 10) e.preventDefault();
      updatePullIndicator(distance);
    } else if (distance <= 0) {
      resetPullIndicator();
    }
  },
  { passive: false }
);

mainContent.addEventListener(
  "touchend",
  () => {
    if (!pullTracking || getActiveTab() !== "news") return;
    const ready = newsPullIndicator.classList.contains("is-ready");
    pullTracking = false;
    if (ready && !isRefreshingNews) {
      refreshNews();
    } else {
      resetPullIndicator();
    }
  },
  { passive: true }
);

setNewsLastUpdated();

/* Resources search */
const resourceSearch = document.getElementById("resource-search");
const resourceSearchEmpty = document.getElementById("resource-search-empty");
const resourceAccordionItems = document.querySelectorAll(
  "#resources-accordion > .accordion__item"
);

function filterResources() {
  const query = resourceSearch.value.trim().toLowerCase();
  let visibleCount = 0;

  resourceAccordionItems.forEach((item) => {
    const text = item.textContent.toLowerCase();
    const matches = !query || text.includes(query);
    item.classList.toggle("is-search-hidden", !matches);
    if (matches) visibleCount += 1;
  });

  resourceSearchEmpty.hidden = !query || visibleCount > 0;
}

resourceSearch.addEventListener("input", filterResources);
resourceSearch.addEventListener("search", filterResources);

document.querySelectorAll(".link-list__link[href='#']").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    link.title = "Replace this link with your organization URL in index.html";
  });
});
