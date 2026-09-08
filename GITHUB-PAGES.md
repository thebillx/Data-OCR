# GitHub Pages — Mock Card Studio

เว็บไซต์ใช้ editor และ Canvas renderer ชุดเดียวกับเวอร์ชัน Sites ล่าสุด
เพิ่ม static entry แยกเพื่อไม่ต้องใช้ Worker, API, ฐานข้อมูล หรือ ChatGPT sign-in
รูปและฟอนต์โหลดได้ทั้งโดเมนหลักและ path `/Data-OCR/`

## เปิดเผยแพร่ครั้งแรก

1. เปิด https://github.com/thebillx/Data-OCR/settings/pages
2. ใน Build and deployment ตั้ง Source เป็น **GitHub Actions**
3. เปิด Actions → **Deploy Mock Card Studio** → Run workflow → main
4. รอทั้ง build และ deploy สำเร็จ ใช้ URL จาก deployment ที่สำเร็จจริง

หลังตั้งค่าครั้งแรก workflow จะ build และ deploy เมื่อ push เข้า main
workflow ส่งขึ้นเฉพาะ `dist-pages/` ไม่ส่ง source tree, server หรือไฟล์ตั้งค่าของ Sites

Repo นี้เป็น private ณ วันที่เตรียม migration 2026-09-08
GitHub Pages สำหรับ private repo ต้องมี GitHub Pro, Team หรือ Enterprise ที่รองรับ
หาก Settings แสดงให้ upgrade ต้องตัดสินใจเรื่องแผน GitHub หรือการเปิด source เป็น public ก่อน
การเผยแพร่เว็บไม่ได้เปลี่ยน repository visibility โดยอัตโนมัติ

## โดเมน ocr.rawiza.xyz

1. ใน Settings → Pages ใส่ Custom domain เป็น `ocr.rawiza.xyz` แล้ว Save
2. ที่ผู้ให้บริการ DNS ของ `rawiza.xyz` ตั้งรายการนี้:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | ocr | thebillx.github.io |

3. เมื่อ GitHub ตรวจ DNS และออก certificate แล้ว เปิด Enforce HTTPS

ค่า Target ไม่มีชื่อ repo ต่อท้าย ตั้งโดเมนใน GitHub ก่อนเพิ่ม DNS ตามเอกสาร GitHub
การใช้ GitHub Actions ไม่ต้องมีไฟล์ CNAME ใน artifact; ตั้งโดเมนใน Pages settings
รองรับ URL เริ่มต้นของ Pages ด้วยก่อนผูกโดเมน เพราะ build ใช้ asset path แบบ relative

## ปิด STC โดยเก็บโค้ดไว้

เปิด https://github.com/thebillx/stc-website/settings/pages
สำหรับการปิดถาวร: Build and deployment → Source = **Deploy from a branch**
แล้วตั้ง Branch = **None** และกด Save ขั้นตอนนี้ปิด Pages โดยไม่ลบ repo หรือประวัติ Git
หากต้องการหยุดแค่ deployment ปัจจุบันชั่วคราว ใช้เมนูจุดสามจุดข้าง Your site is live at
แล้วเลือก **Unpublish site** แทน (deploy ครั้งถัดไปอาจเปิดเว็บกลับมาได้)
ลบ DNS record `stc` ที่ใช้กับเว็บนี้เมื่อเลิกใช้โดเมน เพื่อไม่ทิ้งโดเมนชี้ไปยังเว็บไซต์ที่ปิดแล้ว
ไม่ต้องลบ repo `stc-website`

## ตรวจบนเครื่อง

```sh
npm ci
npm run test:pages
```

ตรวจทั้งหมดรวม Sites compatibility:

```sh
npm test
```

## เอกสารอ้างอิง

- [GitHub Pages และแผนที่รองรับ](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [ตั้งค่า custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Unpublish site](https://docs.github.com/en/pages/getting-started-with-github-pages/unpublishing-a-github-pages-site)
- [ปิด Pages ด้วย Branch None](https://docs.github.com/en/pages/getting-started-with-github-pages/deleting-a-github-pages-site)
