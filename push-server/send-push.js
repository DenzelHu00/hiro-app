const fs = require("fs");
const path = require("path");
const webPush = require("web-push");

const args = process.argv.slice(2);

function readArg(name, fallback = "") {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) return fallback;
  return args[index + 1];
}

const title = readArg("--title", "HiRO");
const body = readArg(
  "--body",
  "You have a new update from Hearts in Rhythm Organization."
);
const category = readArg("--category", "general");
const url = readArg("--url", "./");

const vapidPath = path.join(__dirname, "vapid.json");
const subscriptionsPath = path.join(__dirname, "subscriptions.json");

if (!fs.existsSync(vapidPath)) {
  console.error("Missing vapid.json — run: npm run setup");
  process.exit(1);
}

if (!fs.existsSync(subscriptionsPath)) {
  console.error("Missing subscriptions.json — export a subscription from the app Settings first.");
  process.exit(1);
}

const vapid = JSON.parse(fs.readFileSync(vapidPath, "utf8"));
const subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, "utf8"));

if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
  console.error("subscriptions.json must contain an array of push subscriptions.");
  process.exit(1);
}

webPush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

const payload = JSON.stringify({ title, body, category, url });

(async () => {
  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      await webPush.sendNotification(subscription, payload);
      sent += 1;
      console.log("Sent to endpoint:", subscription.endpoint?.slice(0, 48) + "...");
    } catch (error) {
      failed += 1;
      console.error("Failed:", error.statusCode || error.message);
    }
  }

  console.log(`Done. Sent: ${sent}, failed: ${failed}`);
})();
