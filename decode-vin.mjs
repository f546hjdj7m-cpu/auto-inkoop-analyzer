export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" }
    });
  }

  try {
    const apiKey = process.env.VEHICODE_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "VEHICODE_API_KEY ontbreekt in Netlify." }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }

    const body = await req.json();
    const vin = String(body?.vin || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (vin.length !== 17) {
      return new Response(JSON.stringify({ error: "VIN moet 17 tekens bevatten." }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    const upstream = await fetch("https://vehicode.eu/api/decode", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({ vin })
    });

    const text = await upstream.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: "Ongeldige response van VehiCode." };
    }

    if (!upstream.ok) {
      return new Response(JSON.stringify({
        error: payload?.error || payload?.message || "VehiCode gaf een fout.",
        status: upstream.status
      }), {
        status: upstream.status,
        headers: { "content-type": "application/json" }
      });
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Onbekende serverfout." }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};
