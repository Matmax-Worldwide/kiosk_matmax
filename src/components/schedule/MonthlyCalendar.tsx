"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  format, 
  addDays, 
  startOfWeek, 
  startOfMonth, 
  endOfMonth, 
  endOfWeek, 
  isSameMonth, 
  isEqual, 
  isBefore, 
  startOfDay,
  addMonths
} from "date-fns";
import { enUS, es } from "date-fns/locale";

interface MonthlyCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  language: string;
  show: boolean;
}

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ 
  selectedDate, 
  onDateSelect, 
  onClose, 
  language, 
  show 
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate);

  if (!show) return null;

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => 
    language === 'es' ? 
    day.replace('Mon', 'Lun').replace('Tue', 'Mar').replace('Wed', 'Mié').replace('Thu', 'Jue').replace('Fri', 'Vie').replace('Sat', 'Sáb').replace('Sun', 'Dom') : 
    day
  );

  const handleMonthChange = (increment: number) => {
    setCurrentMonth(addMonths(currentMonth, increment));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-3 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <h2 className="text-4xl font-bold text-white text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: language === 'es' ? es : enUS })}
            </h2>
            <button
              onClick={() => handleMonthChange(1)}
              className="p-3 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-7 gap-4 mb-6">
            {weekDays.map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 text-lg">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4">
            {days.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isEqual(day, new Date());
              const isSelected = isEqual(day, selectedDate);
              const isPast = isBefore(day, startOfDay(new Date()));

              return (
                <button
                  key={index}
                  onClick={() => !isPast && onDateSelect(day)}
                  disabled={isPast}
                  className={`
                    aspect-square flex items-center justify-center text-xl font-medium rounded-2xl
                    transition-all duration-200 relative
                    ${isCurrentMonth ? 'hover:bg-green-50 hover:scale-110' : 'text-gray-400'}
                    ${isToday ? 'ring-2 ring-green-500 ring-offset-2 bg-green-50 text-green-600' : ''}
                    ${isSelected ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg scale-110 hover:scale-105' : ''}
                    ${isPast ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
                  `}
                >
                  <span className={`${isSelected ? 'transform scale-110' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {isToday && !isSelected && (
                    <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-8 bg-gray-50 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-lg font-medium hover:bg-gray-100 transition-colors"
          >
            {language === 'en' ? 'Cancel' : 'Cancelar'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-lg font-medium bg-gradient-to-r from-green-600 to-teal-600 text-white hover:shadow-lg transform hover:scale-[1.02] transition-all"
          >
            {language === 'en' ? 'Done' : 'Listo'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}; 