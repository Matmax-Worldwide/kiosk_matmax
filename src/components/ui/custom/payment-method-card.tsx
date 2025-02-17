import * as React from "react"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useLanguageContext } from "@/contexts/LanguageContext"

export type PaymentMethod = "CARD" | "CASH" | "QR"

export interface PaymentMethodCardProps {
  method: PaymentMethod
  icon: React.ReactNode
  title: { en: string; es: string }
  subtitle: { en: string; es: string }
  selected: boolean
  onClick: () => void
  className?: string
}

export function PaymentMethodCard({ 
  icon, 
  title, 
  subtitle, 
  selected, 
  onClick,
  className 
}: PaymentMethodCardProps) {
  const { language } = useLanguageContext()

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }} 
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          "p-6 cursor-pointer transition-all duration-300 bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg hover:shadow-xl",
          selected && "border-green-500 bg-green-50/50",
          className
        )}
        onClick={onClick}
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">{title[language]}</h3>
            <p className="text-gray-600">{subtitle[language]}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
} 