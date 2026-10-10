---
title: "دليل تكاملات الذكاء الاصطناعي — مجموعة العزب"
slug: "ai-integrations-guide"
description: "بوابة موحدة لمراجع أنظمة العزب وتوصيلها بوكلاء AI وRAG وOpenAPI/MCP."
section: "knowledge"
brand: "enterprise"
language: "ar-EG"
published: true
category: "AI Integrations"
updatedAt: "2026-10-10"
order: 29
---

# دليل تكاملات AI في مجموعة العزب

هذه الصفحة فهرس للمعرفة المؤسسية. مصدر الحقيقة للمحتوى هو مستودع alazab-site؛ مصدر الحقيقة للحالة التشغيلية هو الخدمة المتصلة نفسها. هذه الوثائق ليست إثباتًا لتشغيل كل تكامل.

## روابط التكاملات
- [daftra](https://alazab.com/knowledge/integration-daftra)
- [forms](https://alazab.com/knowledge/integration-forms)
- [foundry](https://alazab.com/knowledge/integration-foundry)
- [frappe](https://alazab.com/knowledge/integration-frappe)
- [gcp](https://alazab.com/knowledge/integration-gcp)
- [magicplan](https://alazab.com/knowledge/integration-magicplan)
- [mail](https://alazab.com/knowledge/integration-mail)
- [openapi](https://alazab.com/knowledge/integration-openapi)
- [oracle](https://alazab.com/knowledge/integration-oracle)
- [storage](https://alazab.com/knowledge/integration-storage)
- [supabase](https://alazab.com/knowledge/integration-supabase)
- [uberfix](https://alazab.com/knowledge/integration-uberfix)
- [whatsapp](https://alazab.com/knowledge/integration-whatsapp)

## معمارية الربط الموصى بها

الحدث من Forms أو WhatsApp أو Mail → حفظ المرجع والوسائط في Storage → تحديث السجل لدى UberFix أو Frappe أو Supabase أو Daftra حسب الاختصاص → استرجاع الأدلة والبيانات عبر أدوات OpenAPI/MCP موثقة → استخدام Foundry أو أي وكيل آخر للتحليل والتقرير → مراجعة وإرسال النتيجة.

## قواعد التشغيل

1. استخدم project_ref أو request_id لربط القنوات؛ لا تعتمد الاسم النصي وحده.
2. افصل بين وصف واقعة من صورة وبين اعتماد نسبة تقدم أو تغيير حالة.
3. احتفظ بالمصادر والروابط والتوقيت وحالة الاعتماد في كل تقرير.
4. لا تضع credentials أو tokens أو مفاتيح الخدمة في هذه الصفحات العامة.
5. لا تعتبر أداة متصلة لمجرد وجود توثيقها؛ تحقق من نتيجتها المباشرة.
6. راجع مواصفات OpenAPI وحقوق الوصول وفق الخدمة الحقيقية.

## إمكانية الفهرسة

كل تكامل له صفحة Markdown مستقلة مع frontmatter، slug ثابت، رابط canonical في محتوى الصفحة، ومصطلحات عربية وإنجليزية. يمكن لمحركات RAG جمعها كوثائق، كما يمكن لوكلاء AI الاستشهاد بالصفحات مع الرجوع إلى API المباشر للبيانات المتغيرة.
