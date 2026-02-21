import { opencodeClient } from "./src/opencode/client.js";

async function main() {
  const req = await opencodeClient.session.create({ directory: "D:/APP-WEB/opencode-telegram-bot" });
  if (!req.data) return console.error(req.error);
  
  const res = await opencodeClient.session.prompt({
    sessionID: req.data.id,
    directory: "D:/APP-WEB/opencode-telegram-bot",
    parts: [{ type: "text", text: "hello" }],
    agent: "ask"
  });
  console.log(res);
}
main().catch(console.error);
