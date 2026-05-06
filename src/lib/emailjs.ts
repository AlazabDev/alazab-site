
import emailjs from '@emailjs/browser';

// تهيئة EmailJS
emailjs.init('18ygGgryRoGve-Tpw');

export const sendEmail = async (templateParams: Record<string, unknown>) => {
  try {
    const response = await emailjs.send(
      'service_Alazab.co', 
      'template_hbb46pi',
      templateParams
    );
    return { success: true, response };
  } catch (error) {
    console.error('فشل في إرسال البريد الإلكتروني:', error);
    return { success: false, error };
  }
};
