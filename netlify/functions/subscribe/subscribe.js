// Netlify serverless function: subscribe email to Buttondown via API.
// This bypasses the Cloudflare Turnstile CAPTCHA on the embedded form.

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Parse request body
  let email;
  try {
    const body = JSON.parse(event.body);
    email = (body.email || "").trim().toLowerCase();
  } catch {
    // Fallback: form-encoded
    const params = new URLSearchParams(event.body);
    email = (params.get("email") || "").trim().toLowerCase();
  }

  if (!email || !email.includes("@")) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "请输入有效的邮箱地址" }),
    };
  }

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    console.error("BUTTONDOWN_API_KEY not set");
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "服务器配置错误，请联系站长" }),
    };
  }

  try {
    const response = await fetch("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (response.status === 201 || response.status === 200) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, message: "订阅成功！请查收确认邮件。" }),
      };
    }

    // 409 = already subscribed (conflict)
    if (response.status === 409) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, message: "该邮箱已经订阅过了。" }),
      };
    }

    const errData = await response.text();
    console.error(`Buttondown API error ${response.status}:`, errData);
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "订阅失败，请稍后再试" }),
    };
  } catch (err) {
    console.error("Subscription error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "网络错误，请稍后再试" }),
    };
  }
};
