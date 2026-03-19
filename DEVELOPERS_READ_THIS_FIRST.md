# 🚨 اقرأ هذا أولاً — خارطة طريق تطوير تطبيق دليل التوبة النصوح

> **للمطور القادم:** هذا الملف هو خارطة الطريق الكاملة للتطبيق.
> كل فكرة موثّقة بغرضها وحالتها وملاحظات التنفيذ.
> **ابدأ من حيث توقّف المطور السابق.**

---

## 📱 عن التطبيق

**الاسم:** دليل التوبة النصوح  
**الغرض:** تطبيق إسلامي متكامل يساعد المسلم على التوبة والاستقامة  
**التقنيات:** TypeScript · pnpm monorepo · Express API · React/Vite · Expo Mobile  
**قاعدة البيانات:** PostgreSQL (Drizzle ORM)  
**الذكاء الاصطناعي:** OpenAI عبر Replit AI Integrations  

### هيكل المشروع
```
artifacts/
  api-server/     — Express backend (port 8080)
  tawbah-web/     — React/Vite frontend (port 20251)
  tawbah-mobile/  — Expo React Native
lib/
  db/             — Drizzle schema وmigrations
  api-spec/       — تعريفات API المشتركة
```

---

## 🗺️ خارطة الأفكار الثورية

---

### ✅ الميزة ١ — بطاقة التوبة القابلة للمشاركة

**الفكرة:** بعد إتمام عهد التوبة، يحصل المستخدم على بطاقة جميلة تحتوي:
- اسمه المختار (أو مجهول)
- تاريخ اليوم ورقم اليوم في رحلته
- أرجى آية خُصّت له
- جملة عهده (اختياري)
- تصميم فاخر قابل للتحميل والمشاركة على انستقرام/واتساب

**الغرض:** الانتشار الفيروسي — كل مشاركة تعريف بالتطبيق  
**الحالة:** ✅ **مُنفَّذة**  
**الملفات:**
- `artifacts/tawbah-web/src/pages/tawbah-card.tsx` — صفحة البطاقة
- `artifacts/tawbah-web/src/App.tsx` — route `/card`
- `artifacts/tawbah-web/src/pages/home.tsx` — زر "بطاقتي" في الصفحة الرئيسية

**ملاحظات:**
- تستخدم `html2canvas` لتحويل HTML إلى صورة
- البطاقات متعددة التصاميم (4 ثيمات)
- لا تحتاج backend — كل شيء client-side

---

### ✅ الميزة ٢ — نبضات التوبة (إحصاءات لحظية)

**الفكرة:** عداد حي على الصفحة الرئيسية يُظهر:
- "اليوم X شخص قالوا تبت لله"
- "هذه اللحظة X شخص يذكرون الله"
- رقم يتحرك ويشعر المستخدم أنه ليس وحده

**الغرض:** بناء الشعور المجتمعي والانتماء + حافز للمشاركة  
**الحالة:** ✅ **مُنفَّذة**  
**الملفات:**
- `lib/db/src/schema/tawbah.ts` — جدول `globalStatsTable`
- `artifacts/api-server/src/routes/tawbah.ts` — endpoints `POST /api/stats/event` و `GET /api/stats/live`
- `artifacts/tawbah-web/src/components/live-stats.tsx` — مكوّن الإحصاءات الحية
- `artifacts/tawbah-web/src/pages/home.tsx` — يعرض `<LiveStats />`
- `artifacts/tawbah-web/src/pages/dhikr.tsx` — يسجّل حدث "dhikr" كل 10 نقرات
- `artifacts/tawbah-web/src/pages/covenant.tsx` — يسجّل حدث "covenant" عند التوقيع

**ملاحظات:**
- الإحصاءات تتحدّث كل 30 ثانية تلقائياً
- الأرقام مجهولة — لا بيانات شخصية تُحفظ
- يدعم الأنواع: tawbah, dhikr, covenant, dua, quran

---

### ✅ الميزة ٣ — تحدي التوبة (Viral Challenge)

**الفكرة:**
- المستخدم يختار مدة تحدٍّ (7 / 21 / 40 / 90 يوم)
- يكتب عهداً عاماً بدون تفاصيل الذنب
- يحصل على رابط تحدٍّ فريد يشاركه
- من يفتح الرابط يرى "صديقك في يومه الـ X من رحلة التوبة"
- يمكنه إرسال دعاء تشجيعي

**الغرض:** الانتشار بالوورد أوف ماوث + ربط الناس ببعض  
**الحالة:** ✅ **مُنفَّذة**  
**الملفات:**
- `artifacts/tawbah-web/src/pages/challenge-create.tsx` — صفحة إنشاء التحدي
- `artifacts/tawbah-web/src/pages/challenge-view.tsx` — صفحة عرض التحدي العامة
- `artifacts/api-server/src/routes/tawbah.ts` — endpoints الخاصة بالتحديات

---

### ✅ الميزة ٤ — خريطة التوبة العالمية

**الفكرة:** قائمة تفاعلية تُظهر الدول الأكثر توبةً خلال آخر 7 أيام. بدون أي بيانات شخصية — فقط الدولة المختارة يدوياً أو عبر اللغة.

**الغرض:** أقوى تجربة عاطفية — "أنت لست وحدك في هذه الرحلة"  
**الحالة:** ✅ **مُنفَّذة**  
**الملفات:**
- `artifacts/tawbah-web/src/pages/tawbah-map.tsx` — صفحة الخريطة
- `artifacts/api-server/src/routes/tawbah.ts` — endpoints `POST /api/stats/pin` و `GET /api/stats/countries`

---

### ✅ الميزة ٥ — رحلة ٣٠ يوماً (Streak System)

**الفكرة:** برنامج تدريجي ٣٠ يوماً:
- كل يوم مهمة روحية + ورد قرآني + ذكر
- تتبّع التقدم مع streak counter
- في نهاية الشهر شهادة إتمام

**الغرض:** الإدمان الإيجابي على التطبيق + عودة يومية  
**الحالة:** ✅ **مُنفَّذة**  
**الملفات:**
- `artifacts/tawbah-web/src/pages/journey30.tsx` — صفحة الرحلة
- `artifacts/api-server/src/routes/journey.ts` — GET/POST endpoints
- `lib/db/src/schema/tawbah.ts` — جدول `journey30`

---

### ✅ الميزة ٦ — غرف الذكر الجماعي

**الفكرة:** غرف مجهولة لتسبيح مشترك بعداد مشترك واحد. "١٢٠٠ شخص يسبّحون الآن".

**الغرض:** تجربة جماعية روحية فريدة لا يقدمها أي تطبيق آخر  
**الحالة:** ✅ **مُنفَّذة**  
**الملفات:**
- `artifacts/tawbah-web/src/pages/dhikr-rooms.tsx` — صفحة الغرف
- `artifacts/api-server/src/routes/dhikr-rooms.ts` — GET/POST endpoints
- `lib/db/src/schema/tawbah.ts` — جدول `dhikr_rooms`

---

### ✅ الميزة ٧ — الصديق السري (دعاء مجهول)

**الفكرة:** المستخدم يكتب دعاءً لشخص مجهول في التطبيق، ويتلقّى دعاءً من شخص مجهول آخر.

**الغرض:** بناء جسور الرحمة بين المسلمين — تجربة عاطفية فريدة  
**الحالة:** ✅ **مُنفَّذة**  
**الملفات:**
- `artifacts/tawbah-web/src/pages/secret-dua.tsx` — صفحة الصديق السري
- `artifacts/api-server/src/routes/tawbah.ts` — endpoints `POST /api/secret-dua` و `GET /api/secret-dua/received`
- `lib/db/src/schema/tawbah.ts` — جدول `secret_duas`

---

### ✅ الميزة ٨ — الإشعارات الذكية بالمواقيت

**الفكرة:** إشعارات مخصصة حسب مواقيت الصلاة في مدينة المستخدم:
- "قبل الفجر بـ١٠ دقائق — الوقت الذهبي للاستغفار"
- "دخل وقت العصر — ذكر العصر"
- تحديد الموقع تلقائياً أو يدوياً

**الغرض:** التذكير اليومي = عودة مستمرة للتطبيق  
**الحالة:** ✅ **مُنفَّذة**  
**الملفات:**
- `artifacts/tawbah-web/src/pages/prayer-times.tsx` — صفحة المواقيت والإشعارات
- يستخدم aladhan.com API + Geolocation API + Browser Notification API

---

## 📊 ملخص حالة التنفيذ

| # | الميزة | الحالة | الأولوية |
|---|--------|--------|---------|
| ١ | بطاقة التوبة القابلة للمشاركة | ✅ مُنفَّذة | 🔴 عالية |
| ٢ | نبضات التوبة (إحصاءات لحظية) | ✅ مُنفَّذة | 🔴 عالية |
| ٣ | تحدي التوبة (Viral Challenge) | ✅ مُنفَّذة | 🔴 عالية |
| ٤ | خريطة التوبة العالمية | ✅ مُنفَّذة | 🟡 متوسطة |
| ٥ | رحلة ٣٠ يوماً (Streak) | ✅ مُنفَّذة | 🟡 متوسطة |
| ٦ | غرف الذكر الجماعي | ✅ مُنفَّذة | 🟡 متوسطة |
| ٧ | الصديق السري (دعاء مجهول) | ✅ مُنفَّذة | 🟢 منخفضة |
| ٨ | الإشعارات الذكية بالمواقيت | ✅ مُنفَّذة | 🟡 متوسطة |

---

## 🔧 تعليمات للمطور القادم

1. **تشغيل المشروع:** `pnpm install && pnpm run dev` من جذر المشروع
2. **متغيرات البيئة:** تُدار تلقائياً عبر Replit Secrets — لا تضع مفاتيح مباشرة في الكود
3. **قاعدة البيانات:** `pnpm --filter @workspace/db run push` لتطبيق الـ schema
4. **الـ API:** الـ backend على port 8080 والـ frontend يُرسل لـ `/api/*` عبر Vite proxy
5. **النشر:** Build command: `pnpm install && pnpm run build:prod` — Run: `node artifacts/api-server/dist/index.cjs`

### أهم الملفات
| الملف | الوظيفة |
|-------|---------|
| `artifacts/api-server/src/routes/zakiy.ts` | روتس الذكاء الاصطناعي (الزكي) |
| `artifacts/tawbah-web/src/context/SettingsContext.tsx` | إعدادات التطبيق العامة |
| `lib/db/src/schema/index.ts` | Schema قاعدة البيانات |
| `artifacts/tawbah-web/src/App.tsx` | روتر التطبيق |

---

*آخر تحديث: مارس 2026 — المطور: Replit Agent*
