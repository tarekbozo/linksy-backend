"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passActivatedEmailHtml = passActivatedEmailHtml;
exports.passActivatedEmailText = passActivatedEmailText;
function planLabel(plan) {
    const map = {
        FREE: 'المجاني',
        STARTER: 'ستارتر',
        PRO: 'برو',
        ELITE: 'إليت',
    };
    return map[plan] ?? plan;
}
function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('ar-SY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}
function passActivatedEmailHtml({ plan, endsAt, dashboardUrl, }) {
    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>تم تفعيل باقتك | LinkSy</title>
</head>
<body style="margin:0;padding:0;background:#030712;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#030712;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#0d1117;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
                ⚡ LinkSy.dev
              </p>
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);font-weight:600;letter-spacing:2px;text-transform:uppercase;">
                Stockholm Infrastructure
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <!-- Success icon -->
              <div style="text-align:center;margin-bottom:32px;">
                <div style="display:inline-block;width:64px;height:64px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:50%;line-height:64px;font-size:28px;">
                  ✅
                </div>
              </div>

              <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;color:#fff;text-align:center;">
                تم تفعيل باقتك بنجاح!
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;text-align:center;line-height:1.6;">
                مرحباً! تم تأكيد دفعتك وتفعيل اشتراكك في LinkSy.
              </p>

              <!-- Plan details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.2);border-radius:16px;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                          <span style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">الباقة</span>
                        </td>
                        <td style="padding:8px 0;text-align:left;border-bottom:1px solid rgba(255,255,255,0.05);">
                          <span style="color:#a5b4fc;font-size:15px;font-weight:900;">LinkSy ${planLabel(plan)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">صالحة حتى</span>
                        </td>
                        <td style="padding:8px 0;text-align:left;">
                          <span style="color:#fff;font-size:15px;font-weight:700;">${fmtDate(endsAt)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${dashboardUrl}"
                   style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:14px;font-weight:900;letter-spacing:0.5px;box-shadow:0 8px 32px rgba(79,70,229,0.3);">
                  اذهب إلى لوحة التحكم ←
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="margin:0;font-size:11px;color:#334155;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                LinkSy.io • Stockholm • Damascus • 2026
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
function passActivatedEmailText({ plan, endsAt, dashboardUrl, }) {
    return `
تم تفعيل باقتك في LinkSy!

الباقة: LinkSy ${planLabel(plan)}
صالحة حتى: ${fmtDate(endsAt)}

اذهب إلى لوحة التحكم: ${dashboardUrl}

LinkSy.io • Stockholm • Damascus • 2026
`.trim();
}
//# sourceMappingURL=pass-activated-email.template.js.map