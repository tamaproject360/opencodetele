import { opencodeClient } from "./src/opencode/client.js";

async function main() {
  const req = await opencodeClient.session.messages({
    sessionID: "ses_38235fd67ffepr7PLcsMAWQ36x", // from previous run
    directory: "D:/APP-WEB/opencode-telegram-bot",
  });
  console.log(JSON.stringify(req.data, null, 2));
}
main().catch(console.error);
