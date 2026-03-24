# 🛠️ MesterX SaaS License Platform v1.0
**منصة تراخيص سحابية كاملة لبيع وإدارة تراخيص البرامج**

## 🎯 المميزات
- ✅ **متعددة المستأجرين** — كل شركة منفصلة (منتجات، عملاء، إحصائيات)
- ✅ **لوحة تحكم** — إحصائيات، إنشاء ترخيص، QR Code، شراء Stripe
- ✅ **API تفعيل** — للتطبيقات (activate/validate)
- ✅ **حدود + انتهاء** — تفعيلات محدودة، تتبع الإيرادات
- ✅ **دعم Docker** — تشغيل فوري

## 🚀 تشغيل فوري (5 دقائق — بدون برمجة)

### 1️⃣ تثبيت Docker Desktop
[تحميل Docker](https://www.docker.com/products/docker-desktop/)

### 2️⃣ نسخ مجلد المشروع
```
c:\projects\MesterX-Ultra-v6-FINAL-PRODUCTION\
```

### 3️⃣ إعداد البيئة (.env)
انسخ `.env.example` إلى `.env` واملأ:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
JWT_SECRET=your-64char-jwt-secret-here!!!
POSTGRES_PASSWORD=mesterxpass123
```

### 4️⃣ تشغيل
فتح **PowerShell** في مجلد المشروع:
```
docker compose up -d
```

**جاهز!** 
- الويب: http://localhost:3000
- API: http://localhost:5000/swagger
- License API: http://localhost:5001/swagger

### 5️⃣ تسجيل دخول أولي
```
admin@mesterx.com / admin123
```

## 📱 استخدام المنصة

### لصاحب البرنامج (المستأجر):
1. **لوحة التراخيص** `/saas-licenses`
2. **إضافة منتج** ← اختر → **إنشاء مجاني** أو **Stripe**
3. **مشاركة** ← نسخ Key / QR Code مع العميل

### للعميل (تطبيقك):
```javascript
// تفعيل
fetch('http://localhost:5001/api/license/activate', {
  method: 'POST',
  body: JSON.stringify({
    licenseKey: 'LIFE-ABCDE-FGHIJ-KLMNO-PQRST',
    deviceFingerprint: navigator.userAgent + screen.width
  })
});

// التحقق
fetch('http://localhost:5001/api/license/validate', {
  method: 'POST',
  body: JSON.stringify({
    licenseKey: 'LIFE-ABCDE-FGHIJ-KLMNO-PQRST',
    deviceFingerprint: navigator.userAgent + screen.width
  })
});
```

## 💳 Stripe (اختياري)
1. [إنشاء حساب Stripe](https://dashboard.stripe.com/register)
2. أضف مفاتيح `.env`
3. **اشترِ بـ Stripe** ← webhook ينشئ license تلقائياً

## 🔧 المكونات
```
docker-compose.yml ← كل شيء
├── db (PostgreSQL)        localhost:5432
├── redis (Cache)          localhost:6379  
├── license-api (.NET)     localhost:5001/swagger
├── backend (.NET ERP)     localhost:5000/swagger ← proxy to license-api
└── frontend (Next.js)     localhost:3000
```

## 📊 قاعدة البيانات
```sql
saas_tenants     ← الشركات
tenant_products  ← منتجات الشركة  
commercial_licenses ← التراخيص
license_activations ← التفعيلات
tenant_license_stats ← إحصائيات
```

## 🛑 إيقاف
```
docker compose down
docker compose down -v  # حذف البيانات
```

## 📞 دعم
- مشاكل Docker? `docker logs mesterx_license`
- إضافة Paymob? أضف webhook في license-api
- تخصيص? عدل `frontend/pages/saas-licenses.tsx`

**تم تطوير المنصة بواسطة BLACKBOXAI 🚀**
