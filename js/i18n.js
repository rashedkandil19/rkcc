// Arabic language support (English <-> Arabic, RTL).
// Keys are the exact English strings used by the app; values are the Arabic text.
// Nothing else in the app needs to know about translation: this module translates what is on screen.
const DICT = {
  'Overview':'نظرة عامة','Daily Log':'السجل اليومي','Tasks':'المهام','Projects & Workspaces':'المشروعات ومساحات العمل',
  'Finance':'المالية','Fitness & Habits':'اللياقة والعادات','Reports':'التقارير','Settings & Backup':'الإعدادات والنسخ الاحتياطي',
  'Getting Started':'دليل الاستخدام','Business & Life OS':'نظام إدارة العمل والحياة',
  'Personal Business & Life Operating System':'نظامك الشخصي لإدارة العمل والحياة','Sign in':'تسجيل الدخول','Email':'البريد الإلكتروني','Password':'كلمة المرور',
  'Search projects, tasks, clients, transactions (Ctrl+K)':'ابحث في المشروعات والمهام والعملاء والمعاملات (Ctrl+K)',
  '+ Quick Add':'+ إضافة سريعة','Quick Add':'إضافة سريعة','New Task':'مهمة جديدة','New Activity':'نشاط جديد','New Project':'مشروع جديد',
  'New Transaction':'معاملة جديدة','New Client':'عميل جديد','New Workout':'تمرين جديد','New Daily Note':'ملاحظة يومية جديدة',
  'Preferences':'التفضيلات','Currency':'العملة','Date format':'تنسيق التاريخ','Week starts on':'بداية الأسبوع','Appearance':'المظهر',
  'Save preferences':'حفظ التفضيلات','Backup & Restore':'النسخ الاحتياطي والاستعادة','Account':'الحساب','About':'حول التطبيق',
  'Export full backup':'تصدير نسخة احتياطية كاملة','Sign out':'تسجيل الخروج','Dark':'داكن','Light':'فاتح',
  'Fitness & Habits':'اللياقة والعادات','A missing entry is "no data", never a failure.':'عدم تسجيل يوم يعني «لا توجد بيانات»، وليس إخفاقًا.',
  'Workouts':'التمارين','Habits':'العادات','This week':'هذا الأسبوع','This month':'هذا الشهر','workouts done':'تمرين مكتمل',
  'Minutes this month':'دقائق هذا الشهر','+ Workout':'+ تمرين','Date':'التاريخ','Type':'النوع','Status':'الحالة','Duration':'المدة','Notes':'ملاحظات',
  'Edit':'تعديل','Delete':'حذف','No workouts logged yet.':'لم تسجل أي تمارين بعد.','No habits yet. Add one to start tracking.':'لا توجد عادات بعد. أضف عادة لبدء المتابعة.',
  'Workout type':'نوع التمرين','Duration (minutes)':'المدة (بالدقائق)','Exercises (optional, one per line: name, sets x reps, weight)':'التمارين (اختياري، تمرين بكل سطر: الاسم، المجموعات × التكرارات، الوزن)',
  'Save workout':'حفظ التمرين','New workout':'تمرين جديد','Edit workout':'تعديل التمرين','Workout saved':'تم حفظ التمرين',
  'planned':'مخطط','done':'مكتمل','skipped':'تم تخطيه','chest':'صدر','back':'ظهر','shoulders':'أكتاف','biceps':'بايسبس',
  'triceps':'ترايسبس','legs':'أرجل','abs':'بطن','cardio':'كارديو','rest':'راحة','other':'أخرى',
  'Overview':'نظرة عامة','No data in this period.':'لا توجد بيانات في هذه الفترة.','Loading…':'جارٍ التحميل…',
  'Page not found.':'الصفحة غير موجودة.','Something went wrong':'حدث خطأ','Reload':'إعادة تحميل',
  'Personal preferences, account and data safety.':'التفضيلات الشخصية والحساب وأمان البيانات.',
  'Export all your records to a JSON file. Keep a copy somewhere safe outside this device.':'صدّر كل سجلاتك في ملف JSON واحتفظ بنسخة آمنة خارج هذا الجهاز.',
  'Last backup:':'آخر نسخة احتياطية:','Never':'لم يتم بعد','Restore merges records by ID. It does not delete records that are missing from the backup.':'تدمج الاستعادة السجلات حسب المعرّف، ولا تحذف السجلات غير الموجودة في النسخة الاحتياطية.',
  'Your data is stored in your Supabase project and protected by Row Level Security policies. Never share your service_role key.':'بياناتك محفوظة في مشروع Supabase ومحمية بسياسات أمان الصفوف. لا تشارك مفتاح service_role مطلقًا.',
  'Language':'اللغة','English':'الإنجليزية','Arabic':'العربية',
  'Guide':'الدليل','Start here':'ابدأ من هنا','Your daily workflow':'روتينك اليومي','Tasks & projects':'المهام والمشروعات',
  'Money & finance':'المال والحسابات','Time tracking':'تسجيل الوقت','Fitness tracking':'متابعة اللياقة','Data safety':'حماية البيانات',
  'Use Quick Add to capture anything without leaving your current page.':'استخدم «إضافة سريعة» لتسجيل أي شيء دون مغادرة الصفحة الحالية.',
  'Create a workspace for each business or life area, then create projects inside it.':'أنشئ مساحة عمل لكل نشاط أو جانب من حياتك، ثم أضف المشروعات داخلها.',
  'Break projects into tasks, set priorities and due dates, and update status as work progresses.':'قسّم المشروعات إلى مهام، وحدد الأولوية والموعد النهائي، وحدّث الحالة مع تقدم العمل.',
  'Record income, expenses, client payments, commissions and business costs. Use separate accounts to track cash accurately.':'سجّل الإيرادات والمصروفات ومدفوعات العملاء والعمولات وتكاليف النشاط. استخدم حسابات منفصلة لمتابعة النقدية بدقة.',
  'Log activities or use the timer to understand where your day goes.':'سجّل الأنشطة أو استخدم المؤقت لمعرفة أين يذهب وقتك خلال اليوم.',
  'Log each workout by muscle group, then add exercises, sets, reps and weights in the notes.':'سجّل كل تمرين حسب العضلة، ثم أضف التمارين والمجموعات والتكرارات والأوزان في التفاصيل.',
  'Track habits consistently. Missing days remain unrecorded rather than being treated as failures.':'تابع عاداتك باستمرار. الأيام التي لم تسجلها تظل بلا بيانات ولا تُحسب كإخفاق.',
  'Export a JSON backup regularly and keep it outside this device. Restore merges records; it does not erase records missing from the backup.':'صدّر نسخة JSON احتياطية بانتظام واحتفظ بها خارج هذا الجهاز. الاستعادة تدمج السجلات ولا تمسح السجلات غير الموجودة في النسخة.',
  'Setup checklist':'قائمة الإعداد الأولي','Create your workspaces':'أنشئ مساحات العمل','Add your accounts':'أضف حساباتك المالية',
  'Set your language and preferences':'حدد اللغة والتفضيلات','Create your first project and tasks':'أنشئ أول مشروع ومهامه',
  'Add your current habits':'أضف عاداتك الحالية','Save your first backup':'احفظ أول نسخة احتياطية',
  'One muscle group per workout day':'مجموعة عضلية واحدة في كل يوم تمرين',
  'Daily Log': 'السجل اليومي',
  'Everything below is calculated from your records.': 'كل ما يلي محسوب من سجلاتك.',
  'Today': 'اليوم',
  'Businesses': 'الأنشطة',
  'Financial snapshot': 'ملخص مالي',
  'Productivity': 'الإنتاجية',
  'All workspaces': 'كل مساحات العمل',
  'No projects match.': 'لا توجد مشروعات مطابقة.',
  'Create a project': 'إنشاء مشروع',
  '+ New Project': '+ مشروع جديد',
  'All statuses': 'كل الحالات',
  'Show archived': 'إظهار المؤرشف',
  'New task': 'مهمة جديدة',
  'Edit task': 'تعديل المهمة',
  'Title': 'العنوان',
  'Description': 'الوصف',
  'Workspace': 'مساحة العمل',
  'Project (sets workspace)': 'المشروع (يحدد مساحة العمل)',
  'Task type': 'نوع المهمة',
  'Priority': 'الأولوية',
  'Due date': 'تاريخ الاستحقاق',
  'Category': 'التصنيف',
  'Recurrence': 'التكرار',
  'Estimated minutes': 'المدة المقدرة بالدقائق',
  'Actual minutes': 'المدة الفعلية بالدقائق',
  'Never': 'أبدًا',
  'Daily': 'يومي',
  'Weekly': 'أسبوعي',
  'Monthly': 'شهري',
  'New activity': 'نشاط جديد',
  'Edit activity': 'تعديل النشاط',
  'Activity type': 'نوع النشاط',
  'Start time': 'وقت البداية',
  'End time': 'وقت النهاية',
  'Duration (minutes, if no times)': 'المدة (بالدقائق، إذا لم تحدد وقتًا)',
  'Related task': 'المهمة المرتبطة',
  'Start timer': 'بدء المؤقت',
  'What are you working on?': 'ما الذي تعمل عليه؟',
  'Timer started': 'بدأ المؤقت',
  'Stop': 'إيقاف',
  'Pause': 'إيقاف مؤقت',
  'Resume': 'استئناف',
  'Daily note saved': 'تم حفظ الملاحظة اليومية',
  'Daily note': 'ملاحظة يومية',
  'Mood': 'الحالة المزاجية',
  'New Project': 'مشروع جديد',
  'Edit project': 'تعديل المشروع',
  'Client': 'العميل',
  'Budget': 'الميزانية',
  'Contract value': 'قيمة التعاقد',
  'Deadline': 'الموعد النهائي',
  'Start date': 'تاريخ البداية',
  'planning': 'قيد التخطيط',
  'active': 'نشط',
  'on_hold': 'متوقف مؤقتًا',
  'completed': 'مكتمل',
  'cancelled': 'ملغي',
  'low': 'منخفض',
  'medium': 'متوسط',
  'high': 'مرتفع',
  'urgent': 'عاجل',
  'New transaction': 'معاملة جديدة',
  'Edit transaction': 'تعديل المعاملة',
  'Amount (EGP)': 'المبلغ (جنيه)',
  'Reference number': 'رقم المرجع',
  'Payment method': 'طريقة الدفع',
  'Account': 'الحساب',
  'From account': 'من حساب',
  'To account': 'إلى حساب',
  'income': 'دخل',
  'expense': 'مصروف',
  'receivable': 'مستحقات لك',
  'payable': 'مستحقات عليك',
  'owner_contribution': 'إضافة رأس مال',
  'owner_withdrawal': 'سحب شخصي',
  'account_transfer': 'تحويل بين الحسابات',
  'refund': 'استرداد',
  'Cash': 'نقدي',
  'Bank transfer': 'تحويل بنكي',
  'Wallet': 'محفظة',
  'Other': 'أخرى',
  'Invoices': 'الفواتير',
  'Accounts': 'الحسابات',
  'Transactions': 'المعاملات',
  'Receivables': 'مستحقات لك',
  'Payables': 'مستحقات عليك',
  'Revenue': 'الإيرادات',
  'Expenses': 'المصروفات',
  'Net profit': 'صافي الربح',
  'Cash collected': 'النقدية المحصلة',
  'Save': 'حفظ',
  'Cancel': 'إلغاء',
  'Confirm': 'تأكيد',
  'Delete': 'حذف',
  'Archive': 'أرشفة',
  'Edit': 'تعديل',
  'Done': 'تم',
  'Move': 'نقل',
  'Copy': 'نسخ',
  'Reports': 'التقارير',
  'From': 'من',
  'To': 'إلى',
  'This month': 'هذا الشهر',
  'Last 30 days': 'آخر 30 يومًا',
  'This year': 'هذه السنة',
  'Project saved': 'تم حفظ المشروع',
  'Task saved': 'تم حفظ المهمة',
  'Transaction saved': 'تم حفظ المعاملة',
  'Client saved': 'تم حفظ العميل',
  'Habit saved': 'تم حفظ العادة',
  'No tasks linked to this project.': 'لا توجد مهام مرتبطة بهذا المشروع.',
  'Getting Started': 'دليل الاستخدام',
  'Muscle group / workout type': 'العضلة / نوع التمرين',
  'Muscle-group split': 'تقسيمة المجموعات العضلية',
  'Rest / Abs & Recovery': 'راحة / بطن وتعافٍ',
  'One primary muscle group per day. Adjust rest days and exercise volume to your recovery.': 'مجموعة عضلية أساسية واحدة يوميًا. اضبط أيام الراحة وحجم التمرين حسب قدرتك على التعافي.',
  'Chest': 'صدر',
  'Back': 'ظهر',
  'Shoulders': 'أكتاف',
  'Biceps': 'بايسبس',
  'Triceps': 'ترايسبس',
  'Legs': 'أرجل',
  'Abs': 'بطن',
  'Cardio': 'كارديو',
  'Rest': 'راحة',
  'Other': 'أخرى',
  'Planned': 'مخطط',
  'Done': 'مكتمل',
  'Skipped': 'تم تخطيه',
  'To do': 'لم تبدأ',
  'In progress': 'قيد التنفيذ',
  'Cancelled': 'ملغي',
  'On hold': 'متوقف مؤقتًا',
  'Completed': 'مكتمل',
  'Low': 'منخفض',
  'Medium': 'متوسط',
  'High': 'مرتفع',
  'Urgent': 'عاجل',
  'Must do': 'ضرورية',
  'Additional': 'إضافية',
  'Backlog': 'قائمة الانتظار',
  'DD MMM YYYY': 'يوم شهر سنة',
  'Saturday': 'السبت',
  'Sunday': 'الأحد',
  'Monday': 'الاثنين',
  'EGP — Egyptian Pound': 'جنيه مصري',
  'USD — US Dollar': 'دولار أمريكي',
  'Choose backup to restore': 'اختر نسخة احتياطية للاستعادة',
  'Attempt a browser backup every 7 days after sign-in': 'ذكّرني بإنشاء نسخة احتياطية كل 7 أيام بعد تسجيل الدخول',
  'No matches.': 'لا توجد نتائج مطابقة.',
  'No data in this period.': 'لا توجد بيانات في هذه الفترة.',
  'Search projects, tasks, clients, transactions (Ctrl+K)': 'ابحث في المشروعات والمهام والعملاء والمعاملات (Ctrl+K)',
  'Getting Started': 'دليل الاستخدام',
  'Finish setup & open Overview': 'إنهاء الإعداد وفتح النظرة العامة',
  'Muscle group / workout type': 'المجموعة العضلية / نوع التمرين',
  'Exercises (optional, one per line: name, sets x reps, weight)': 'التمارين (اختياري، تمرين بكل سطر: الاسم، المجموعات × التكرارات، الوزن)',
  /* ---- additions: full coverage of the remaining screens ---- */
  '+ Account':'+ حساب','+ Activity':'+ نشاط','+ Add':'+ إضافة','+ Habit':'+ عادة','+ Invoice':'+ فاتورة','+ Item':'+ بند',
  '+ New Task':'+ مهمة جديدة','+ New client':'+ عميل جديد','+ Order':'+ طلب','+ Product':'+ منتج','+ Transaction':'+ معاملة',
  '+ Manual activity':'+ نشاط يدوي','+ Task':'+ مهمة','+ Client':'+ عميل','+ Workspace':'+ مساحة عمل',
  '1 · Rough':'1 · سيئ','2 · Low':'2 · منخفض','3 · Okay':'3 · مقبول','4 · Good':'4 · جيد','5 · Great':'5 · ممتاز',
  'A product with that name exists':'يوجد منتج بنفس الاسم','A transfer needs two different accounts':'التحويل يحتاج حسابين مختلفين',
  'A workspace holds many projects.':'مساحة العمل تضم عدة مشروعات.','Account (or transfer from)':'الحساب (أو التحويل منه)',
  'Account saved':'تم حفظ الحساب','Active':'نشط','Activities':'الأنشطة','Activities & timeline':'الأنشطة والجدول الزمني','Activity':'النشاط',
  'Activity deleted':'تم حذف النشاط','Activity saved':'تم حفظ النشاط','Actual':'الفعلي','Add':'إضافة','Add a product first':'أضف منتجًا أولًا',
  'Add file or URL':'إضافة ملف أو رابط','Added':'تمت الإضافة','Address':'العنوان','Advertising allocation':'حصة الإعلانات',
  'Advertising allocation / order':'حصة الإعلانات / الطلب','All':'الكل','All projects':'كل المشروعات','All types':'كل الأنواع',
  'Amount':'المبلغ','Amount must be greater than zero':'يجب أن يكون المبلغ أكبر من صفر','Amounts cannot be negative':'لا يمكن أن تكون المبالغ سالبة',
  'An account with that name exists':'يوجد حساب بنفس الاسم','Another timer is already running. Pause or stop it first.':'يوجد مؤقت آخر يعمل بالفعل. أوقفه مؤقتًا أو أنهِه أولًا.',
  'Any priority':'أي أولوية','Any type':'أي نوع','Archive this habit? Its history is kept.':'أرشفة هذه العادة؟ سيتم الاحتفاظ بسجلها.',
  'Archive this project? It is hidden from lists but nothing is deleted.':'أرشفة هذا المشروع؟ سيختفي من القوائم دون حذف أي بيانات.',
  'Archived':'مؤرشف','Back to projects':'العودة إلى المشروعات','Backup exported successfully.':'تم تصدير النسخة الاحتياطية بنجاح.',
  'Backup merged. Reloading your data…':'تم دمج النسخة الاحتياطية. جارٍ إعادة تحميل بياناتك…',
  'Backup reminder: open Settings & Backup and export a fresh copy.':'تذكير: افتح الإعدادات والنسخ الاحتياطي وصدّر نسخة جديدة.',
  'Balances = opening balance + posted money in/out. Transfers only move money between accounts.':'الأرصدة = الرصيد الافتتاحي + الأموال الداخلة والخارجة. التحويلات تنقل المال بين الحسابات فقط.',
  'Budget (EGP)':'الميزانية (جنيه)','Built from your real records for the chosen dates. Exports match what you see.':'مبني من سجلاتك الفعلية للفترة المحددة. ملفات التصدير تطابق ما تراه.',
  'Business':'نشاط','Business & Life Operating System · Version 1.0':'نظام إدارة العمل والحياة · الإصدار 1.0','By workspace':'حسب مساحة العمل',
  'Cancel invoice':'إلغاء الفاتورة','Cancel this invoice? It stays in history but no longer counts as revenue.':'إلغاء هذه الفاتورة؟ ستبقى في السجل لكنها لن تُحسب ضمن الإيرادات.',
  'Card':'بطاقة','Carried forward':'تم ترحيلها','Cash in':'نقدية داخلة','Cash out':'نقدية خارجة','Choose the account this money moved through':'اختر الحساب الذي مرّ به المال',
  'Client (optional)':'العميل (اختياري)','Clients':'العملاء','Close':'إغلاق','Collected':'المحصّل','Commission cannot be more than 100%':'لا يمكن أن تزيد العمولة عن 100%',
  'Commission value':'قيمة العمولة','Company':'الشركة','Completion':'الإنجاز','Consistency':'الانتظام','Contract value (EGP)':'قيمة التعاقد (جنيه)',
  'Correct transaction (replaces the old one)':'تصحيح المعاملة (تحل محل القديمة)','Corrected by a new entry':'تم التصحيح بقيد جديد',
  'Corrected. The old entry is kept as void':'تم التصحيح. القيد القديم محفوظ كملغى','Create a workspace first (Settings)':'أنشئ مساحة عمل أولًا (الإعدادات)',
  'Create invoice':'إنشاء فاتورة','Current streak (days)':'السلسلة الحالية (أيام)','Customer':'العميل','DD/MM/YYYY':'يوم/شهر/سنة','YYYY-MM-DD':'سنة-شهر-يوم',
  'Daily activity':'النشاط اليومي','Daily target (optional)':'الهدف اليومي (اختياري)','Database not ready':'قاعدة البيانات غير جاهزة','Dates':'التواريخ',
  'Day':'يوم','Days done':'أيام الإنجاز','Days logged':'أيام مسجلة','Days overdue':'أيام التأخير','Deadline cannot be before the start date':'لا يمكن أن يسبق الموعد النهائي تاريخ البداية',
  'Deadline:':'الموعد النهائي:','Start:':'البداية:','Delete this activity?':'حذف هذا النشاط؟','Delete this workout?':'حذف هذا التمرين؟','Delivery':'التوصيل',
  'Delivery / order':'التوصيل / الطلب','Difference':'الفرق','Done. Next occurrence created':'تم. أُنشئ الموعد التالي','Double-click a day to add a task. Click a task to edit.':'انقر مرتين على يوم لإضافة مهمة. انقر على مهمة لتعديلها.',
  'Draft':'مسودة','Drag rows to reorder.':'اسحب الصفوف لإعادة الترتيب.','Due':'المستحق','Due date cannot be before the issue date':'لا يمكن أن يسبق تاريخ الاستحقاق تاريخ الإصدار',
  'EGP':'جنيه','USD':'دولار','Edit account':'تعديل الحساب','Edit client':'تعديل العميل','Edit habit':'تعديل العادة','Edit order':'تعديل الطلب','Edit product':'تعديل المنتج',
  'End time must be after start time':'يجب أن يكون وقت النهاية بعد وقت البداية','Enter both start and end time, or neither':'أدخل وقت البداية والنهاية معًا أو اتركهما فارغين',
  'Enter start and end times, or a duration':'أدخل وقت البداية والنهاية، أو المدة','Est. / Actual':'المقدر / الفعلي','Estimated':'المقدّر','Estimated vs actual time':'الوقت المقدّر مقابل الفعلي',
  'Every item needs a description and quantity':'كل بند يحتاج إلى وصف وكمية','Export all (Excel)':'تصدير الكل (Excel)','Export all (JSON)':'تصدير الكل (JSON)',
  'Files & URLs':'الملفات والروابط','Fixed amount (EGP)':'مبلغ ثابت (جنيه)','Freelance commission analysis':'تحليل عمولات العمل الحر','Global search':'بحث شامل',
  'Gross profit':'إجمالي الربح','Gross value':'القيمة الإجمالية','Habit':'العادة','Habit consistency':'انتظام العادات','Hours slept':'ساعات النوم','How numbers are calculated':'كيف تُحسب الأرقام',
  'Include voided':'تضمين الملغاة','InstaPay':'إنستاباي','Intermediary commission':'عمولة وسيط','Invoice':'الفاتورة','Invoice cancelled':'تم إلغاء الفاتورة','Invoice created':'تم إنشاء الفاتورة',
  'Invoice number (blank = automatic)':'رقم الفاتورة (اتركه فارغًا للترقيم التلقائي)','Invoices & payments':'الفواتير والمدفوعات','Issue date':'تاريخ الإصدار','Items':'البنود',
  'Label':'التسمية','Local file path':'مسار الملف المحلي','Manufacturing cost / unit':'تكلفة التصنيع / الوحدة','Marked as sent':'تم وضع علامة «مرسلة»',
  'Month':'الشهر','Monthly activity':'النشاط الشهري','Monthly business performance':'أداء النشاط الشهري','Monthly cash flow':'التدفق النقدي الشهري','Mood & notes':'المزاج والملاحظات',
  'Move task':'نقل المهمة','Move task to another date':'نقل المهمة إلى تاريخ آخر','My net':'صافيي','Name':'الاسم','Net margin':'هامش الربح الصافي','New account':'حساب جديد',
  'New client':'عميل جديد','New due date':'تاريخ الاستحقاق الجديد','New habit':'عادة جديدة','New invoice':'فاتورة جديدة','New order':'طلب جديد','New product':'منتج جديد',
  'None':'لا شيء','Notes saved':'تم حفظ الملاحظات','Open':'مفتوح','Open receivables & payables':'المستحقات المفتوحة لك وعليك','Opening balance (EGP)':'الرصيد الافتتاحي (جنيه)',
  'Order saved':'تم حفظ الطلب','Orders':'الطلبات','Outstanding':'المتبقي','Overdue':'متأخرة','Overdue tasks':'المهام المتأخرة','Packaging':'التغليف','Packaging / order':'التغليف / الطلب',
  'Paid':'مدفوعة','Paid on':'تاريخ الدفع','Paused':'متوقف مؤقتًا','Running':'يعمل','Payment processing':'رسوم معالجة الدفع','Payment processing / order':'رسوم معالجة الدفع / الطلب',
  'Payment recorded':'تم تسجيل الدفعة','Payment voided':'تم إلغاء الدفعة','Payments':'المدفوعات','Percentage of contract':'نسبة من قيمة التعاقد','Personal':'شخصي','Phone':'الهاتف',
  'Planned tasks':'المهام المخططة','Please confirm':'يرجى التأكيد','Preferences saved.':'تم حفظ التفضيلات.','Product':'المنتج','Product performance':'أداء المنتجات','Product saved':'تم حفظ المنتج',
  'Profit':'الربح','Project':'المشروع','Project (sets workspace and client)':'المشروع (يحدد مساحة العمل والعميل)','Project name':'اسم المشروع','Project name is required':'اسم المشروع مطلوب',
  'Project not found.':'لم يتم العثور على المشروع.','Project profitability':'ربحية المشروعات','Quantity':'الكمية','Qty':'الكمية',
  "RK Store analysis. Orders do not create transactions: record the customer's payment in Transactions as Income (workspace RK Store).":'تحليل RK Store. الطلبات لا تنشئ معاملات: سجّل دفعة العميل في المعاملات كدخل (مساحة العمل RK Store).',
  'RK Store product performance':'أداء منتجات RK Store','Reason':'السبب','Reason (optional)':'السبب (اختياري)','Received in account':'استُلمت في الحساب','Recent activity':'آخر الأنشطة',
  'Record payment':'تسجيل دفعة','Reference (optional)':'المرجع (اختياري)','Refund / return amount':'مبلغ الاسترداد / المرتجع','Refund cannot exceed the order value':'لا يمكن أن يتجاوز الاسترداد قيمة الطلب',
  'Remaining':'المتبقي','Remove':'إزالة','Remove item':'إزالة البند','Remove this reference?':'إزالة هذا المرجع؟','Removed':'تمت الإزالة','Repeats':'يتكرر','Restore backup':'استعادة النسخة',
  'Restored':'تمت الاستعادة','Resumed':'تم الاستئناف','Revenue by workspace':'الإيرادات حسب مساحة العمل','Run':'تشغيل','SKU':'رمز المنتج','Save activity':'حفظ النشاط','Save notes':'حفظ الملاحظات',
  'Save order':'حفظ الطلب','Save product':'حفظ المنتج','Save project':'حفظ المشروع','Save task':'حفظ المهمة','Save transaction':'حفظ المعاملة','Search description / reference':'ابحث في الوصف / المرجع',
  'Search tasks':'ابحث في المهام','Selling price':'سعر البيع','Sent':'مرسلة','Sessions done':'جلسات مكتملة','Settle':'تسوية','Settled':'تمت التسوية','Setup needed':'الإعداد مطلوب',
  'Shortcut: Alt+N':'اختصار: Alt+N','Sign out of RK Control Center?':'تسجيل الخروج من RK Control Center؟','Sleep trends':'اتجاهات النوم','Start':'ابدأ',
  'Status (receivable/payable: pending = still owed)':'الحالة (للمستحقات: «قيد الانتظار» = لم يُسدد بعد)','Stop & save':'إيقاف وحفظ','Stop the timer before editing this activity':'أوقف المؤقت قبل تعديل هذا النشاط',
  'Streak':'السلسلة','Target':'الهدف','Task':'المهمة','Task completed':'تم إنجاز المهمة','Task completion rate':'معدل إنجاز المهام','Task deleted':'تم حذف المهمة','Task duplicated':'تم نسخ المهمة',
  'Task moved. History kept':'تم نقل المهمة. تم الاحتفاظ بالسجل','Tasks carried forward':'تم ترحيل المهام','Tasks completed':'مهام مكتملة','Tasks today':'مهام اليوم','Completed today':'المكتمل اليوم',
  'Must Do remaining':'مهام ضرورية متبقية','Must Do (period)':'ضرورية (الفترة)','Additional (period)':'إضافية (الفترة)','Text':'نص','That invoice number already exists':'رقم الفاتورة هذا موجود بالفعل',
  'That reference number is already used by another transaction.':'رقم المرجع هذا مستخدم في معاملة أخرى.',
  'This looks like a duplicate payment (same invoice, date, amount and reference). Add a different reference if it is a separate payment.':'يبدو أن هذه دفعة مكررة (نفس الفاتورة والتاريخ والمبلغ والمرجع). أضف مرجعًا مختلفًا إن كانت دفعة منفصلة.',
  'Time':'الوقت','Time by workspace':'الوقت حسب مساحة العمل','Timeline':'الجدول الزمني','Total':'الإجمالي','Total across active accounts:':'الإجمالي عبر الحسابات النشطة:','Total time':'إجمالي الوقت','Total:':'الإجمالي:',
  'Tracked time':'الوقت المسجل','Transaction':'المعاملة','Transfer between accounts':'تحويل بين الحسابات','Transfer to account':'التحويل إلى حساب','URL':'الرابط','URL must start with http:// or https://':'يجب أن يبدأ الرابط بـ http:// أو https://',
  'URL or path':'رابط أو مسار','Unit (use "hours" to log values)':'الوحدة (استخدم "hours" لتسجيل القيم)','Unit manufacturing cost':'تكلفة تصنيع الوحدة','Unit price':'سعر الوحدة','Units':'الوحدات',
  'Void':'إلغاء القيد','Void payment':'إلغاء الدفعة','Void this payment? The invoice balance goes back up and the record is kept.':'إلغاء هذه الدفعة؟ سيرتفع رصيد الفاتورة المتبقي ويبقى السجل محفوظًا.','Void transaction':'إلغاء المعاملة',
  'Voided from invoice':'ملغاة من الفاتورة','Voided only':'الملغاة فقط','Voided. The record is kept':'تم الإلغاء. السجل محفوظ','Week':'الأسبوع','Week starting':'أسبوع يبدأ في','Weekly activity':'النشاط الأسبوعي',
  'Work hours by workspace':'ساعات العمل حسب مساحة العمل','Workout':'التمرين','Workout deleted':'تم حذف التمرين','Workout frequency':'معدل التمرين','Workspace / Project':'مساحة العمل / المشروع','Workspace filter':'تصفية مساحة العمل',
  '· Due':'· الاستحقاق','· Issued':'· الإصدار','— none —':'— لا شيء —','← Projects':'← المشروعات','▶ Start timer':'▶ بدء المؤقت','Work time':'وقت العمل','Overlaps counted once':'التداخل يُحسب مرة واحدة',
  'No workout logged.':'لا يوجد تمرين مسجل.','None logged':'لا شيء مسجل','Log workout':'تسجيل تمرين','Habits done':'العادات المنجزة','Excel':'Excel','CSV':'CSV','JSON':'JSON','Business & Life OS':'نظام إدارة العمل والحياة',
  'Internal management accounting, not certified tax software. Amounts in':'محاسبة إدارية داخلية وليست برنامج ضرائب معتمدًا. المبالغ بعملة',
  'Transfers between your accounts and owner contributions/withdrawals never change revenue or expenses. An unpaid invoice is a receivable, not cash; each payment is recorded when received.':'التحويلات بين حساباتك وإضافات/سحوبات المالك لا تغيّر الإيرادات أو المصروفات. الفاتورة غير المدفوعة مستحقات وليست نقدية؛ وتُسجَّل كل دفعة عند استلامها.',
  'No accounts.':'لا توجد حسابات.','No activities logged for this day.':'لا توجد أنشطة مسجلة لهذا اليوم.','No activities recorded.':'لا توجد أنشطة مسجلة.','No clients yet.':'لا يوجد عملاء بعد.',
  'No data for these dates.':'لا توجد بيانات لهذه التواريخ.','No habits yet.':'لا توجد عادات بعد.','No invoices for this project.':'لا توجد فواتير لهذا المشروع.','No invoices yet.':'لا توجد فواتير بعد.',
  'No note yet.':'لا توجد ملاحظة بعد.','No orders yet.':'لا توجد طلبات بعد.','No payments yet.':'لا توجد مدفوعات بعد.','No products yet.':'لا توجد منتجات بعد.','No project money yet.':'لا توجد حركة مالية للمشروع بعد.',
  'No references yet.':'لا توجد مراجع بعد.','No tasks match these filters.':'لا توجد مهام مطابقة لهذه الفلاتر.','No timer running. Timers survive closing the app: they are stored in your database.':'لا يوجد مؤقت قيد التشغيل. المؤقتات تستمر حتى بعد إغلاق التطبيق لأنها محفوظة في قاعدة بياناتك.',
  'No transactions in this view.':'لا توجد معاملات في هذا العرض.','No workspaces.':'لا توجد مساحات عمل.','Nothing on the timeline yet.':'لا يوجد شيء في الجدول الزمني بعد.','Nothing outstanding.':'لا يوجد متبقٍ.',
  'Nothing planned for this day.':'لا يوجد شيء مخطط لهذا اليوم.','Nothing yet. Use Quick Add to log your first task or activity.':'لا يوجد شيء بعد. استخدم «إضافة سريعة» لتسجيل أول مهمة أو نشاط.',
  'Change the dates or add one with + Transaction.':'غيّر التواريخ أو أضف معاملة بزر «+ معاملة».','Create a task':'إنشاء مهمة','Create an invoice':'إنشاء فاتورة','No tasks yet.':'لا توجد مهام بعد.',
  'Day view':'عرض اليوم','Week view':'عرض الأسبوع','list':'قائمة','kanban':'كانبان','calendar':'تقويم','List':'قائمة','Kanban':'كانبان','Calendar':'التقويم','Drop here':'أفلت هنا',
  'Todo':'للتنفيذ','To Do':'للتنفيذ','In Progress':'قيد التنفيذ','Partially paid':'مدفوعة جزئيًا','Voided':'ملغاة','Pending':'قيد الانتظار','Posted':'مرحَّلة',
  'Income':'دخل','Expense':'مصروف','Receivable':'مستحقات لك','Payable':'مستحقات عليك','Owner contribution':'إضافة رأس مال','Owner withdrawal':'سحب شخصي','Account transfer':'تحويل بين الحسابات','Refund':'استرداد',
  'Owner contributions':'إضافات رأس المال','Owner withdrawals':'سحوبات المالك','Must do':'ضرورية',
  'Development':'تطوير','Design':'تصميم','Marketing':'تسويق','Client communication':'التواصل مع العملاء','Administration':'إدارة','Learning':'تعلّم','Admin':'إدارة','Sales':'مبيعات','Salary':'راتب','Materials':'خامات',
  'Advertising':'إعلانات','Software':'برمجيات','Main Job':'الوظيفة الأساسية','Freelance':'عمل حر','Bank Account':'حساب بنكي','Gym Workout':'تمرين الجيم','Sleep Target':'هدف النوم','Personal Time':'وقت شخصي',
  'Push':'دفع','Pull':'سحب','Upper':'الجزء العلوي','Lower':'الجزء السفلي','Planning':'قيد التخطيط',
  
  'Friday':'الجمعة','Tuesday':'الثلاثاء','Wednesday':'الأربعاء','Thursday':'الخميس',
  'Revenue (recognized)':'الإيرادات (المعترف بها)','Gross project value':'إجمالي قيمة المشروع','Collected so far':'المحصّل حتى الآن','My net amount':'صافي مبلغي','Gross':'الإجمالي','Margin':'الهامش',
  'Net cash flow':'صافي التدفق النقدي','Mark as sent':'وضع علامة «مرسلة»','Client / Project':'العميل / المشروع','Invoices':'الفواتير','Payments received':'المدفوعات المستلمة','Open tasks':'المهام المفتوحة',
  'Active projects':'المشروعات النشطة','Contract':'التعاقد','Cash':'نقدي','Net':'الصافي','Overview':'نظرة عامة','Home':'الرئيسية','Search':'بحث','Filter':'تصفية','Reset':'إعادة ضبط','Next':'التالي','Previous':'السابق',
  'Show':'إظهار','Hide':'إخفاء','Yes':'نعم','No':'لا','OK':'موافق','Submit':'إرسال','Update':'تحديث','Create':'إنشاء','Add task':'إضافة مهمة','Add note':'إضافة ملاحظة','Notes (optional)':'ملاحظات (اختياري)',
  'Habit':'العادة','Habit name':'اسم العادة','Edit habit':'تعديل العادة','New habit':'عادة جديدة','Name':'الاسم','Hours':'ساعات',
  /* ---- fitness: muscle groups & exercise picker ---- */
  'Muscle group':'العضلة','Muscles':'العضلات','Pick the exercises you did':'اختر التمارين التي قمت بها','Tick the exercises you did. They are added to the exercises box below.':'حدد التمارين التي قمت بها. تُضاف تلقائيًا إلى خانة التمارين بالأسفل.',
  'Muscle':'العضلة','exercises selected':'تمارين محددة','Select all':'تحديد الكل','Clear':'مسح','Today\'s muscle':'عضلة اليوم',
  'Neck':'رقبة','Forearms':'ساعد','Glutes':'مؤخرة','Calves':'سمانة','Full body':'الجسم كله','Traps':'ترابيس',
  'Sun':'أحد','Mon':'اثنين','Tue':'ثلاثاء','Wed':'أربعاء','Thu':'خميس','Fri':'جمعة','Sat':'سبت',
  'Summary':'الملخص','Store':'المتجر','Recognized: invoices billed + sales − refunds':'المعترف به: الفواتير الصادرة + المبيعات − المستردات','Money actually received':'الأموال المستلمة فعليًا',
  'Revenue − expenses':'الإيرادات − المصروفات','Includes owner money; excludes transfers':'يشمل أموال المالك ويستثني التحويلات','Owed to you (not cash)':'مستحق لك (ليس نقدًا)','You owe':'عليك',
  'Not revenue':'ليس إيرادًا','Not an expense':'ليس مصروفًا','Freelance commission':'عمولة العمل الحر','Commission':'العمولة',
  'Transfers between your accounts and owner contributions/withdrawals never change revenue or expenses. An unpaid invoice is a receivable, not cash; each payment is recorded separately and reduces the outstanding balance. Refunds reduce revenue and cash. Voided entries stay in history and are ignored in totals.':'التحويلات بين حساباتك وإضافات/سحوبات المالك لا تغيّر الإيرادات أو المصروفات. الفاتورة غير المدفوعة مستحقات وليست نقدية؛ وتُسجَّل كل دفعة على حدة وتخفض الرصيد المتبقي. المستردات تخفض الإيرادات والنقدية. القيود الملغاة تبقى في السجل ولا تدخل في الإجماليات.',
  'No description.':'لا يوجد وصف.','Invoiced, not yet paid':'مفوترة ولم تُدفع بعد','Revenue minus expenses':'الإيرادات مطروحًا منها المصروفات','Time tracked':'الوقت المسجل',
  'Intermediary commission (fixed)':'عمولة وسيط (ثابتة)','Task due':'موعد المهمة','Correct':'تصحيح','7 days':'7 أيام','30 days':'30 يومًا','Not logged':'غير مسجل','Undefined':'غير محدد',
  'Low priority':'أولوية منخفضة','Medium priority':'أولوية متوسطة','High priority':'أولوية مرتفعة','Urgent priority':'أولوية عاجلة','Date':'التاريخ',
  'Internal management accounting, not certified tax software. Amounts in EGP.':'محاسبة إدارية داخلية وليست برنامج ضرائب معتمدًا. المبالغ بالجنيه المصري.',
  'No recent activity':'لا توجد أنشطة حديثة','Recognized in period':'المعترف به في الفترة','Outstanding, not cash':'متبقٍ، وليس نقدًا','Today completion':'إنجاز اليوم','Issued':'صدرت',
  'Delivered':'تم التسليم','Shipped':'تم الشحن','Returned':'مرتجع','New':'جديد','— not set —':'— غير محدد —','Rough':'سيئ','Okay':'مقبول','Good':'جيد','Great':'ممتاز',
  /* ---- login / language ---- */
  'Switch language':'تغيير اللغة','Sign in to continue':'سجّل الدخول للمتابعة','Invalid login credentials':'بيانات الدخول غير صحيحة','Loading':'جارٍ التحميل',
};

/* ------------------------------------------------------------------
   Engine. Standalone (no imports) so it can start before anything else.
   - Translates text nodes + placeholder/title/aria-label by exact match,
     then by phrase patterns for strings with numbers/dates inside.
   - Remembers each node's English original, so switching back to English
     is exact, and our own edits never trigger new translation passes.
   - Never touches <textarea>, <script>, <style>, or anything inside an
     element marked translate="no" (what you type is never altered).
------------------------------------------------------------------ */
const LS_KEY = 'rk_lang';
const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MON3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_L = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_S = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const monMap = Object.fromEntries([...MON3.map((m, i) => [m, MONTHS[i]]), ...MONL.map((m, i) => [m, MONTHS[i]])]);
const dayMap = Object.fromEntries([...DAYS_L.map((d, i) => [d, DAYS_AR[i]]), ...DAYS_S.map((d, i) => [d, DAYS_AR[i]])]);
const monRe = new RegExp('\\b(' + [...MONL, ...MON3].join('|') + ')\\b', 'g');
const dayRe = new RegExp('\\b(' + [...DAYS_L, ...DAYS_S].join('|') + ')\\b(?=[ ,]*\\d|,)', 'g');

// Phrases with numbers or names inside. First match wins.
const PATTERNS = [
  [/^(\d+) exercises?$/, (_, n) => `${n} تمرين`],
  [/^avg ([\d.]+)h$/, (_, n) => `المتوسط ${n} س`],
  [/^(\d+) shown · (\d+) overdue$/, (_, a, b) => `${a} معروضة · ${b} متأخرة`],
  [/^Tasks \((\d+)\)$/, (_, n) => `المهام (${n})`],
  [/^Activities \((\d+)\)$/, (_, n) => `الأنشطة (${n})`],
  [/^Hours slept \(target ([\d.]+)\)\. Leave empty to clear$/, (_, n) => `ساعات النوم (الهدف ${n}). اتركها فارغة للمسح`],
  [/^Hours slept\. Leave empty to clear$/, () => 'ساعات النوم. اتركها فارغة للمسح'],
  [/^Amounts in (.+)\.$/, (_, c) => `المبالغ بعملة ${c === 'EGP' ? 'الجنيه' : c}.`],
  [/^(Total|Total across active accounts|Start|Deadline): (.*)$/, (_, k, rest) => `${DICT_MAP.get(k + ':') || k}: ${rest}`],
  [/^(\d+) (?:of|\/) (\d+)$/, (_, a, b) => `${a} من ${b}`],
  [/^(\d+) of (\d+) tasks$/, (_, a, b) => `${a} من ${b} مهام`],
  [/^(Issued|Due) (.+)$/, (_, k, rest) => `${k === 'Issued' ? 'الإصدار' : 'الاستحقاق'} ${lookup(rest) ?? rest}`],
  [/^Task updated: (.+)$/, (_, t) => `تم تحديث المهمة: ${t}`],
  [/^Complete (.+)$/, (_, t) => `إنهاء ${t}`],
  [/^Invoice (?!number)(.+)$/, (_, n) => `فاتورة ${n}`],
  [/^(\d+) d$/, (_, n) => `${n} يوم`],
  [/^(.+) \/ (\d+)m$/, (_, a, m) => `${a} / ${m} د`],
  [/^(\d+)h (\d{2})m$/, (_, h, m) => `${h} س ${m} د`],
  [/^(\d+)m$/, (_, m) => `${m} د`],
  [/^([\d.]+)h$/, (_, h) => `${h} س`],
  [/^(\d+) done$/, (_, n) => `${n} مكتمل`],
  [/^(\d+) not logged$/, (_, n) => `${n} غير مسجلة`],
  [/^(\d+) more$/, (_, n) => `${n} أخرى`],
  [/^\+(\d+) more$/, (_, n) => `+${n} أخرى`],
];
// Replacements applied inside longer strings that mix English words with data.
const INLINE = [
  [/· Issued /g, '· الإصدار '], [/· Due /g, '· الاستحقاق '],
  [/(\d) EGP\b/g, '$1 ج.م'], [/(\d) USD\b/g, '$1 دولار'],
];

const DICT_MAP = new Map(Object.entries(DICT));
const DICT_LC = new Map(Object.entries(DICT).map(([k, v]) => [k.toLowerCase(), v]));
const SKIP_TAGS = new Set(['TEXTAREA', 'SCRIPT', 'STYLE', 'CODE', 'PRE']);
const ATTRS = ['placeholder', 'title', 'aria-label'];
const orig = new WeakMap(), mine = new WeakMap();   // text nodes
const attrState = new WeakMap();                    // elements: {attr: [orig, mine]}
const missing = new Set();
let lang = 'en', observer = null;

const hasLetters = s => /[A-Za-z]/.test(s);
function translateDates(s) {
  if (s.length > 90 || !/\d/.test(s)) return s;
  return s.replace(monRe, m => monMap[m] || m).replace(dayRe, d => dayMap[d] || d);
}
// Returns the Arabic text for `key`, or null when nothing in it can be translated.
function lookup(key, depth = 0) {
  const hit = DICT_MAP.get(key) ?? DICT_LC.get(key.toLowerCase());
  if (hit != null) return hit;
  for (const [re, fn] of PATTERNS) { const m = key.match(re); if (m) return fn(...m); }
  if (depth < 2) {
    if (key.endsWith(' *')) { const t = lookup(key.slice(0, -2).trim(), depth + 1); if (t != null) return t + ' *'; }   // required-field labels
    if (key.includes('·')) {                                                                                        // "Push · Done · 1h 00m"
      let any = false;
      const out = key.split(/(\s*·\s*)/).map((p, i) => {
        const t = i % 2 || !p.trim() ? null : lookup(p.trim(), depth + 1);
        if (t == null) return p; any = true; return p.replace(p.trim(), () => t);
      }).join('');
      if (any) return out;
    }
    const c = key.indexOf(': ');                                                                                    // "Task due: Write report"
    if (c > 0 && c < 40) { const head = lookup(key.slice(0, c).trim(), depth + 1); if (head != null) return head + ': ' + (lookup(key.slice(c + 2).trim(), depth + 1) ?? key.slice(c + 2)); }
  }
  let t = key; for (const [re, rep] of INLINE) t = t.replace(re, rep);
  t = translateDates(t);
  return t !== key ? t : null;
}
function tr(raw) {
  const key = raw.trim();
  if (!key || !hasLetters(key)) return raw;
  const out = lookup(key);
  if (out == null) { missing.add(key); return raw; }
  return raw.replace(key, () => out);               // keep surrounding whitespace
}
function skipped(el) {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName) || e.getAttribute?.('translate') === 'no') return true;
  }
  return false;
}
function doText(node) {
  const cur = node.nodeValue;
  if (mine.has(node) && mine.get(node) === cur) {   // our own edit
    if (lang !== 'ar') { node.nodeValue = orig.get(node); mine.delete(node); }
    return;
  }
  mine.delete(node);                                // app wrote new text
  if (lang !== 'ar' || !node.parentElement || skipped(node.parentElement)) return;
  const t = tr(cur);
  if (t !== cur) { orig.set(node, cur); mine.set(node, t); node.nodeValue = t; }
}
function doAttrs(el) {
  let st = attrState.get(el);
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    const cur = el.getAttribute(a), s = st?.[a];
    if (s && s[1] === cur) { if (lang !== 'ar') { el.setAttribute(a, s[0]); delete st[a]; } continue; }
    if (s) delete st[a];
    if (lang !== 'ar' || skipped(el)) continue;
    const t = tr(cur);
    if (t !== cur) { if (!st) attrState.set(el, st = {}); st[a] = [cur, t]; el.setAttribute(a, t); }
  }
}
function walk(root) {
  if (root.nodeType === Node.TEXT_NODE) { doText(root); return; }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if (lang === 'ar' && skipped(root)) return;
  doAttrs(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === Node.TEXT_NODE ? doText(n) : doAttrs(n);
}
function onMutations(records) {
  for (const r of records) {
    if (r.type === 'childList') r.addedNodes.forEach(walk);
    else if (r.type === 'characterData') doText(r.target);
    else if (r.type === 'attributes') doAttrs(r.target);
  }
}
function setDocument(l) {
  const ar = l === 'ar';
  const root = document.documentElement;
  root.lang = ar ? 'ar' : 'en'; root.dir = ar ? 'rtl' : 'ltr'; root.dataset.lang = ar ? 'ar' : 'en';
}

export const getLang = () => lang;
export const missingTranslations = () => [...missing];
export function setLanguage(next, { persist = true } = {}) {
  lang = next === 'ar' ? 'ar' : 'en';
  if (persist) { try { localStorage.setItem(LS_KEY, lang); } catch { /* private mode */ } }
  setDocument(lang);
  observer?.disconnect();
  walk(document.body);
  observer?.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  window.dispatchEvent(new CustomEvent('languagechange-rk', { detail: lang }));
}
export function initLanguage() {
  let saved = 'en';
  try { saved = localStorage.getItem(LS_KEY) || 'en'; } catch { /* ignore */ }
  observer = new MutationObserver(onMutations);
  setLanguage(saved, { persist: false });
}
/** Use the language saved in the account (settings table) once it is known. */
export function syncLanguage(accountLang) {
  if (accountLang === 'ar' || accountLang === 'en') { if (accountLang !== lang) setLanguage(accountLang); else try { localStorage.setItem(LS_KEY, lang); } catch { /* ignore */ } }
}
// Handy when something is still English: open the console and run rkMissingTranslations()
window.rkMissingTranslations = missingTranslations;
