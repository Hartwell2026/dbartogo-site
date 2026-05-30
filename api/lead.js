// Serverless lead handler — emails form submissions to the client (CC agency).
// Uses FormSubmit (no API key). Recipients live server-side, never in the public page.
// NOTE: FormSubmit requires a one-time activation: the FIRST submission triggers a
// "confirm your email" link sent to LEAD_TO — click it once to start receiving leads.
const LEAD_TO = "dbartogo@gmail.com";        // primary recipient (the client)
const LEAD_CC = "caego23@gmail.com";          // agency copy (Stonehenge Studio)

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body || "{}");
    if (!body) body = {};

    const type = body.type === "call" ? "Request a Call" : "Quote Request";
    const name = (body.name || "").toString().trim();
    const phone = (body.phone || "").toString().trim();
    const email = (body.email || "").toString().trim();

    if (!name || (!phone && !email)) {
      res.status(400).json({ error: "Missing name and contact" });
      return;
    }

    // assemble a clean payload for FormSubmit
    const payload = {
      _subject: `New ${type} — D'Bar To Go website`,
      _template: "table",
      _cc: LEAD_CC,
      "Lead type": type,
      Name: name,
      Phone: phone || "—",
      Email: email || "—",
      "Event date": (body.date || "").toString().trim() || "—",
      Guests: (body.guests || "").toString().trim() || "—",
      "Best time to call": (body.when || "").toString().trim() || "—",
      Details: (body.details || "").toString().trim() || "—",
      Source: "dbartogo-site.vercel.app",
    };

    const resp = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(LEAD_TO), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const out = await resp.json().catch(() => ({}));

    // FormSubmit returns { success: "true" } on success (or an activation notice first time)
    res.status(200).json({ ok: true, provider: out });
  } catch (e) {
    // never break the UX — report soft failure
    res.status(200).json({ ok: false, error: String(e).slice(0, 200) });
  }
};
