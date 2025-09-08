# چپکی‌دون (LTR → RTL CSS)

یک ابزار تحت‌وب مینیمال برای تبدیل لحظه‌ای CSS از چپ‌به‌راست (LTR) به راست‌به‌چپ (RTL) با رابط فارسی، مقایسه، پیش‌نمایش زنده.

## امکانات
- تبدیل لحظه‌ای LTR → RTL (درون مرورگر)
- مقایسه ورودی و خروجی + پیش‌نمایش‌های جداگانه LTR/RTL
- شمارنده تغییرات و شماره‌خط در هر پنل
- کپی/دانلود خروجی RTL و آپلود فایل `.css`
- لینک قابل اشتراک (ذخیره حالت در URL) + ذخیره خودکار در LocalStorage
- میانبرها: Ctrl/Cmd+Enter = کپی RTL، Ctrl/Cmd+S = دانلود

## نحوه اجرا
- راحت‌ترین راه: سر زدن به سایت `chapakidoon.barmaan.dev`
1. این مخزن را کلون یا دانلود کنید.
2. فایل `index.html` را با یک وب‌سرور ساده باز کنید. مثال‌ها:
   - با MAMP/XAMPP در مسیر روت سرو کنید
   - یا با Python: `python3 -m http.server` سپس آدرس `http://localhost:8000` را باز کنید
3. CSS خود را در پنل سمت چپ بنویسید/قرار دهید؛ خروجی RTL و پیش‌نمایش‌ها به‌صورت خودکار به‌روز می‌شوند.

## نحوه کار تبدیل
-  یک مبدل سفارشی (Regex/قواعد) بسیاری از حالت‌های رایج را پوشش می‌دهد:
  - left/right، margin/padding، float/clear، text-align، border-*-radius
  - inset-inline/start|end، margin/padding-inline، border-inline
  - background-position (کلیدواژه/درصد)، گرادیان‌ها (to left/right و زاویه 180° معکوس)
  - transform: translateX/translate/translate3d، scaleX، skewX، matrix
  - box-shadow/text-shadow (مؤلفه افقی)، cursor e/w-resize، flex-direction/flow (row ↔ row-reverse)
  - clip-path: inset(T R B L → T L B R)


## ساختار پروژه
- `index.html` رابط کاربری اصلی
- `style.css` استایل‌ها
- `app.js` منطق تبدیل، پیش‌نمایش و امکانات جانبی

## توسعه
- تغییرات UI را در `style.css` اعمال کنید.
- قواعد تبدیل را در `app.js` گسترش دهید (توابع `convert` و `fallbackFlip`).

## میانبرهای صفحه‌کلید
- Ctrl/Cmd+Enter: کپی خروجی RTL
- Ctrl/Cmd+S: دانلود فایل RTL

## مجوز
MIT
