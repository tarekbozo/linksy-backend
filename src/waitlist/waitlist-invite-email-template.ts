// <!DOCTYPE html>
// <html lang="ar" dir="rtl">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//   <title>LinkSy — العد التنازلي بدأ 🚀</title>
//   <style>
//     @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');

//     * { margin: 0; padding: 0; box-sizing: border-box; }

//     body {
//       background-color: #06080f;
//       font-family: 'Cairo', Arial, sans-serif;
//       color: #e2e8f0;
//       direction: rtl;
//       -webkit-font-smoothing: antialiased;
//     }

//     .wrapper {
//       max-width: 580px;
//       margin: 0 auto;
//       padding: 40px 16px;
//     }

//     /* Header */
//     .header {
//       text-align: center;
//       margin-bottom: 32px;
//     }

//     .logo {
//       display: inline-flex;
//       align-items: center;
//       gap: 10px;
//       background: linear-gradient(135deg, #1e1b4b, #0f172a);
//       border: 1px solid rgba(99,102,241,0.3);
//       border-radius: 16px;
//       padding: 12px 24px;
//       margin-bottom: 24px;
//     }

//     .logo-dot {
//       width: 10px;
//       height: 10px;
//       background: #6366f1;
//       border-radius: 50%;
//       box-shadow: 0 0 12px rgba(99,102,241,0.8);
//     }

//     .logo-text {
//       font-size: 20px;
//       font-weight: 900;
//       color: #fff;
//       letter-spacing: -0.5px;
//     }

//     .logo-text span {
//       color: #818cf8;
//     }

//     /* Card */
//     .card {
//       background: linear-gradient(160deg, #0d1220, #080d18);
//       border: 1px solid rgba(255,255,255,0.08);
//       border-radius: 24px;
//       overflow: hidden;
//       box-shadow: 0 40px 80px rgba(0,0,0,0.6);
//     }

//     /* Hero section */
//     .hero {
//       background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 60%, #080d18 100%);
//       padding: 48px 40px 40px;
//       text-align: center;
//       position: relative;
//       border-bottom: 1px solid rgba(99,102,241,0.15);
//     }

//     .hero-badge {
//       display: inline-block;
//       background: rgba(99,102,241,0.15);
//       border: 1px solid rgba(99,102,241,0.3);
//       border-radius: 100px;
//       padding: 6px 16px;
//       font-size: 11px;
//       font-weight: 700;
//       color: #a5b4fc;
//       letter-spacing: 0.1em;
//       text-transform: uppercase;
//       margin-bottom: 20px;
//     }

//     .hero h1 {
//       font-size: 32px;
//       font-weight: 900;
//       color: #fff;
//       line-height: 1.3;
//       margin-bottom: 12px;
//     }

//     .hero h1 span {
//       background: linear-gradient(90deg, #818cf8, #6366f1);
//       -webkit-background-clip: text;
//       -webkit-text-fill-color: transparent;
//       background-clip: text;
//     }

//     .hero p {
//       font-size: 15px;
//       color: #94a3b8;
//       line-height: 1.7;
//       max-width: 420px;
//       margin: 0 auto;
//     }

//     /* Body */
//     .body {
//       padding: 40px;
//     }

//     .greeting {
//       font-size: 16px;
//       color: #cbd5e1;
//       margin-bottom: 20px;
//       line-height: 1.7;
//     }

//     .greeting strong {
//       color: #fff;
//       font-weight: 700;
//     }

//     /* Countdown section */
//     .countdown-box {
//       background: rgba(99,102,241,0.06);
//       border: 1px solid rgba(99,102,241,0.2);
//       border-radius: 16px;
//       padding: 24px;
//       text-align: center;
//       margin: 28px 0;
//     }

//     .countdown-label {
//       font-size: 11px;
//       font-weight: 700;
//       color: #6366f1;
//       letter-spacing: 0.12em;
//       text-transform: uppercase;
//       margin-bottom: 12px;
//     }

//     .countdown-text {
//       font-size: 22px;
//       font-weight: 900;
//       color: #fff;
//       margin-bottom: 6px;
//     }

//     .countdown-sub {
//       font-size: 13px;
//       color: #64748b;
//     }

//     /* Feature list */
//     .features {
//       margin: 28px 0;
//     }

//     .features-title {
//       font-size: 13px;
//       font-weight: 700;
//       color: #64748b;
//       letter-spacing: 0.08em;
//       text-transform: uppercase;
//       margin-bottom: 16px;
//     }

//     .feature-item {
//       display: flex;
//       align-items: flex-start;
//       gap: 14px;
//       margin-bottom: 14px;
//     }

//     .feature-icon {
//       width: 32px;
//       height: 32px;
//       background: rgba(99,102,241,0.1);
//       border: 1px solid rgba(99,102,241,0.2);
//       border-radius: 10px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 15px;
//       flex-shrink: 0;
//       margin-top: 2px;
//     }

//     .feature-text strong {
//       display: block;
//       font-size: 14px;
//       font-weight: 700;
//       color: #e2e8f0;
//       margin-bottom: 2px;
//     }

//     .feature-text span {
//       font-size: 12px;
//       color: #64748b;
//       line-height: 1.5;
//     }

//     /* Referral box */
//     .referral-box {
//       background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06));
//       border: 1px solid rgba(99,102,241,0.25);
//       border-radius: 20px;
//       padding: 28px;
//       margin: 28px 0;
//       text-align: center;
//     }

//     .referral-emoji {
//       font-size: 36px;
//       margin-bottom: 12px;
//     }

//     .referral-box h3 {
//       font-size: 18px;
//       font-weight: 900;
//       color: #fff;
//       margin-bottom: 8px;
//     }

//     .referral-box p {
//       font-size: 13px;
//       color: #94a3b8;
//       line-height: 1.6;
//       margin-bottom: 20px;
//     }

//     .referral-box p strong {
//       color: #a5b4fc;
//     }

//     /* CTA Button */
//     .cta-button {
//       display: block;
//       background: linear-gradient(135deg, #6366f1, #4f46e5);
//       color: #fff !important;
//       text-decoration: none;
//       font-size: 15px;
//       font-weight: 900;
//       padding: 16px 32px;
//       border-radius: 14px;
//       text-align: center;
//       box-shadow: 0 8px 32px rgba(99,102,241,0.4);
//       letter-spacing: 0.02em;
//       margin-bottom: 12px;
//     }

//     .cta-secondary {
//       display: block;
//       color: #6366f1 !important;
//       text-decoration: none;
//       font-size: 13px;
//       font-weight: 600;
//       text-align: center;
//       padding: 10px;
//     }

//     /* Divider */
//     .divider {
//       height: 1px;
//       background: rgba(255,255,255,0.06);
//       margin: 32px 0;
//     }

//     /* Token reward */
//     .token-reward {
//       display: flex;
//       align-items: center;
//       gap: 16px;
//       background: rgba(255,255,255,0.03);
//       border: 1px solid rgba(255,255,255,0.07);
//       border-radius: 14px;
//       padding: 16px 20px;
//       margin-bottom: 14px;
//     }

//     .token-badge {
//       background: linear-gradient(135deg, #6366f1, #8b5cf6);
//       color: #fff;
//       font-size: 11px;
//       font-weight: 900;
//       padding: 6px 12px;
//       border-radius: 8px;
//       white-space: nowrap;
//       flex-shrink: 0;
//     }

//     .token-desc {
//       font-size: 13px;
//       color: #94a3b8;
//       line-height: 1.5;
//     }

//     .token-desc strong {
//       color: #e2e8f0;
//     }

//     /* Footer */
//     .footer {
//       padding: 32px 40px;
//       border-top: 1px solid rgba(255,255,255,0.06);
//       text-align: center;
//     }

//     .footer p {
//       font-size: 12px;
//       color: #334155;
//       line-height: 1.7;
//       margin-bottom: 6px;
//     }

//     .footer a {
//       color: #475569;
//       text-decoration: none;
//     }

//     .social-links {
//       display: flex;
//       justify-content: center;
//       gap: 16px;
//       margin-top: 16px;
//     }

//     .social-link {
//       font-size: 12px;
//       color: #475569 !important;
//       text-decoration: none;
//       padding: 6px 14px;
//       border: 1px solid rgba(255,255,255,0.06);
//       border-radius: 8px;
//     }

//     /* Responsive */
//     @media (max-width: 480px) {
//       .hero { padding: 36px 24px 32px; }
//       .body { padding: 28px 24px; }
//       .footer { padding: 24px; }
//       .hero h1 { font-size: 26px; }
//       .token-reward { flex-direction: column; text-align: center; }
//     }
//   </style>
// </head>
// <body>
//   <div class="wrapper">

//     <!-- Logo -->
//     <div class="header">
//       <div class="logo">
//         <div class="logo-dot"></div>
//         <div class="logo-text">Link<span>Sy</span></div>
//       </div>
//     </div>

//     <!-- Main Card -->
//     <div class="card">

//       <!-- Hero -->
//       <div class="hero">
//         <div class="hero-badge">🚀 العد التنازلي بدأ</div>
//         <h1>أنت من <span>أوائل المسجلين</span><br/>في LinkSy</h1>
//         <p>
//           منصة الذكاء الاصطناعي المصممة خصيصاً للمستخدمين في سوريا والمنطقة العربية — قريباً جداً
//         </p>
//       </div>

//       <!-- Body -->
//       <div class="body">

//         <p class="greeting">
//           مرحباً، 👋<br/><br/>
//           شكراً لتسجيلك المبكر في <strong>LinkSy</strong>. أنت من بين أولى الأشخاص الذين آمنوا بهذا المشروع، وهذا يعني الكثير لنا.<br/><br/>
//           اليوم نُعلن رسمياً: <strong>العد التنازلي للإطلاق قد بدأ.</strong>
//         </p>

//         <!-- Countdown -->
//         <div class="countdown-box">
//           <div class="countdown-label">⏳ موعد الإطلاق</div>
//           <div class="countdown-text">قريباً جداً — كن مستعداً</div>
//           <div class="countdown-sub">سنُخبرك فور فتح الأبواب</div>
//         </div>

//         <!-- What is LinkSy -->
//         <div class="features">
//           <div class="features-title">ماذا ستحصل معنا؟</div>

//           <div class="feature-item">
//             <div class="feature-icon">🤖</div>
//             <div class="feature-text">
//               <strong>أقوى نماذج الذكاء الاصطناعي</strong>
//               <span>وصول مباشر لـ Claude وGemini وGPT — كل شيء في مكان واحد</span>
//             </div>
//           </div>

//           <div class="feature-item">
//             <div class="feature-icon">🌍</div>
//             <div class="feature-text">
//               <strong>مصمم للمنطقة العربية</strong>
//               <span>ادفع بالطرق المتاحة محلياً، واستخدم الخدمة بدون قيود جغرافية</span>
//             </div>
//           </div>

//           <div class="feature-item">
//             <div class="feature-icon">⚡</div>
//             <div class="feature-text">
//               <strong>سريع وبسيط</strong>
//               <span>واجهة مصممة لتوفير وقتك — كتابة، ترجمة، برمجة، دراسة وأكثر</span>
//             </div>
//           </div>

//           <div class="feature-item">
//             <div class="feature-icon">🔒</div>
//             <div class="feature-text">
//               <strong>خصوصيتك أولاً</strong>
//               <span>محادثاتك لا تُستخدم لتدريب أي نموذج</span>
//             </div>
//           </div>
//         </div>

//         <div class="divider"></div>

//         <!-- Referral -->
//         <div class="referral-box">
//           <div class="referral-emoji">🎁</div>
//           <h3>ادعُ أصدقاءك — واكسب رموزاً مجانية</h3>
//           <p>
//             لكل صديق يسجل عن طريقك، ستحصل على <strong>رموز إضافية مجانية</strong> تُضاف تلقائياً لحسابك عند الإطلاق.
//           </p>

//           <!-- Token rewards -->
//           <div class="token-reward">
//             <div class="token-badge">صديق واحد</div>
//             <div class="token-desc"><strong>+5,000 رمز مجاني</strong> تُضاف لرصيدك</div>
//           </div>
//           <div class="token-reward">
//             <div class="token-badge">3 أصدقاء</div>
//             <div class="token-desc"><strong>+20,000 رمز مجاني</strong> + أولوية في الوصول</div>
//           </div>
//           <div class="token-reward">
//             <div class="token-badge">5+ أصدقاء</div>
//             <div class="token-desc"><strong>شهر مجاني كامل</strong> على باقة Starter 🎉</div>
//           </div>

//           <br/>

//           <a href="https://linksy.dev?ref=YOUR_REF_CODE" class="cta-button">
//             🔗 شارك رابط الدعوة الخاص بك
//           </a>
//           <a href="https://linksy.dev" class="cta-secondary">
//             أو زُر الموقع مباشرة ←
//           </a>
//         </div>

//         <div class="divider"></div>

//         <p style="font-size: 14px; color: #64748b; text-align: center; line-height: 1.7;">
//           شكراً لثقتك بنا من البداية 🙏<br/>
//           فريق LinkSy
//         </p>

//       </div>

//       <!-- Footer -->
//       <div class="footer">
//         <p>وصلك هذا البريد لأنك سجلت مسبقاً على قائمة الانتظار في linksy.dev</p>
//         <p>
//           <a href="https://linksy.dev/unsubscribe">إلغاء الاشتراك</a>
//           &nbsp;·&nbsp;
//           <a href="https://linksy.dev/privacy">سياسة الخصوصية</a>
//         </p>
//         <div class="social-links">
//           <a href="https://linksy.dev" class="social-link">🌐 الموقع</a>
//           <a href="https://t.me/linksy" class="social-link">✈️ تيليغرام</a>
//         </div>
//         <p style="margin-top: 16px;">© 2025 LinkSy. جميع الحقوق محفوظة.</p>
//       </div>

//     </div>

//   </div>
// </body>
// </html>
