"use client";

import { useState } from "react";
import { Database, Save, Trash2, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { SavedProfile } from "@/lib/profile-store";

const NONE = "__none__";

export function ProfileManager({
  profiles,
  selectedId,
  dirty,
  disabled,
  onSelect,
  onSave,
  onSaveAs,
  onDelete,
}: {
  profiles: SavedProfile[];
  selectedId: string | null;
  dirty: boolean;
  disabled?: boolean;
  onSelect: (id: string | null) => void;
  onSave: () => Promise<void>;
  onSaveAs: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState("");
  const selected = profiles.find((profile) => profile.id === selectedId) ?? null;

  const submitNew = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await onSaveAs(trimmed);
      setName("");
      setSaveAsOpen(false);
    } catch {
      toast.error("บันทึก Profile ไม่สำเร็จ", { description: "พื้นที่จัดเก็บของ Browser อาจไม่พร้อมหรือเต็ม" });
    }
  };

  return (
    <>
      <section className="profile-manager" aria-label="Profile ที่บันทึกในเครื่อง">
        <div className="profile-copy">
          <span className="profile-icon"><Database size={17} /></span>
          <div>
            <strong>Local Profile</strong>
            <span>{dirty ? "มีการแก้ไขที่ยังไม่ได้บันทึก" : "เก็บเฉพาะใน Browser เครื่องนี้"}</span>
          </div>
        </div>

        <div className="profile-controls">
          <Select value={selectedId ?? NONE} onValueChange={(value) => onSelect(value === NONE ? null : value)} disabled={disabled}>
            <SelectTrigger aria-label="เลือก Local Profile"><SelectValue placeholder="ยังไม่ได้เลือก Profile" /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={NONE}>— Blank / ไม่โหลด Profile —</SelectItem>
              {profiles.map((profile) => <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="profile-actions">
            <Button type="button" variant="outline" size="sm" disabled={disabled || selected === null || !dirty} onClick={() => {
              void onSave().catch(() => toast.error("บันทึก Profile ไม่สำเร็จ", { description: "พื้นที่จัดเก็บของ Browser อาจไม่พร้อมหรือเต็ม" }));
            }}>
              <Save size={14} /> Save
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setSaveAsOpen(true)}>
              <UserRoundPlus size={14} /> Save as new
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={disabled || selected === null} onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>บันทึกเป็น Profile ใหม่</DialogTitle>
            <DialogDescription>ข้อมูลบัตร รูป และตำแหน่งรูปจะถูกเก็บใน IndexedDB ของ Browser เครื่องนี้เท่านั้น</DialogDescription>
          </DialogHeader>
          <div className="field profile-name-field">
            <label htmlFor="profile-name">ชื่อ Profile</label>
            <Input id="profile-name" value={name} autoFocus maxLength={80} placeholder="เช่น ETB Test 01" onChange={(event) => setName(event.target.value)} onKeyDown={(event) => {
              if (event.key === "Enter" && name.trim()) void submitNew();
            }} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveAsOpen(false)}>ยกเลิก</Button>
            <Button type="button" disabled={!name.trim()} onClick={() => void submitNew()}>บันทึก Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ {selected?.name ?? "Profile"}?</AlertDialogTitle>
            <AlertDialogDescription>ลบเฉพาะข้อมูลที่บันทึกไว้ใน Browser ข้อมูลที่กำลังแสดงบนหน้าจอจะยังอยู่จนกว่าจะเริ่มใหม่หรือโหลด Profile อื่น</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              void onDelete()
                .then(() => setDeleteOpen(false))
                .catch(() => toast.error("ลบ Profile ไม่สำเร็จ", { description: "กรุณาลองใหม่อีกครั้ง" }));
            }}>ลบ Profile</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
