export type TestDate = { day: string; month: string; year: string };
export type CardData = {
  idNumber: string; titleTh: string; firstTh: string; middleTh: string; lastTh: string;
  titleEn: string; firstEn: string; middleEn: string; lastEn: string;
  birth: TestDate; issue: TestDate; expiry: TestDate;
  address: string; issuer: string; issuerCode: string;
};
export const initialData: CardData = {
  idNumber: "3109223254063", titleTh: "นาย", firstTh: "กิตติพงศ์", middleTh: "", lastTh: "ศรีสมบัติเอ็นซีบีดี",
  titleEn: "Mr.", firstEn: "Kittipong", middleEn: "", lastEn: "SrisombatNCBD",
  birth: { day: "9", month: "11", year: "1996" }, issue: { day: "21", month: "8", year: "2023" }, expiry: { day: "21", month: "8", year: "2032" },
  address: "888 หมู่ 8 ต.ทดสอบ\nอ.ทดสอบ จังหวัด กรุงเทพฯ", issuer: "นายทะเบียนท้องถิ่น", issuerCode: "",
};
const thMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const enMonths = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
export function formatDate(value: TestDate, language: "th" | "en") {
  if (!value.day && !value.month && !value.year) return "";
  const m = /^\d{1,2}$/.test(value.month) ? Number(value.month) : 0;
  const month = m >= 1 && m <= 12 ? (language === "th" ? thMonths : enMonths)[m - 1] : value.month || "—";
  const year = language === "th" && /^\d{4}$/.test(value.year) ? String(Number(value.year) + 543) : value.year || "—";
  return [value.day || "—", month, year].join(" ");
}
export function validDate(value: TestDate) {
  if (!/^\d{1,2}$/.test(value.day) || !/^\d{1,2}$/.test(value.month) || !/^\d{4}$/.test(value.year)) return false;
  const d = Number(value.day), m = Number(value.month), y = Number(value.year);
  if (y < 1000 || y > 9999 || m < 1 || m > 12 || d < 1) return false;
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  return d <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}
export function dateValue(v: TestDate) { return Number(v.year) * 10000 + Number(v.month) * 100 + Number(v.day); }
export function fullName(data: CardData, language: "th" | "en") {
  return (language === "th" ? [data.titleTh, data.firstTh, data.middleTh, data.lastTh] : [data.titleEn, data.firstEn, data.middleEn, data.lastEn]).filter((part) => part !== "").join(" ");
}
export function dataWarnings(data: CardData): string[] {
  const result: string[] = [];
  if (!/^\d{13}$/.test(data.idNumber)) result.push("เลขประจำตัวไม่ใช่ตัวเลข 13 หลัก — ระบบคงค่าที่กรอกไว้");
  if (!data.firstTh || !data.lastTh) result.push("ชื่อหรือนามสกุลภาษาไทยว่าง");
  if (!data.firstEn || !data.lastEn) result.push("ชื่อหรือนามสกุลภาษาอังกฤษว่าง");
  for (const [key, title] of [["birth", "วันเกิด"], ["issue", "วันออกบัตร"], ["expiry", "วันหมดอายุ"]] as const) {
    if (!validDate(data[key])) result.push(`${title}ไม่ใช่วันที่ถูกต้อง — คงค่าที่กรอก ไม่มีการเลื่อนวันอัตโนมัติ`);
    if (/^\d{4}$/.test(data[key].year) && Number(data[key].year) >= 2400) result.push(`${title}: ปีที่กรอกสูงผิดปกติ ช่องนี้ใช้ปี ค.ศ. ไม่ใช่ พ.ศ.`);
  }
  if (validDate(data.birth) && validDate(data.issue) && dateValue(data.birth) > dateValue(data.issue)) result.push("วันออกบัตรอยู่ก่อนวันเกิด");
  if (validDate(data.issue) && validDate(data.expiry) && dateValue(data.expiry) < dateValue(data.issue)) result.push("วันหมดอายุอยู่ก่อนวันออกบัตร");
  const now = new Date(); const today = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  if (validDate(data.expiry) && dateValue(data.expiry) < today) result.push("บัตรจำลองนี้หมดอายุแล้ว");
  if (validDate(data.birth) && dateValue(data.birth) > today) result.push("วันเกิดอยู่ในอนาคต");
  if (!data.address) result.push("ยังไม่ได้กรอกที่อยู่");
  return result;
}
