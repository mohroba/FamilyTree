export const toPersianDigits = (num: number | string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return toPersianDigits(dateStr);
};
