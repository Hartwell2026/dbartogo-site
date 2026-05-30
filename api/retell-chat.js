// Vercel serverless proxy for the Olá chat — keeps the Retell SECRET key server-side.
// Front-end posts { message, chatId } and gets back { chatId, reply }.
const RETELL_AGENT_ID = "agent_b6dcda4d322941ba560dd2f620"; // Olá

async function retell(path, body, key) {
  const resp = await fetch("https://api.retellai.com" + path, {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return resp.json();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const key = process.env.RETELL_API_KEY;
  if (!key) {
    res.status(500).json({ error: "Retell key missing on server" });
    return;
  }
  try {
    // req.body may be a parsed object (Vercel) or a raw string
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body || "{}");
    if (!body) body = {};

    const msg = (body.message || "").trim();
    let chatId = body.chatId;

    if (!chatId) {
      const chat = await retell("/create-chat", { agent_id: RETELL_AGENT_ID }, key);
      chatId = chat && chat.chat_id;
      if (!chatId) {
        res.status(502).json({ error: "Could not start chat" });
        return;
      }
    }

    const comp = await retell("/create-chat-completion", { chat_id: chatId, content: msg }, key);
    let reply = "";
    const messages = comp && Array.isArray(comp.messages) ? comp.messages : [];
    for (const m of messages) {
      if (m.role === "agent") reply = m.content || "";
    }

    res.status(200).json({ chatId, reply: reply || "…" });
  } catch (e) {
    res.status(500).json({ error: String(e).slice(0, 200) });
  }
};
