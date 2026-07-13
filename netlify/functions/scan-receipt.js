export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { image, mimeType, categories } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), { status: 400 });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY") || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), { status: 500 });
    }

    const catList = (categories || []).join(", ");
    const prompt = "Look at this receipt image. Extract the TOTAL amount paid (just the final number, no currency symbol) and pick the single best matching category from this list: " + catList + ". Also extract the merchant/store name if visible. Respond ONLY with valid JSON in this exact format, nothing else: {\"amount\": 12.50, \"category\": \"Food\", \"merchant\": \"Store Name\"}. If you cannot read the amount clearly, use 0.";

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType || "image/jpeg", data: image } }
            ]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Gemini API error" }), { status: 500 });
    }

    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = { amount: 0, category: (categories && categories[0]) || "Other", merchant: "" };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
