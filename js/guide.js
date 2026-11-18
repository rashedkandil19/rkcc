import { routes, $, S } from './core.js';

routes.guide = async v => {
  const steps = [
    'راجع اللغة والعملة وبداية الأسبوع من الإعدادات',
    'أنشئ مساحات العمل التي تمثل أنشطتك',
    'أضف حساباتك المالية وأرصدتها الافتتاحية',
    'أضف العملاء والمشروعات الأساسية',
    'سجّل أول مجموعة من المهام والمعاملات',
    'احفظ نسخة احتياطية من بياناتك'
  ];
  const key = 'rk_guide_checklist_v1';
  let done = [];
  try { done = JSON.parse(localStorage.getItem(key) || '[]'); } catch { done = []; }
  const pct = Math.round(done.length / steps.length * 100);
  const link = (hash, text) => `<a class="pri" href="#/${hash}" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center">${text}</a>`;
  v.innerHTML = `
  <style>
    .rk-guide{max-width:1080px;margin:auto;direction:rtl;text-align:right}
    .rk-guide-hero{padding:26px;border-radius:18px;background:linear-gradient(135deg,var(--card),var(--bg));border:1px solid var(--line)}
    .rk-guide-hero h1{font-size:clamp(25px,4vw,36px);margin:0 0 8px}
    .rk-guide-muted{color:var(--muted);line-height:1.9}
    .rk-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:14px 0}
    .rk-guide-card{padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--card)}
    .rk-guide-card h3{margin:0 0 8px;font-size:17px}
    .rk-guide-card p,.rk-guide-card li{line-height:1.9;color:var(--muted)}
    .rk-guide-card ol,.rk-guide-card ul{padding-right:20px;padding-left:0;margin:8px 0}
    .rk-guide-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
    .rk-guide-actions a{padding:9px 13px;border-radius:9px}
    .rk-guide-progress{height:8px;background:var(--line);border-radius:20px;overflow:hidden;margin:12px 0}
    .rk-guide-progress span{display:block;height:100%;width:${pct}%;background:var(--pri,#0ea5e9);border-radius:20px;transition:width .2s}
    .rk-guide-check{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);line-height:1.7}
    .rk-guide-check input{margin-top:5px;accent-color:var(--pri)}
    .rk-guide-note{padding:13px;border-radius:12px;background:var(--bg);border:1px solid var(--line);line-height:1.9}
    @media(max-width:600px){.rk-guide-hero{padding:18px}.rk-guide-card{padding:15px}}
  </style>
  <div class="rk-guide">
    <section class="rk-guide-hero">
      <span class="badge">دليل مبسط · ابدأ من هنا</span>
      <h1>خلّي RK Control Center ينظّم يومك وشغلك</h1>
      <p class="rk-guide-muted">الدليل ده هيمشي معاك خطوة بخطوة: تظبط النظام مرة واحدة، تستخدمه كل يوم في دقائق، وتراجع شغلك وفلوسك من غير ما تتوه بين الصفحات.</p>
      <div class="rk-guide-actions">${link('overview','افتح النظرة العامة')} ${link('settings','اضبط الإعدادات')}</div>
    </section>

    <section class="rk-guide-grid">
      <article class="rk-guide-card"><h3>١. ابدأ صح</h3><p>جهّز المساحات والحسابات والمشروعات قبل ما تدخل بيانات كتير. التنظيم من البداية بيخلّي البحث والتقارير أوضح.</p>${link('projects','المشروعات ومساحات العمل')}</article>
      <article class="rk-guide-card"><h3>٢. سجّل يومك بسهولة</h3><p>استخدم «إضافة سريعة» لتسجيل مهمة أو نشاط أو معاملة من أي صفحة، وحدّث الحالة أولًا بأول.</p>${link('daily','السجل اليومي')}</article>
      <article class="rk-guide-card"><h3>٣. تابع الأرقام</h3><p>سجّل الدخل والمصروف والفواتير في مكانها الصحيح، وراجع التحصيلات والمستحقات بشكل دوري.</p>${link('finance','افتح الإدارة المالية')}</article>
      <article class="rk-guide-card"><h3>٤. راجع الأداء</h3><p>استخدم النظرة العامة للمتابعة السريعة، والتقارير للمقارنة وفهم الاتجاهات خلال فترة محددة.</p>${link('reports','افتح التقارير')}</article>
    </section>

    <section class="rk-guide-card" style="margin:14px 0">
      <h2 style="margin-top:0">إعداد أول مرة — قائمة قصيرة</h2>
      <p class="rk-guide-muted">علّم على كل خطوة بعد تنفيذها. تقدمك بيتحفظ على نفس المتصفح.</p>
      <div class="rk-guide-progress"><span id="rkGuideBar"></span></div>
      <p class="small muted" id="rkGuideCount">أنجزت ${done.length} من ${steps.length}</p>
      <div id="rkGuideSteps">${steps.map((s,i)=>`<label class="rk-guide-check"><input type="checkbox" data-step="${i}" ${done.includes(i)?'checked':''}><span>${s}</span></label>`).join('')}</div>
    </section>

    <h2>روتين عملي من غير تعقيد</h2>
    <section class="rk-guide-grid">
      <article class="rk-guide-card"><h3>كل صباح — ٥ دقائق</h3><ol><li>افتح Overview.</li><li>راجع المهام المستحقة والمتأخرة.</li><li>اختار أهم ٣ مهام لليوم.</li></ol></article>
      <article class="rk-guide-card"><h3>أثناء الشغل</h3><ol><li>حدّث حالة المهمة عند بدء التنفيذ.</li><li>سجّل النشاط واربطه بالمشروع المناسب.</li><li>سجّل أي دخل أو مصروف وقت حدوثه.</li></ol></article>
      <article class="rk-guide-card"><h3>آخر اليوم — ٥ دقائق</h3><ol><li>راجع المهام المفتوحة.</li><li>أكمل سجل اليوم والملاحظات.</li><li>تأكد إن الوقت والمعاملات اتسجلوا صح.</li></ol></article>
      <article class="rk-guide-card"><h3>كل أسبوع أو شهر</h3><ol><li>راجع الفواتير والمبالغ المستحقة.</li><li>قارن التقارير بفترة مماثلة.</li><li>راجع المشروعات وخد نسخة احتياطية.</li></ol></article>
    </section>

    <h2>كل صفحة بتعمل إيه؟</h2>
    <section class="rk-guide-card">
      <ul>
        <li><b>Overview — النظرة العامة:</b> لقطة سريعة عن وضعك الحالي وأهم ما يحتاج انتباهك.</li>
        <li><b>Daily Log — السجل اليومي:</b> تسجيل الأنشطة والوقت والملاحظات اليومية.</li>
        <li><b>Tasks — المهام:</b> ترتيب المطلوب حسب الحالة والأولوية والموعد.</li>
        <li><b>Projects & Workspaces — المشروعات:</b> تجميع العمل حسب النشاط أو العميل أو المجال.</li>
        <li><b>Finance — المالية:</b> الحسابات والمعاملات والفواتير والمدفوعات والمستحقات.</li>
        <li><b>Fitness & Habits — اللياقة والعادات:</b> متابعة التمارين والعادات الشخصية.</li>
        <li><b>Reports — التقارير:</b> تحليل الأرقام خلال فترة تختارها وتصدير النتائج.</li>
        <li><b>Settings & Backup — الإعدادات:</b> اللغة والتفضيلات والنسخ الاحتياطي والاستعادة.</li>
      </ul>
    </section>

    <h2>٣ قواعد مهمة في الحسابات</h2>
    <section class="rk-guide-grid">
      <article class="rk-guide-card"><h3>الفاتورة مش تحصيل</h3><p>قيمة الفاتورة بتوضح المطلوب من العميل، لكن التحصيل هو الفلوس اللي وصلت فعلًا. تابع الاتنين بشكل منفصل.</p></article>
      <article class="rk-guide-card"><h3>سجّل دفعة الفاتورة مرة واحدة</h3><p>لما تستلم دفعة، استخدم Record payment داخل الفاتورة. النظام بيسجل حركة الدخل والدفعة المرتبطة بها؛ ما تكررش تسجيلها كدخل يدوي.</p></article>
      <article class="rk-guide-card"><h3>التحويل مش دخل ولا مصروف</h3><p>لما تنقل فلوس بين حساباتك، استخدم تحويل بين الحسابات عشان الرصيد يتحدث من غير تضخيم الإيرادات أو المصروفات.</p></article>
    </section>

    <section class="rk-guide-card" style="margin:14px 0">
      <h2 style="margin-top:0">حافظ على بياناتك</h2>
      <p class="rk-guide-muted">من Settings & Backup صدّر نسخة JSON بشكل دوري، واحتفظ بها في مكان آمن خارج الجهاز. لا تشارك مفتاح Supabase من نوع service_role ولا تضعه داخل ملفات الموقع.</p>
      <div class="rk-guide-note"><b>معلومة مهمة:</b> الداشبورد أداة تنظيم ومتابعة. قبل اعتماد أرقام رسمية أو ضريبية، راجع السجلات وتعريفات التقارير مع المحاسب المختص.</div>
      <div class="rk-guide-actions">${link('settings','اذهب إلى النسخ الاحتياطي')} ${link('overview','ارجع للنظرة العامة')}</div>
    </section>
    <p class="small muted" style="text-align:center;margin:20px 0">تقدر ترجع للدليل ده في أي وقت من القائمة الجانبية.</p>
  </div>`;

  const checks = [...v.querySelectorAll('[data-step]')];
  const paint = () => {
    done = checks.filter(c => c.checked).map(c => Number(c.dataset.step));
    try { localStorage.setItem(key, JSON.stringify(done)); } catch { /* storage may be unavailable */ }
    const bar = $('#rkGuideBar', v), count = $('#rkGuideCount', v);
    if (bar) bar.style.width = `${Math.round(done.length / steps.length * 100)}%`;
    if (count) count.textContent = `أنجزت ${done.length} من ${steps.length}`;
  };
  checks.forEach(c => c.addEventListener('change', paint));
};
