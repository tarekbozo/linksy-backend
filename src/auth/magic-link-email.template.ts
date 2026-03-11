export function magicLinkEmailHtml(params: {
  brandName?: string;
  domain?: string;
  loginUrl: string;
  locale?: "ar" | "en";
}) {
  const brand = params.brandName ?? "LinkSy";
  const domain = params.domain ?? "linksy.dev";
  const loginUrl = params.loginUrl;

  const preheader = "رابط تسجيل الدخول جاهز. صالح لمدة 15 دقيقة فقط.";

  // Solid colors (avoid rgba in email clients, especially Gmail iOS)
  const bg = "#030712";
  const card = "#0b1120";
  const border = "#1e293b";
  const muted = "#64748b";
  const text = "#cbd5e1";
  const badgeBg = "#111a3a"; // was rgba(99,102,241,0.12)
  const badgeBorder = "#2b335a"; // was rgba(99,102,241,0.25)
  const infoBg = "#0f172a"; // was rgba(255,255,255,0.03)
  const infoBorder = "#334155";

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>${brand} | رابط تسجيل الدخول</title>

  <style>
    @media (max-width: 600px) {
      .container { width: 100% !important; }
      .px { padding-left: 16px !important; padding-right: 16px !important; }
      .cardPad { padding: 18px !important; }
      .h1 { font-size: 22px !important; line-height: 1.4 !important; }
      .p { font-size: 14px !important; line-height: 1.9 !important; }
      .btn { width: 100% !important; }
    }

    /* Helps in clients that respect it (not all Gmail variants will) */
    @media (prefers-color-scheme: dark) {
      body, .bg { background: ${bg} !important; background-color: ${bg} !important; }
      .cardBg { background: ${card} !important; background-color: ${card} !important; }
      .text { color: ${text} !important; }
    }
  </style>
</head>

<body style="margin:0;padding:0;background:${bg} !important;background-color:${bg} !important;color:#ffffff;">
  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${preheader}
  </div>

  <!-- Outer background wrapper -->
  <table role="presentation" class="bg" width="100%" cellspacing="0" cellpadding="0" border="0"
         bgcolor="${bg}"
         style="background:${bg} !important;background-color:${bg} !important;">
    <tr>
      <td align="center"
          bgcolor="${bg}"
          style="padding:28px 12px;background:${bg} !important;background-color:${bg} !important;">
        <!-- Container -->
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0"
               bgcolor="${bg}"
               style="width:600px;max-width:600px;background:${bg} !important;background-color:${bg} !important;">

          <!-- Header -->
          <tr>
            <td class="px" style="padding:0 24px 14px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="font-family:Segoe UI,Tahoma,Arial,sans-serif;">
                    <div style="font-weight:900;font-style:italic;font-size:22px;letter-spacing:-0.6px;text-transform:uppercase;">
                      <span style="color:#ffffff;">${brand}</span><span style="color:#6366f1;">.dev</span>
                    </div>
                    <div style="margin-top:6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${muted};">
                      Secure Sign-In • Magic Link
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="cardBg cardPad"
                bgcolor="${card}"
                style="background:${card} !important;background-color:${card} !important;border:1px solid ${border};border-radius:24px;padding:26px;direction:rtl;text-align:right;">

              <!-- Badge -->
              <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:${badgeBg};border:1px solid ${badgeBorder};color:#a5b4fc;font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:12px;font-weight:700;">
                تسجيل دخول آمن • رابط سحري
              </div>

              <div style="height:16px;line-height:16px;">&nbsp;</div>

              <div class="h1" style="font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:26px;line-height:1.45;font-weight:900;color:#ffffff;">
                رابط تسجيل الدخول جاهز
              </div>

              <div style="height:10px;line-height:10px;">&nbsp;</div>

              <div class="p text" style="font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:15px;line-height:2;color:${text};">
                اضغط الزر بالأسفل لتسجيل الدخول إلى <strong style="color:#ffffff;">${brand}</strong>.
                هذا الرابط صالح لمدة <strong style="color:#ffffff;">15 دقيقة</strong> ويعمل لمرة واحدة فقط.
              </div>

              <div style="height:16px;line-height:16px;">&nbsp;</div>

              <!-- Info box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     bgcolor="${infoBg}"
                     style="background:${infoBg} !important;background-color:${infoBg} !important;border:1px dashed ${infoBorder};border-radius:16px;">
                <tr>
                  <td style="padding:16px 16px;font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#94a3b8;font-size:13px;line-height:1.8;">
                    إذا لم تطلب هذه الرسالة، تجاهلها. لا تشارك الرابط مع أحد.
                  </td>
                </tr>
              </table>

              <div style="height:18px;line-height:18px;">&nbsp;</div>

              <!-- Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="btn" style="width:auto;">
                <tr>
                  <td align="center" bgcolor="#6366f1" style="border-radius:14px;">
                    <a href="${loginUrl}"
                       style="display:inline-block;padding:14px 18px;font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:14px;font-weight:800;color:#0b1120;text-decoration:none;border-radius:14px;background:#ffffff;">
                      تسجيل الدخول الآن
                    </a>
                  </td>
                </tr>
              </table>

              <div style="height:14px;line-height:14px;">&nbsp;</div>

              <div class="p" style="font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:13px;line-height:1.9;color:${muted};">
                إذا لم يعمل الزر، انسخ هذا الرابط وافتحه في المتصفح:<br>
                <span style="color:#a5b4fc;word-break:break-all;">${loginUrl}</span>
              </div>

              <div style="margin-top:18px;border-top:1px solid ${border};"></div>

              <div style="text-align:center;margin-top:14px;font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:12px;line-height:1.8;color:#475569;">
                © 2026 ${brand}. <span style="color:#334155;">${domain}</span><br>
                Designed for developers in restricted regions.
              </div>
            </td>
          </tr>

          <tr>
            <td style="height:18px;line-height:18px;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function magicLinkEmailText(params: {
  brandName?: string;
  loginUrl: string;
}) {
  const brand = params.brandName ?? "LinkSy";
  return `رابط تسجيل الدخول جاهز (${brand})

سجّل الدخول عبر الرابط (صالح لمدة 15 دقيقة ولمرة واحدة):
${params.loginUrl}

إذا لم تطلب هذه الرسالة، تجاهلها.`;
}
