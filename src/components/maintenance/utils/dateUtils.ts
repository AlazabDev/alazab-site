
export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleDateString('ar-SA');
};
