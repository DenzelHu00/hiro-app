const fs = require("fs");
const path = require("path");
const webPush = require("web-push");

const vapidPath = path.join(__dirname, "vapid.json");
const publicConfigPath = path.join(__dirname, "..", "push-config.js");

if (fs.existsSync(vapidPath)) {
  console.log("vapid.json already exists. Delete it first to regenerate.");
  process.exit(1);
}

const keys = webPush.generateVAPIDKeys();
fs.writeFileSync(
  vapidPath,
  JSON.stringify(
    {
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      subject: "mailto:hiro@example.com",
    },
    null,
    2
  )
);

const publicConfig = `/**
 * Web Push VAPID public key (auto-generated — do not commit private key).
 */
window.HIRO_PUSH_CONFIG = {
  vapidPublicKey: "${keys.publicKey}",
};
`;

fs.writeFileSync(publicConfigPath, publicConfig);

console.log("Created push-server/vapid.json");
console.log("Updated push-config.js with your public VAPID key");
console.log("Edit vapid.json subject to your team email (mailto:...)");
console.log("Keep vapid.json private — never commit it to GitHub.");
