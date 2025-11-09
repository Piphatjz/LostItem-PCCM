import { LostAndFoundInventory } from "@/components/lost-and-found-inventory"

export default function HomePage() {
  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-gray-100 p-4 md:p-8">
      <LostAndFoundInventory />
    </div>
  )
}
