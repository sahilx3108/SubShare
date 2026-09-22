import { getSettings } from "./config";
import { apiFetch } from "./api";
import type { ExtensionMessage, WorkerResponse } from "./messages";

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
};

const status = $("status");
function show(message: string, ok: boolean) {
  status.textContent = message;
  status.className = ok ? "ok" : "err";
}

async function send(message: ExtensionMessage): Promise<WorkerResponse> {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

async function checkAuth(): Promise<void> {
  const res = await send({ type: "CHECK_AUTH" });
  $("auth").textContent = res.ok ? "logged in" : "logged out";
  if (!res.ok) show(res.message ?? "Not logged in", false);
}

async function loadSubscriptions(): Promise<void> {
  const select = $<HTMLSelectElement>("subs");
  try {
    const res = await apiFetch<{
      subscriptions: { id: string; platform_name: string; has_session?: boolean }[];
    }>("/subscriptions/mine");

    select.innerHTML = "";
    if (res.subscriptions.length === 0) {
      select.append(new Option("No listings — create one on the web app", ""));
      return;
    }
    for (const sub of res.subscriptions) {
      select.append(new Option(`${sub.platform_name} (${sub.id.slice(-6)})`, sub.id));
    }
  } catch (e) {
    select.innerHTML = "";
    select.append(new Option("Could not load listings", ""));
    show(e instanceof Error ? e.message : "Failed to load listings", false);
  }
}

$("push").addEventListener("click", async () => {
  const id = $<HTMLSelectElement>("subs").value;
  if (!id) return show("Create a listing on the web app first.", false);

  const button = $<HTMLButtonElement>("push");
  button.disabled = true;
  show("Extracting & encrypting cookies…", true);
  try {
    const res = await send({ type: "PUSH_SESSION", subscriptionId: id });
    if (res.ok) {
      show(res.message ?? "Synced!", true);
      await loadSubscriptions(); // refresh labels
    } else {
      show(res.message ?? "Sync failed", false);
    }
  } finally {
    button.disabled = false;
  }
});

$("launch").addEventListener("click", async () => {
  const button = $<HTMLButtonElement>("launch");
  button.disabled = true;
  show("Fetching encrypted session…", true);
  try {
    const res = await send({ type: "LAUNCH" });
    show(res.message ?? (res.ok ? "Launched!" : ""), res.ok);
  } finally {
    button.disabled = false;
  }
});

$("save").addEventListener("click", async () => {
  await chrome.storage.sync.set({
    apiBase: $<HTMLInputElement>("apiBase").value.replace(/\/$/, ""),
    webOrigin: $<HTMLInputElement>("webOrigin").value.replace(/\/$/, ""),
  });
  show("Settings saved. Reloading…", true);
  setTimeout(() => location.reload(), 600);
});

void (async function init() {
  const settings = await getSettings();
  $<HTMLInputElement>("apiBase").value = settings.apiBase;
  $<HTMLInputElement>("webOrigin").value = settings.webOrigin;
  await checkAuth();
  await loadSubscriptions();
})();
