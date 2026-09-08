"use client";
import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, ShieldCheck, ScanLine, RotateCcw, Check, TriangleAlert, LockKeyhole, X, Move, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Toaster, toast } from "sonner";
import { initialData, dataWarnings, formatDate, type CardData, type TestDate } from "@/lib/card-data";
import { drawCard, WIDTH, HEIGHT, type Crop, type CardAssets } from "@/lib/draw-card";

type TextField = Exclude<keyof CardData, "birth" | "issue" | "expiry">;
export default function Studio() {
  const [data, setData] = useState<CardData>({ ...initialData });
  const [portrait, setPortrait] = useState<HTMLImageElement | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [crop, setCrop] = useState<Crop>({ zoom: 1, x: 50, y: 50 });
  const [scale, setScale] = useState("2");
  const [fontReady, setFontReady] = useState(false);
  const [fontError, setFontError] = useState(false);
  const [assets, setAssets] = useState<CardAssets | null>(null);
  const [assetError, setAssetError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState<{url:string; name:string; width:number; height:number} | null>(null);
  const exportUrl = useRef<string | null>(null);
  const exportBusy = useRef(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [layoutWarnings, setLayoutWarnings] = useState<string[]>([]);
  const [tab, setTab] = useState("identity");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const photoUrl = useRef<string | null>(null);
  const photoSequence = useRef(0);
  const dataRef = useRef(data);
  dataRef.current = data;
  const latestExportInput = useRef({data,portrait,crop,scale});
  latestExportInput.current = {data,portrait,crop,scale};

  useEffect(() => {
    setExported(null);
    if (exportUrl.current) URL.revokeObjectURL(exportUrl.current);
    exportUrl.current = null;
  }, [data, portrait, crop, scale]);
  useEffect(() => () => { if(exportUrl.current) URL.revokeObjectURL(exportUrl.current); }, []);

  useEffect(() => {
    let active = true;
    const reference = new Image(), clean = new Image();
    reference.src = "/card-reference.jpeg"; clean.src = "/card-clean.png";
    Promise.all([reference.decode(), clean.decode()]).then(() => {
      if (active) setAssets({reference, clean});
    }).catch(() => { if (active) setAssetError(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([document.fonts.load('400 32px "Sarabun"', 'ทดสอบ Test'), document.fonts.load('600 32px "Sarabun"', 'ทดสอบ Test')])
      .then((fonts) => { if (active) { if (fonts.some((f) => f.length === 0)) throw new Error("font missing"); setFontReady(true); } })
      .catch(() => { if (active) setFontError(true); });
    return () => { active = false; photoSequence.current++; if (photoUrl.current) URL.revokeObjectURL(photoUrl.current); };
  }, []);
  useEffect(() => {
    if (canvasRef.current && fontReady && assets) setLayoutWarnings(drawCard(canvasRef.current, data, portrait, crop, 1, assets));
  }, [data, portrait, crop, fontReady, assets]);
  const warnings = [...dataWarnings(data), ...layoutWarnings];
  const setField = (key: TextField, value: string) => setData((old) => ({ ...old, [key]: value }));
  const changeDate = (key: "birth" | "issue" | "expiry", part: keyof TestDate, value: string) => setData((old) => ({ ...old, [key]: { ...old[key], [part]: value } }));
  const field = (key: TextField, label: string, placeholder?: string, className = "") => <div className={`field ${className}`}><label htmlFor={key}>{label}</label><Input id={key} value={data[key]} placeholder={placeholder} autoComplete="off" spellCheck={false} onChange={(e) => setField(key, e.target.value)} /></div>;
  const dateFields = (key: "birth" | "issue" | "expiry", label: string) => <fieldset className="date-field"><legend>{label}</legend><div className="date-inputs">{([['day', 'วัน', 'DD'], ['month', 'เดือน', 'MM'], ['year', 'ปี ค.ศ.', 'YYYY']] as const).map(([part, title, placeholder]) => <div key={part}><label htmlFor={`${key}-${part}`} className="sr-only">{label} {title}</label><Input id={`${key}-${part}`} aria-label={`${label} ${title}`} value={data[key][part]} inputMode="numeric" placeholder={placeholder} autoComplete="off" onChange={(e) => changeDate(key, part, e.target.value)} /></div>)}</div><p className="field-help">{formatDate(data[key], "th") || "วัน / เดือน / ปี ค.ศ. → แสดง พ.ศ. บนบัตร"}</p></fieldset>;

  async function importPhoto(file?: File) {
    if (photoRef.current) photoRef.current.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { toast.error("รองรับเฉพาะรูป PNG, JPG และ WebP"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("กรุณาเลือกรูปขนาดไม่เกิน 10 MB"); return; }
    const sequence = ++photoSequence.current;
    setPhotoLoading(true);
    const url = URL.createObjectURL(file), img = new Image();
    try {
      img.src = url; await img.decode();
      if (sequence !== photoSequence.current) { URL.revokeObjectURL(url); return; }
      if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth * img.naturalHeight > 24000000) throw new Error("resolution");
      if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
      photoUrl.current = url;
      setPortrait(img); setPhotoName(file.name); setCrop({ zoom: 1, x: 50, y: 50 });
      toast.success("เพิ่มรูปแล้ว ปรับตำแหน่งได้ด้านล่าง");
    } catch {
      URL.revokeObjectURL(url);
      if (sequence === photoSequence.current) toast.error("อ่านรูปไม่ได้ หรือความละเอียดเกิน 24 ล้านพิกเซล กรุณาเลือกรูปอื่น");
    } finally { if (sequence === photoSequence.current) setPhotoLoading(false); }
  }
  function removePhoto() {
    photoSequence.current++;
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    photoUrl.current = null; setPortrait(null); setPhotoName(""); setPhotoLoading(false); setCrop({ zoom: 1, x: 50, y: 50 });
  }
  async function exportPng() {
    if (!fontReady || !assets || exportBusy.current || photoLoading) return;
    exportBusy.current = true;
    const snapshot = latestExportInput.current;
    setExporting(true);
    try {
      const canvas = document.createElement("canvas");
      drawCard(canvas, dataRef.current, portrait, crop, Number(scale), assets);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("PNG encoding failed")), "image/png"));
      const current = latestExportInput.current;
      if(current.data!==snapshot.data || current.portrait!==snapshot.portrait || current.crop!==snapshot.crop || current.scale!==snapshot.scale) {
        toast.info("ข้อมูลเปลี่ยนระหว่างสร้างภาพ กรุณากดดาวน์โหลดอีกครั้ง"); return;
      }
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = `mock-card-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
      if(exportUrl.current) URL.revokeObjectURL(exportUrl.current);
      exportUrl.current = url;
      setExported({url,name:link.download,width:canvas.width,height:canvas.height});
      document.body.appendChild(link); link.click(); link.remove();
      toast.success("สร้าง PNG แล้ว", { description: "ถ้ายังไม่มีไฟล์ ให้กดบันทึก PNG อีกครั้ง หรือเปิดภาพเพื่อบันทึก" });
    } catch { toast.error("ส่งออกไม่สำเร็จ ลองขนาด 1× หรือเลือกรูปที่เล็กลง"); }
    finally { exportBusy.current = false; setExporting(false); }
  }

  return <div className="app-shell">
    <Toaster position="top-center" richColors />
    <header className="topbar"><a href="#main" className="brand" aria-label="Mock Card Studio"><span className="brand-symbol"><ScanLine size={22} /></span><span>Mock Card <strong>Studio</strong></span></a><div className="topbar-meta"><span className="environment">NTB / DEV</span><span className="local-badge"><LockKeyhole size={14} /> ข้อมูลอยู่ในเบราว์เซอร์</span></div></header>
    <main id="main">
      <div className="page-heading"><div><p className="eyebrow">QA WORKSPACE</p><h1>สร้างบัตรข้อมูลทดสอบ</h1><p className="intro">แก้ไขแต่ละช่อง แล้วดาวน์โหลดภาพไปใช้ทดสอบ</p></div>
        <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="reset-button"><RotateCcw size={16} /> เริ่มใหม่</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>เริ่มจากข้อมูลตัวอย่างใหม่?</AlertDialogTitle><AlertDialogDescription>ข้อมูลที่แก้ไขและรูปที่เลือกในหน้านี้จะถูกล้าง ไฟล์ PNG ที่ดาวน์โหลดไปแล้วจะไม่เปลี่ยนแปลง</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>ยกเลิก</AlertDialogCancel><AlertDialogAction onClick={() => { setData({ ...initialData }); removePhoto(); setTab("identity"); toast.success("กลับเป็นข้อมูลตัวอย่างแล้ว"); }}>เริ่มใหม่</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </div>
      <div className="editor-layout">
        <section className="form-panel" aria-label="แก้ไขข้อมูลบัตร"><div className="panel-heading"><h2>ข้อมูลบนบัตร</h2><span className="panel-note">แก้ไขได้ทุกช่อง</span></div>
          <Tabs value={tab} onValueChange={setTab} className="editor-tabs"><TabsList className="form-tabs" aria-label="หมวดข้อมูล"><TabsTrigger value="identity">บุคคล</TabsTrigger><TabsTrigger value="details">วันและที่อยู่</TabsTrigger><TabsTrigger value="photo">รูปภาพ</TabsTrigger></TabsList>
            <TabsContent value="identity" className="form-content">
              {field("idNumber", "เลขประจำตัวทดสอบ", "กรอกเป็นข้อความได้ รวมเลข 0 นำหน้า", "mono-field")}<p className="field-help">เก็บค่าตามที่กรอก ไม่เติมเลขหรือลบศูนย์นำหน้า</p>
              <div className="section-label"><span>ชื่อภาษาไทย</span><span>TH</span></div>
              {field("titleTh", "คำนำหน้า (ไทย)")}<div className="two-fields">{field("firstTh", "ชื่อ (ไทย)")}{field("middleTh", "ชื่อกลาง (ไทย)", "ไม่บังคับ")}</div>{field("lastTh", "นามสกุล (ไทย)")}
              <div className="section-label"><span>ชื่อภาษาอังกฤษ</span><span>EN</span></div>
              {field("titleEn", "คำนำหน้า (อังกฤษ)")}<div className="two-fields">{field("firstEn", "ชื่อ (อังกฤษ)")}{field("middleEn", "ชื่อกลาง (อังกฤษ)", "ไม่บังคับ")}</div>{field("lastEn", "นามสกุล (อังกฤษ)")}
            </TabsContent>
            <TabsContent value="details" className="form-content"><p className="input-note">กรอกวัน / เดือน / ปี ค.ศ. ระบบแสดงปี พ.ศ. ให้บนบัตร</p>{dateFields("birth", "วันเกิด")}{dateFields("issue", "วันออกบัตร")}{dateFields("expiry", "วันหมดอายุ")}<div className="section-label"><span>ที่อยู่และหน่วยงาน</span></div><div className="field"><label htmlFor="address">ที่อยู่</label><Textarea id="address" value={data.address} rows={3} onChange={(e) => setField("address", e.target.value)} /><p className="field-help">กดขึ้นบรรทัดใหม่เพื่อแบ่งที่อยู่บนบัตร</p></div>{field("issuer", "หน่วยงานออกบัตร")}{field("issuerCode", "รหัสหน่วยงาน", "ไม่บังคับ · เพิ่มใต้ตราเมื่อกรอก")}</TabsContent>
            <TabsContent value="photo" className="form-content">
              <div className="upload-area" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void importPhoto(e.dataTransfer.files[0]); }}><span className="upload-icon"><ImagePlus size={26} /></span><h3>เพิ่มรูปบนบัตร</h3><p>เริ่มต้นด้วย Luffy ตามต้นแบบ เลือกรูปใหม่เพื่อแทนที่</p><input ref={photoRef} id="portrait-upload" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="เลือกรูปภาพ" onChange={(e) => void importPhoto(e.target.files?.[0])} /><Button variant="outline" onClick={() => photoRef.current?.click()} disabled={photoLoading}>{photoLoading ? "กำลังอ่านรูป…" : "เลือกรูปภาพ"}</Button><span className="file-hint">PNG, JPG, WebP · ไม่เกิน 10 MB / 24 MP</span></div>
              {portrait && <><div className="photo-selected"><span title={photoName}><FileImage size={16} />{photoName}</span><Button variant="ghost" size="icon" aria-label="คืนรูปต้นแบบ" onClick={removePhoto}><X size={16} /></Button></div><div className="section-label"><span><Move size={14} /> จัดตำแหน่งรูป</span></div>{([['zoom', 'ขยายรูป', 1, 3, .05], ['x', 'ตำแหน่งซ้าย–ขวา', 0, 100, 1], ['y', 'ตำแหน่งบน–ล่าง', 0, 100, 1]] as const).map(([key, label, min, max, step]) => <div className="crop-control" key={key}><div><span id={`crop-label-${key}`}>{label}</span><output>{key === "zoom" ? `${crop[key].toFixed(2)}×` : `${crop[key]}%`}</output></div><Slider aria-label={label} aria-labelledby={`crop-label-${key}`} min={min} max={max} step={step} value={[crop[key]]} onValueChange={([value]) => setCrop((old) => ({ ...old, [key]: value }))} /></div>)}<Button variant="outline" onClick={() => setCrop({ zoom: 1, x: 50, y: 50 })}><RotateCcw size={15} /> คืนตำแหน่งกลาง</Button></>}
              <p className="photo-privacy"><LockKeyhole size={16} /> รูปถูกอ่านบนอุปกรณ์นี้ ไม่ได้อัปโหลดไปเก็บที่เซิร์ฟเวอร์</p>
            </TabsContent>
          </Tabs><div className="form-foot"><TriangleAlert size={15} /><p>รองรับ negative test: ค่าผิดรูปแบบเตือนให้ทราบ แต่ไม่บล็อกการส่งออก</p></div>
        </section>
        <section className="preview-column" aria-label="ตัวอย่างและดาวน์โหลด"><div className="preview-panel"><div className="preview-heading"><h2>ตัวอย่างบัตร</h2><span><ScanLine size={14} /> LIVE PREVIEW</span></div><div className="canvas-stage"><div className="canvas-wrap"><canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="ภาพตัวอย่างบัตรข้อมูลจำลอง เปลี่ยนตามข้อมูลที่กรอก" role="img" />{(!fontReady || !assets) && <div className="canvas-loading" role="status">{(fontError || assetError) ? "โหลดฟอนต์หรือภาพต้นแบบไม่สำเร็จ กรุณารีเฟรช" : "กำลังเตรียมฟอนต์และภาพต้นแบบ…"}</div>}</div><div className="canvas-caption"><span>เทมเพลตบัตรจำลอง / ด้านหน้า</span><span>{WIDTH} × {HEIGHT} px</span></div></div><div className="export-bar"><div className="export-option"><label htmlFor="export-scale">ขนาดไฟล์ PNG</label><Select value={scale} onValueChange={setScale}><SelectTrigger id="export-scale"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1× · 1536 × 1024 px</SelectItem><SelectItem value="2">2× · 3072 × 2048 px</SelectItem></SelectContent></Select></div><Button className="download-button" onClick={() => void exportPng()} disabled={!fontReady || !assets || photoLoading || exporting}><Download size={18} />{exporting ? "กำลังสร้าง PNG…" : "ดาวน์โหลด PNG"}</Button></div></div>
          {exported && <div className="export-result" aria-label="ไฟล์ PNG ที่สร้างแล้ว"><p role="status">PNG พร้อมบันทึก · {exported.width} × {exported.height} px</p><div><a href={exported.url} download={exported.name}>บันทึก PNG อีกครั้ง</a><Dialog><DialogTrigger asChild><Button variant="outline">เปิดภาพเพื่อบันทึก</Button></DialogTrigger><DialogContent className="png-dialog"><DialogHeader><DialogTitle>ภาพ PNG ที่สร้างแล้ว</DialogTitle><DialogDescription>บนมือถือ แตะภาพค้างแล้วเลือกบันทึกภาพ หรือใช้ลิงก์ดาวน์โหลดด้านล่าง</DialogDescription></DialogHeader>{/* Canvas-derived blob only; no remote URL is accepted. */}<img src={exported.url} alt="ไฟล์ PNG บัตรจำลองพร้อมบันทึก" width={exported.width} height={exported.height} /><a href={exported.url} download={exported.name}>ดาวน์โหลดไฟล์ PNG นี้</a></DialogContent></Dialog></div></div>}
          <div className="specimen-note"><ShieldCheck size={21} /><div><h3>สำหรับทดสอบเท่านั้น</h3><p>ทุกภาพมีข้อความ MOCK DATA · DEV TEST · NOT VALID ใช้ข้อมูลสมมติเท่านั้น บาร์โค้ดและตราเป็นภาพคงที่ ไม่เปลี่ยนตามข้อมูล</p></div></div>
          <div className={`validation-panel ${warnings.length ? "has-warnings" : ""}`} aria-live="polite"><div className="validation-title">{warnings.length ? <TriangleAlert size={17} /> : <Check size={17} />}<h3>{warnings.length ? `ข้อสังเกต ${warnings.length} รายการ · ยังดาวน์โหลดได้` : "ข้อมูลอยู่ในพื้นที่แสดงผล"}</h3></div>{warnings.length > 0 ? <ul>{warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul> : <p>รูปแบบและความยาวเบื้องต้นเท่านั้น ไม่ใช่การตรวจสอบตัวตนหรือรับรองผล OCR</p>}</div>
          <p className="session-note">ไม่มีการบันทึกข้อมูลอัตโนมัติ รีเฟรชหรือปิดหน้าแล้วข้อมูลที่กรอกจะหาย</p>
        </section>
      </div>
    </main><footer><span>MOCK CARD STUDIO</span><span>DEV TEST FIXTURE</span></footer>
  </div>;
}
