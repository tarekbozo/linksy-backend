export function waitlistEmailHtml(params: {
  brandName?: string;
  domain?: string;
  ctaUrl?: string;
  locale?: "ar" | "en";
}) {
  const brand = params.brandName ?? "LinkSy";
  const domain = params.domain ?? "linksy.dev";
  const ctaUrl = params.ctaUrl ?? "https://linksy.dev/#how";

  // Preheader (what Gmail shows next to subject). Keep it short and non-repetitive.
  const preheader =
    "تم تأكيد إدراجك في قائمة الانتظار. سنرسل لك الدعوة فور فتح دفعة جديدة.";

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>${brand} | تأكيد قائمة الانتظار</title>

  <style>
    /* Some clients respect <style>, some don't. Inline still matters most. */
    @media (max-width: 600px) {
      .container { width: 100% !important; }
      .px { padding-left: 16px !important; padding-right: 16px !important; }
      .card { padding: 18px !important; }
      .h1 { font-size: 22px !important; line-height: 1.4 !important; }
      .p { font-size: 14px !important; line-height: 1.9 !important; }
      .btn { width: 100% !important; }
    }
  </style>
</head>

<body style="margin:0;padding:0;background:#030712;color:#ffffff;">
  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#030712;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <!-- Container -->
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;">
          <!-- Header -->
          <tr>
            <td class="px" style="padding:0 24px 14px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="font-family:Segoe UI,Tahoma,Arial,sans-serif;">
                    <div style="font-weight:900;font-style:italic;font-size:22px;letter-spacing:-0.6px;text-transform:uppercase;">
                      <span style="color:#ffffff;">${brand}</span><span style="color:#6366f1;">.dev</span>
                    </div>
                    <div style="margin-top:6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#64748b;">
                      Stockholm Nodes • On Standby
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="card" style="background:#0b1120;border:1px solid #1e293b;border-radius:24px;padding:26px;direction:rtl;text-align:right;">
              <!-- Badge -->
              <div style="direction:rtl;text-align:right;display:inline-block;padding:8px 14px;border-radius:999px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);color:#a5b4fc;font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:12px;font-weight:700;">
                تم التأكيد • قائمة الانتظار
              </div>

              <div style="height:16px;line-height:16px;">&nbsp;</div>

              <div class="h1" style="direction:rtl;text-align:right;direction:rtl;text-align:right;font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:26px;line-height:1.45;font-weight:900;color:#ffffff;">
                تم إدراجك في قائمة الانتظار بنجاح
              </div>

              <div style="height:10px;line-height:10px;">&nbsp;</div>

              <div class="p" style="direction:rtl;text-align:right;font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:15px;line-height:2;color:#cbd5e1;">
                نحن نعمل حالياً على تهيئة البنية التحتية في
                <strong style="color:#ffffff;">ستوكهولم</strong>
                لضمان وصول أسرع وأكثر استقراراً داخل سوريا.
              </div>

              <div style="height:16px;line-height:16px;">&nbsp;</div>

              <!-- Info box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                style="background:rgba(255,255,255,0.03);border:1px dashed #334155;border-radius:16px;">
                <tr>
                  <td style="direction:rtl;text-align:right;padding:16px 16px;font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#94a3b8;font-size:13px;line-height:1.8;">
                    <strong style="color:#e2e8f0;">v1.0 Alpha</strong>
                    <span style="color:#64748b;">•</span>
                    سيتم إشعارك فور فتح دفعات جديدة من الدعوات.
                  </td>
                </tr>
              </table>

              <div style="height:18px;line-height:18px;">&nbsp;</div>

              <!-- Bulletproof button (reliable across clients) -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="btn" style="width:auto;">
                <tr>
                  <td align="center" bgcolor="#6366f1" style="direction:rtl;text-align:right;border-radius:14px;">
                    <a href="${ctaUrl}"
                       style="display:inline-block;padding:14px 18px;font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:14px;font-weight:800;color:#0b1120;text-decoration:none;border-radius:14px;background:#ffffff;">
                      شاهد كيف يعمل LinkSy
                    </a>
                  </td>
                </tr>
              </table>

              <div style="height:14px;line-height:14px;">&nbsp;</div>

              <div class="p" style="direction:rtl;text-align:right;font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:13px;line-height:1.9;color:#64748b;">
                إذا لم تطلب هذه الرسالة، يمكنك تجاهلها.
              </div>

              <div style="margin-top:18px;border-top:1px solid #1e293b;"></div>

              <div style="text-align:center;margin-top:14px;font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:12px;line-height:1.8;color:#475569;">
                © 2026 ${brand}. <span style="color:#334155;">${domain}</span><br>
                Designed for developers in restricted regions.
              </div>
            </td>
          </tr>

          <!-- Footer spacing -->
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

export function waitlistEmailText() {
  return `تم تأكيد إدراجك في قائمة الانتظار بنجاح (LinkSy).

نحن نعمل على تهيئة البنية التحتية في ستوكهولم لضمان وصول أسرع وأكثر استقراراً داخل سوريا.
سيتم إشعارك فور فتح دفعات جديدة من الدعوات.

LinkSy.dev`;
}
