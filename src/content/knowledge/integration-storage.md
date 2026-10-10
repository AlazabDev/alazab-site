---
title: "تكامل Storage — مجموعة العزب"
slug: "integration-storage"
description: "المرجع المؤسسي لتكامل Storage مع العزب ووكلاء الذكاء الاصطناعي."
section: "knowledge"
brand: "enterprise"
language: "ar-EG"
published: true
category: "AI Integrations"
updatedAt: "2026-10-10"
order: 39
---

# تكامل Storage

**المعرف:** storage
**الرابط:** https://alazab.com/knowledge/integration-storage

## الوظيفة
إدارة الملفات والوسائط عبر المزودين

## البيانات الأساسية
provider؛ bucket_or_drive؛ object_key؛ mime_type؛ checksum؛ owner_ref

## قاعدة خاصة
تحقق من صلاحية الرابط ووجود الملف ولا تفترض أنه عام أو دائم

## سياسة الاستخدام بواسطة وكلاء AI
هذه وثيقة معرفة قابلة للاسترجاع وليست أداة تنفيذ. يبدأ الوكيل بتحديد النظام المطلوب، ثم يتحقق من حالة الاتصال والأداة المصرح بها. يحتفظ بالمعرف الخارجي ومصدر الحقيقة ووقت الحدث. لا يدعي نجاح أي عملية قبل استجابة موثقة.

## عقد التبادل المشترك
source_system | external_id | correlation_id | occurred_at | project_ref | source_uri | updated_at | status. هذه أسماء حقول مفاهيمية قابلة للمطابقة، وليست ضمانًا لتوفر نفس المسميات داخل كل API.

## التحقق والأخطاء
التمييز بين: observed (مرصود)، proposed (مقترح)، verified (تم التحقق)، approved (معتمد). معالجة التكرار باستخدام معرف حدث ثابت، وحفظ نتيجة الاستدعاء والأخطاء، وعدم عرض رموز API أو الأسرار.

## حالة التكامل
توثيق استخدام مستهدف فقط. التفعيل، والاعتماد، والصلاحيات، ونقاط النهاية تُؤخذ من البيئة المباشرة والأدوات المتصلة، ولا تُستنتج من هذه الصفحة.
