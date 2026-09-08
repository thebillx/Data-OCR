"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { daysInMonth, formatDate, selectDatePart, selectableDate, thMonths, titleOptions, titleText, validDate, type TestDate, type TitleId } from "@/lib/card-data";

const EMPTY = "__empty__";

export function TitleField({ value, onChange }: {
  value: TitleId | null; onChange: (value: TitleId | null) => void;
}) {
  const title = titleText(value);
  return <div className="field title-field">
    <label htmlFor="title">คำนำหน้า</label>
    <Select value={value ?? EMPTY} onValueChange={(next) => onChange(titleOptions.find((option) => option.id === next)?.id ?? null)}>
      <SelectTrigger id="title" aria-label="คำนำหน้า" aria-describedby="title-help"><SelectValue /></SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value={EMPTY}>ไม่ระบุคำนำหน้า</SelectItem>
        {titleOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.th} — {option.en}</SelectItem>)}
      </SelectContent>
    </Select>
    <p id="title-help" className="field-help">{value === null ? "ยังไม่แสดงคำนำหน้าทั้งสองภาษา" : `ไทย: ${title.th} · อังกฤษ: ${title.en}`} · เลือกครั้งเดียว ไม่ต้องพิมพ์ในช่องชื่อ</p>
  </div>;
}

export function DateField({ id, label, value, currentYear, onChange, shortcut }: {
  id: string; label: string; value: TestDate; currentYear: number;
  onChange: (value: TestDate) => void;
  shortcut?: { label: string; disabled?: boolean; apply: () => void };
}) {
  const [manual, setManual] = useState(false);
  const [notice, setNotice] = useState("");
  const empty = !value.day && !value.month && !value.year;
  const invalid = !empty && !validDate(value);
  // Preserve deliberately invalid input until the user explicitly clears or corrects it.
  const isManual = manual || !selectableDate(value);
  const years = Array.from({ length: currentYear + 21 - 1900 }, (_, i) => String(currentYear + 20 - i));
  if (/^\d{4}$/.test(value.year) && !years.includes(value.year)) years.unshift(value.year);
  const options = {
    day: Array.from({ length: daysInMonth(value.month, value.year) }, (_, i) => ({ value: String(i + 1), label: String(i + 1).padStart(2, "0") })),
    month: thMonths.map((month, i) => ({ value: String(i + 1), label: month })),
    year: years.map((year) => ({ value: year, label: year })),
  };
  const pick = (part: keyof TestDate, next: string) => {
    const result = selectDatePart(value, part, next === EMPTY ? "" : next);
    setNotice(result.day !== value.day && part !== "day" ? `ปรับวันเป็น ${result.day} ตามเดือนและปีที่เลือก` : "");
    onChange(result);
  };
  return <fieldset className="date-field">
    <legend>{label}</legend>
    <div className="date-inputs">
      {([['day', 'วัน', 'DD'], ['month', 'เดือน', 'MM'], ['year', 'ปี ค.ศ.', 'YYYY']] as const).map(([part, title, placeholder]) => <div key={part}>
        <label htmlFor={`${id}-${part}`} className="date-part-label">{title}</label>
        {isManual ? <Input id={`${id}-${part}`} aria-label={`${label} ${title}`} value={value[part]} placeholder={placeholder} autoComplete="off" onChange={(e) => { setNotice(""); onChange({ ...value, [part]: e.target.value }); }} /> :
          <Select value={value[part] ? String(Number(value[part])) : EMPTY} onValueChange={(next) => pick(part, next)}>
            <SelectTrigger id={`${id}-${part}`} aria-label={`${label} ${title}`}><SelectValue /></SelectTrigger>
            <SelectContent position="popper"><SelectItem value={EMPTY}>—</SelectItem>{options[part].map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>}
      </div>)}
    </div>
    <p className="field-help">{formatDate(value, "th") || "เลือกวัน เดือน และปี ค.ศ. · แสดง พ.ศ. บนบัตร"}</p>
    {notice && <p className="date-notice" role="status">{notice}</p>}
    <div className="date-actions">
      {shortcut && <Button type="button" variant="outline" size="sm" disabled={shortcut.disabled} onClick={() => { setNotice(""); shortcut.apply(); }}>{shortcut.label}</Button>}
      <Button type="button" variant="ghost" size="sm" onClick={() => { setNotice(""); onChange({ day: "", month: "", year: "" }); }}>ล้าง{label}</Button>
      <Button type="button" variant="ghost" size="sm" aria-pressed={isManual} onClick={() => {
        if (isManual && invalid) { setNotice("แก้วันที่ให้ถูกต้องหรือล้างค่าก่อนกลับไปใช้ dropdown"); return; }
        setNotice(""); setManual(!isManual);
      }}>{isManual ? "ใช้ dropdown" : "กรอกเอง (negative test)"}</Button>
    </div>
  </fieldset>;
}
