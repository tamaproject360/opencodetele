import { opencodeClient } from "./src/opencode/client.js";

async function main() {
  const req = await opencodeClient.app.agents();
  console.log(JSON.stringify(req.data, null, 2));
}
main().catch(console.error);
