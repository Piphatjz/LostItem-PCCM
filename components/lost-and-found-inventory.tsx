"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { CalendarIcon, Plus, AlertCircle, Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { supabase, type LostItem } from "@/lib/supabase"

export function LostAndFoundInventory() {
  const [items, setItems] = useState<LostItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [newItemDescription, setNewItemDescription] = useState("")
  const [newItemLocation, setNewItemLocation] = useState("")
  const [newItemDate, setNewItemDate] = useState<Date | undefined>(undefined)
  const [newItemStudentId, setNewItemStudentId] = useState("")
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const isSupabaseConfigured = supabase !== null

  const fetchItems = async () => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("lost_items").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching items:", error)
        return
      }

      setItems(data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIsProcessing(true)

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreviewUrl(event.target.result as string)
        }
        setIsProcessing(false)
      }
      reader.onerror = () => {
        setIsProcessing(false)
        alert("เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ")
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabase) {
      alert("กรุณาตั้งค่า Supabase environment variables ก่อน")
      return
    }

    if (newItemName && newItemDescription && newItemLocation && newItemDate && newItemStudentId) {
      try {
        setIsProcessing(true)

        const { error } = await supabase.from("lost_items").select("count", { count: "exact", head: true })
        if (error) {
          throw new Error(`การเชื่อมต่อฐานข้อมูลล้มเหลว: ${error.message}`)
        }
      } catch {
        alert("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า Supabase")
        return
      }

      const newItem = {
        name: newItemName,
        description: newItemDescription,
        location: newItemLocation,
        date_found: format(newItemDate, "yyyy-MM-dd"),
        image_data: imagePreviewUrl || null,
        student_id: newItemStudentId, // เก็บรหัสนักเรียนไว้ใน Supabase
      }

      const { error } = await supabase.from("lost_items").insert([newItem]).select()

      if (error) {
        if (error.message.includes("student_id")) {
          const itemWithoutStudentId = { ...newItem }
          delete itemWithoutStudentId.student_id

          const { error: fallbackError } = await supabase.from("lost_items").insert([itemWithoutStudentId]).select()

          if (fallbackError) {
            throw new Error(`เกิดข้อผิดพลาดในการเพิ่มรายการ: ${fallbackError.message}`)
          }

          alert("เพิ่มรายการสำเร็จ! (หมายเหตุ: กรุณารัน SQL script เพื่อเพิ่มฟิลด์รหัสนักเรียน)")
        } else {
          throw new Error(`เกิดข้อผิดพลาดในการเพิ่มรายการ: ${error.message}`)
        }
      }

      setNewItemName("")
      setNewItemDescription("")
      setNewItemLocation("")
      setNewItemDate(undefined)
      setNewItemStudentId("")
      setImagePreviewUrl(null)
      setIsDialogOpen(false)

      await fetchItems()
    } else {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน")
    }
    setIsProcessing(false)
  }

  if (!isSupabaseConfigured) {
    return (
      <Card className="w-full max-w-4xl bg-card border-border shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center gap-3 text-primary">
            <Heart className="h-7 w-7 text-accent" />🏫 ระบบของหายโรงเรียน
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">ช่วยกันหาเจ้าของของที่หายไป</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 space-y-6">
            <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-accent" />
              </div>
              <h3 className="font-bold text-xl text-primary mb-3">เตรียมพร้อมใช้งาน</h3>
              <p className="text-foreground mb-4 leading-relaxed">
                กรุณาตั้งค่า Environment Variables ใน Project Settings เพื่อเชื่อมต่อฐานข้อมูล:
              </p>
              <div className="bg-muted rounded-lg p-4 space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <code className="bg-background px-3 py-1 rounded-md text-sm font-mono border">
                    NEXT_PUBLIC_SUPABASE_URL
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <code className="bg-background px-3 py-1 rounded-md text-sm font-mono border">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </code>
                </div>
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                หลังจากตั้งค่าแล้ว อย่าลืมรัน SQL script เพื่อสร้างตารางในฐานข้อมูลนะ! 🚀
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-6xl bg-card border-border shadow-xl">
      <CardHeader className="rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">🏫 ของหายจภม.</CardTitle>
          <CardDescription className="text-muted-foreground text-lg">ช่วยกันหาเจ้าของของที่หายไป ✨</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
            >
              <Plus className="mr-2 h-5 w-5" />
              เพิ่มของที่พบ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl">
            <DialogHeader className="text-center pb-2">
              <DialogTitle className="text-xl font-bold text-primary">เพิ่มของที่พบ</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                กรอกรายละเอียดของสิ่งของที่คุณพบเจอ 💝
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="studentId" className="text-sm font-semibold text-foreground">
                  รหัสนักเรียน
                </Label>
                <Input
                  id="studentId"
                  value={newItemStudentId}
                  onChange={(e) => setNewItemStudentId(e.target.value)}
                  className="rounded-lg border-2 focus:border-accent h-9"
                  placeholder="เช่น 06211"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                  ชื่อสิ่งของ
                </Label>
                <Input
                  id="name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="rounded-lg border-2 focus:border-accent h-9"
                  placeholder="เช่น กระเป๋าสีแดง, โทรศัพท์มือถือ"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description" className="text-sm font-semibold text-foreground">
                  รายละเอียด
                </Label>
                <Textarea
                  id="description"
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  className="rounded-lg border-2 focus:border-accent min-h-[60px] resize-none"
                  placeholder="อธิบายลักษณะของสิ่งของให้ละเอียด"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="location" className="text-sm font-semibold text-foreground">
                  สถานที่ที่พบ
                </Label>
                <Input
                  id="location"
                  value={newItemLocation}
                  onChange={(e) => setNewItemLocation(e.target.value)}
                  className="rounded-lg border-2 focus:border-accent h-9"
                  placeholder="เช่น ห้องสมุด, สนามกีฬา, โรงอาหาร"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="date" className="text-sm font-semibold text-foreground">
                  วันที่พบ
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-lg border-2 hover:border-accent h-9",
                        !newItemDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newItemDate ? format(newItemDate, "PPP") : <span>เลือกวันที่</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl">
                    <Calendar mode="single" selected={newItemDate} onSelect={setNewItemDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label htmlFor="imageUpload" className="text-sm font-semibold text-foreground">
                  อัปโหลดรูปภาพ
                </Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="rounded-lg border-2 focus:border-accent file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-accent file:text-accent-foreground file:text-sm h-9"
                  disabled={isProcessing}
                />
              </div>
              {isProcessing && (
                <div className="bg-accent/10 rounded-lg p-2 text-center">
                  <p className="text-xs text-accent font-medium">🔄 กำลังประมวลผลรูปภาพ...</p>
                </div>
              )}
              {imagePreviewUrl && !isProcessing && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">ตัวอย่างรูปภาพ</Label>
                  <div className="flex justify-center">
                    <div className="relative w-24 h-24 border-2 border-accent/30 rounded-lg overflow-hidden shadow-md">
                      <Image
                        src={imagePreviewUrl || "/placeholder.svg"}
                        alt="ตัวอย่างรูปภาพ"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isProcessing ? "🔄 กำลังเพิ่ม..." : "✅ เพิ่มรายการ"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-lg">กำลังโหลดข้อมูล...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 space-y-4">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-foreground">ยังไม่มีรายการของหาย</h3>
            <p className="text-base">เพิ่มรายการแรกของคุณเพื่อช่วยเหลือเพื่อนๆ ในโรงเรียน! 🤝</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-xl font-bold text-primary">รายการของที่พบ ({items.length} รายการ)</h3>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px] font-semibold text-foreground">รูปภาพ</TableHead>
                    <TableHead className="font-semibold text-foreground">ชื่อสิ่งของ</TableHead>
                    <TableHead className="font-semibold text-foreground">รายละเอียด</TableHead>
                    <TableHead className="font-semibold text-foreground">สถานที่พบ</TableHead>
                    <TableHead className="font-semibold text-foreground">วันที่พบ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <TableCell>
                        <div className="relative w-24 h-24 border-2 border-accent/20 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-105">
                          <Image
                            src={
                              item.image_data ||
                              `/placeholder.svg?height=96&width=96&query=${encodeURIComponent(item.name) || "/placeholder.svg"}`
                            }
                            fill
                            alt={`รูปภาพของ ${item.name}`}
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground text-base">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground leading-relaxed">{item.description}</TableCell>
                      <TableCell className="text-foreground">📍 {item.location}</TableCell>
                      <TableCell className="text-foreground">📅 {format(new Date(item.date_found), "PPP")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
