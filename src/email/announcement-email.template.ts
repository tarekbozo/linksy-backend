export function announcementEmailHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LinkSy — تحديثات جديدة وأسعار محدّثة</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a12; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #e2e8f0; direction: rtl; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #111827; border-radius: 16px; border: 1px solid rgba(99,102,241,0.25); overflow: hidden; }
    .header { background: linear-gradient(135deg, #1a0533 0%, #1e1040 50%, #0f172a 100%); padding: 36px 32px 28px; text-align: center; border-bottom: 1px solid rgba(168,85,247,0.3); }
    .logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
    .logo-l { color: #6366f1; }
    .logo-rest { color: #fff; }
    .badge { display: inline-block; margin-top: 14px; padding: 5px 16px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background: rgba(234,179,8,0.15); border: 1px solid rgba(234,179,8,0.35); color: #fbbf24; }
    .header h1 { margin-top: 14px; font-size: 22px; font-weight: 900; color: #fff; line-height: 1.4; }
    .header p { margin-top: 8px; font-size: 14px; color: #94a3b8; }
    .body { padding: 28px 32px; }
    .section-title { font-size: 13px; font-weight: 700; color: #6366f1; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
    .feature-grid { display: grid; gap: 10px; }
    .feature-item { display: flex; align-items: flex-start; gap: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 12px 14px; }
    .feature-icon { font-size: 20px; flex-shrink: 0; }
    .feature-text h3 { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 2px; }
    .feature-text p { font-size: 12px; color: #64748b; line-height: 1.5; }
    .divider { height: 1px; background: rgba(255,255,255,0.07); margin: 24px 0; }
    .plans-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .plan-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px; text-align: center; }
    .plan-card.featured { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.08); }
    .plan-name { font-size: 13px; font-weight: 800; color: #e2e8f0; margin-bottom: 4px; }
    .plan-price-old { font-size: 11px; color: #64748b; text-decoration: line-through; margin-bottom: 2px; }
    .plan-price-new { font-size: 16px; font-weight: 900; color: #fbbf24; }
    .plan-price-full { font-size: 13px; font-weight: 700; color: #94a3b8; }
    .plan-credits { font-size: 11px; color: #64748b; margin-top: 4px; }
    .offer-banner { background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.25); border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; text-align: center; }
    .offer-banner p { font-size: 13px; font-weight: 700; color: #fbbf24; }
    .offer-banner span { font-size: 12px; color: #94a3b8; display: block; margin-top: 4px; }
    .packs-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 20px; }
    .pack-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 10px; text-align: center; }
    .pack-credits { font-size: 13px; font-weight: 800; color: #e2e8f0; }
    .pack-price { font-size: 11px; color: #64748b; margin-top: 2px; }
    .pack-validity { font-size: 10px; color: #4b5563; margin-top: 2px; }
    .cta-block { text-align: center; padding: 20px 0 4px; }
    .cta-btn { display: inline-block; padding: 14px 40px; border-radius: 100px; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; font-size: 15px; font-weight: 900; text-decoration: none; }
    .footer { padding: 20px 32px 28px; text-align: center; }
    .footer p { font-size: 11px; color: #374151; line-height: 1.8; }
    .footer a { color: #6366f1; text-decoration: none; }
    @media (max-width: 480px) {
      .body { padding: 20px 18px; }
      .plans-row { grid-template-columns: 1fr 1fr; }
      .packs-row { grid-template-columns: 1fr 1fr 1fr; }
      .cta-btn { padding: 13px 28px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <!-- Header -->
      <div class="header">
        <div class="logo"><span class="logo-l">L</span><span class="logo-rest">inkSy</span></div>
        <div class="badge">⚡ تحديث جديد</div>
        <h1>المنصة كبرت — ميزات جديدة وأسعار محدّثة</h1>
        <p>أخبار مهمة لكل مستخدمي LinkSy</p>
      </div>

      <!-- Body -->
      <div class="body">

        <!-- What's new -->
        <div class="section-title">✨ الجديد في المنصة</div>
        <div class="feature-grid">
          <div class="feature-item">
            <div class="feature-icon">🎙️</div>
            <div class="feature-text">
              <h3>تحويل الصوت إلى نص</h3>
              <p>حوّل محاضراتك وملاحظاتك الصوتية إلى نص جاهز فورًا — متاح لباقة الطالب فأعلى</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🎨</div>
            <div class="feature-text">
              <h3>توليد الصور بالذكاء الاصطناعي</h3>
              <p>أنشئ صور احترافية من وصف نصي — متاح لباقة المستقل فأعلى، حتى 30 صورة/شهر</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📚</div>
            <div class="feature-text">
              <h3>مساعد الدراسة المحسّن</h3>
              <p>تلخيص، شرح مبسط، أسئلة امتحانية — كل ما تحتاجه لجلسة دراسة واحدة</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">⚡</div>
            <div class="feature-text">
              <h3>شحن الرصيد (Top-Up)</h3>
              <p>الآن يمكنك شحن رصيد إضافي فوق أي باقة — لا تتوقف عن العمل عند نفاد الرصيد</p>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Launch offer -->
        <div class="offer-banner">
          <p>🔥 عرض الإطلاق — الشهر الأول بنصف السعر</p>
          <span>ينتهي العرض قريبًا — لا تفوّته</span>
        </div>

        <!-- Plans -->
        <div class="section-title">💳 الباقات المحدّثة</div>
        <div class="plans-row">
          <div class="plan-card">
            <div class="plan-name">طالب</div>
            <div class="plan-price-old">15,000 ل.س</div>
            <div class="plan-price-new">7,500 ل.س</div>
            <div class="plan-credits">300 رصيد / شهر</div>
          </div>
          <div class="plan-card featured">
            <div class="plan-name">مستقل ⭐</div>
            <div class="plan-price-old">30,000 ل.س</div>
            <div class="plan-price-new">15,000 ل.س</div>
            <div class="plan-credits">800 رصيد / شهر</div>
          </div>
        </div>
        <div class="plans-row">
          <div class="plan-card">
            <div class="plan-name">مبدع</div>
            <div class="plan-price-old">50,000 ل.س</div>
            <div class="plan-price-new">25,000 ل.س</div>
            <div class="plan-credits">1,500 رصيد / شهر</div>
          </div>
          <div class="plan-card">
            <div class="plan-name">مجاني</div>
            <div class="plan-price-full">مجانًا دائمًا</div>
            <div class="plan-credits">10 رصيد / يوم</div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Top-up packs -->
        <div class="section-title">🔋 باقات الشحن الإضافي</div>
        <div class="packs-row">
          <div class="pack-card">
            <div class="pack-credits">200 رصيد</div>
            <div class="pack-price">5,000 ل.س</div>
            <div class="pack-validity">صالح 90 يوم</div>
          </div>
          <div class="pack-card">
            <div class="pack-credits">600 رصيد</div>
            <div class="pack-price">10,000 ل.س</div>
            <div class="pack-validity">الأكثر طلباً</div>
          </div>
          <div class="pack-card">
            <div class="pack-credits">1,400 رصيد</div>
            <div class="pack-price">20,000 ل.س</div>
            <div class="pack-validity">الأوفر</div>
          </div>
        </div>

        <!-- CTA -->
        <div class="cta-block">
          <a href="https://linksy.dev/pricing" class="cta-btn">اكتشف الباقات ←</a>
        </div>

      </div>

      <!-- Footer -->
      <div class="footer">
        <p>
          وصلك هذا البريد لأنك مسجّل في <a href="https://linksy.dev">linksy.dev</a><br/>
          للمساعدة أو الاستفسار عن الأسعار تواصل معنا عبر المنصة
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}
