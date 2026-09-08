import { formatDate, fullName, initialData, type CardData } from "./card-data";
export const WIDTH = 1536, HEIGHT = 1024;
export const WATERMARK = "MOCK DATA • DEV TEST • NOT VALID";
export type Crop = { zoom: number; x: number; y: number };
export type CardAssets = { reference: HTMLImageElement; clean: HTMLImageElement };
export function displayId(value: string) {
  return /^\d{13}$/.test(value) ? value.replace(/^(\d)(\d{4})(\d{5})(\d{2})(\d)$/, "$1 $2 $3 $4 $5") : value;
}
/** Original specimen pixels are retained except for edited fields.
 * Barcode and stamp remain decorative; they do not encode entered values.
 */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, photo: HTMLImageElement | null, crop: Crop, scale: number, assets: CardAssets): string[] {
  canvas.width = WIDTH * scale; canvas.height = HEIGHT * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.globalCompositeOperation = "source-over";
  ctx.scale(scale, scale); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  const textChanged = JSON.stringify(data) !== JSON.stringify(initialData);
  // Once any text changes, render every editable value over one full clean plate.
  // This avoids both old-glyph shadows and visible rectangular repair seams.
  ctx.drawImage(textChanged ? assets.clean : assets.reference, 0, 0, WIDTH, HEIGHT);
  if (textChanged) {
    // The supplied clean plate intentionally retains the original issuer line.
    // Replace it with a feathered nearby texture patch, then restore the fixed stamp.
    const issuerPatch=document.createElement("canvas"), issuerMask=document.createElement("canvas");
    issuerPatch.width=issuerMask.width=390; issuerPatch.height=issuerMask.height=54;
    const patchContext=issuerPatch.getContext("2d"), maskContext=issuerMask.getContext("2d");
    if (!patchContext || !maskContext) throw new Error("Canvas unavailable");
    patchContext.drawImage(assets.clean, 430, 963, 390, 54, 0, 0, 390, 54);
    maskContext.fillStyle="#fff"; maskContext.filter="blur(6px)"; maskContext.fillRect(8,6,374,42);
    maskContext.filter="none"; maskContext.fillRect(14,8,362,38);
    patchContext.globalCompositeOperation="destination-in"; patchContext.drawImage(issuerMask,0,0);
    ctx.drawImage(issuerPatch,430,862);
    ctx.drawImage(assets.clean, 525, 747, 138, 124, 525, 747, 138, 124);
  }
  const warnings: string[] = [];
  const black = "#080d0d", blue = "#080d80";
  type Rect = [number, number, number, number];
  const field = (value: string, _original: string, rect: Rect, baseline: number, size: number, label: string, color = black) => {
    if (!textChanged) return;
    if (value.length > 4096) { warnings.push(`${label}ยาวมาก แสดงเฉพาะส่วนที่อยู่ในพื้นที่บัตร`); value = value.slice(0,4096); }
    const [x,y,w,h] = rect;
    let fitted = size;
    ctx.font = `600 ${fitted}px Sarabun, sans-serif`;
    while (ctx.measureText(value).width > w - 8 && fitted > 24) { fitted--; ctx.font = `600 ${fitted}px Sarabun, sans-serif`; }
    if (ctx.measureText(value).width > w - 8) warnings.push(`${label}ยาวเกินพื้นที่ ภาพจะแสดงไม่ครบ`);
    ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
    ctx.fillStyle = color; ctx.fillText(value, x + 3, baseline); ctx.restore();
  };
  const englishName = (d: CardData) => [d.titleEn,d.firstEn,d.middleEn].filter(Boolean).join(" ");
  field(displayId(data.idNumber), displayId(initialData.idNumber), [650,113,775,76],174,56,"เลขประจำตัว");
  field(displayId(data.idNumber), displayId(initialData.idNumber), [1100,880,352,56],923,36,"เลขใต้รูป");
  field(fullName(data,"th"),fullName(initialData,"th"),[455,211,1055,77],274,47,"ชื่อภาษาไทย");
  field(englishName(data),englishName(initialData),[625,301,450,60],348,41,"ชื่อภาษาอังกฤษ",blue);
  field(data.lastEn,initialData.lastEn,[658,365,418,57],409,39,"นามสกุลภาษาอังกฤษ",blue);
  field(formatDate(data.birth,"th"),formatDate(initialData.birth,"th"),[638,434,436,58],479,41,"วันเกิดภาษาไทย");
  field(formatDate(data.birth,"en"),formatDate(initialData.birth,"en"),[708,495,367,56],539,38,"วันเกิดภาษาอังกฤษ",blue);
  if (textChanged) {
    if(data.address.length>4096) warnings.push("ที่อยู่ยาวมาก แสดงเฉพาะส่วนที่อยู่ในพื้นที่บัตร");
    const lines: string[] = []; let available = 790;
    ctx.font = "600 38px Sarabun, sans-serif";
    addressLines: for (const paragraph of data.address.slice(0,4096).split("\n")) {
      let line = "";
      for (const {segment} of new Intl.Segmenter("th", {granularity:"grapheme"}).segment(paragraph)) {
        if (line && ctx.measureText(line+segment).width > available) { lines.push(line); line = ""; available = 880; if(lines.length>2) break addressLines; }
        line += segment;
      }
      lines.push(line); available = 880;
      if (lines.length > 2) break;
    }
    if (lines.length > 2) warnings.push("ที่อยู่เกิน 2 บรรทัดในต้นแบบ จะแสดงเฉพาะ 2 บรรทัดแรก");
    ctx.fillStyle = black;
    ctx.save();ctx.beginPath();ctx.rect(175,610,890,134);ctx.clip();
    lines.slice(0,2).forEach((line,i) => ctx.fillText(line,i ? 178 : 276,i ? 727 : 662));
    ctx.restore();
  }
  for (const [key,x,w] of [["issue",175,270],["expiry",805,270]] as const) {
    field(formatDate(data[key],"th"),formatDate(initialData[key],"th"),[x,764,w,49],806,36,`${key} ไทย`);
    field(formatDate(data[key],"en"),formatDate(initialData[key],"en"),[x,870,w,44],906,33,`${key} อังกฤษ`,blue);
  }
  field(data.issuer ? `(${data.issuer})` : "",`(${initialData.issuer})`,[450,862,350,54],904,29,"หน่วยงานออกบัตร");
  if (data.issuerCode) field(data.issuerCode,"",[450,963,350,38],992,25,"รหัสหน่วยงาน",blue);
  if (photo) {
    const px=1092,py=433,pw=359,ph=433;
    const ratio=Math.max(pw/photo.naturalWidth,ph/photo.naturalHeight)*crop.zoom;
    const w=photo.naturalWidth*ratio,h=photo.naturalHeight*ratio;
    ctx.save();ctx.beginPath();ctx.roundRect(px,py,pw,ph,24);ctx.clip();
    ctx.fillStyle="#e7e9eb";ctx.fillRect(px,py,pw,ph);
    ctx.drawImage(photo,px-(w-pw)*crop.x/100,py-(h-ph)*crop.y/100,w,h);ctx.restore();
  }
  // Restore original warning last, outside all editable regions.
  ctx.drawImage(assets.reference,1098,0,438,38,1098,0,438,38);
  return warnings;
}
