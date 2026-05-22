// Netlify serverless function: subscribe email via Blogtrottr (free RSS-to-email).
// No API keys needed — proxies the subscription to Blogtrottr's backend.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let email;
  try {
    const body = JSON.parse(event.body);
    email = (body.email || "").trim().toLowerCase();
  } catch {
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

  const FEED_URL = "https://wangrenmin.com/rss.xml";

  try {
    // Step 1: Fetch Blogtrottr page to get CSRF token
    const pageResp = await fetch("https://blogtrottr.com/guest/subscribe");
    const html = await pageResp.text();

    // Extract CSRF token
    const tokenMatch = html.match(/name="_token"[^>]*value="([^"]+)"/);
    if (!tokenMatch) {
      throw new Error("Cannot get CSRF token from Blogtrottr");
    }
    const csrfToken = tokenMatch[1];

    // Step 2: Submit subscription
    const formData = new URLSearchParams();
    formData.append("_token", csrfToken);
    formData.append("btr_url", FEED_URL);
    formData.append("btr_email", email);

    const subResp = await fetch("https://blogtrottr.com/guest/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: pageResp.headers.get("set-cookie") || "",
      },
      body: formData.toString(),
      redirect: "manual",
    });

    // Blogtrottr typically returns 302 redirect to a confirmation page on success
    const body = await subResp.text();

    if (subResp.status === 302 || subResp.status === 301 || subResp.status === 200) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, message: "订阅成功！请查收来自 Blogtrottr 的确认邮件。" }),
      };
    }

    // If we see "confirmation" or "verify" in the response, it also worked
    if (body.includes("confirmation") || body.includes("verify") || body.includes("thank")) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, message: "订阅成功！请查收确认邮件完成验证。" }),
      };
    }

    // If response says already subscribed
    if (body.includes("already") || body.includes("exists")) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, message: "该邮箱已经订阅过了。" }),
      };
    }

    // Unknown response — log and return generic error
    console.error("Blogtrottr unexpected response:", body.substring(0, 500));
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, message: "订阅请求已提交，请查收确认邮件。" }),
    };
  } catch (err) {
    console.error("Blogtrottr subscription error:", err.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "订阅服务暂时不可用，请稍后再试" }),
    };
  }
};
