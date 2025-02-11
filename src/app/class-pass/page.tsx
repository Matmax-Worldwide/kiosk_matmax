"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, User2, Ticket, Info } from 'lucide-react';
import { format, parse, isAfter } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { useQuery } from "@apollo/client";
import { GET_BUNDLE, GET_HORARIOS } from "@/lib/graphql/queries";
import type { Allocation, GetBundleQuery, GetHorariosQuery } from "@/types/graphql";

interface ScheduleItem {
  time: string;
  duration: string;
  activity: string;
  instructor: string;
  status: string;
  currentReservations: number;
  cron: string;
  maxConsumers: number;
}

interface DaySchedule {
  day: { en: string; es: string };
  items: ScheduleItem[];
}

export default function ClassPassPage() {
  const router = useRouter();
  const { language } = useLanguageContext();
  const [fetchedSchedule, setFetchedSchedule] = useState<DaySchedule[]>([]);

  const { data: scheduleData, loading: scheduleLoading, error: scheduleError } = useQuery<GetHorariosQuery>(GET_HORARIOS, { variables: { contextId: "ec966559-0580-4adb-bc6b-b150c56f935c"} });

  useEffect(() => {
    if (scheduleData && scheduleData.allocations) {
      const allocations: Allocation[] = scheduleData.allocations;
      const groups: { [day: string]: ScheduleItem[] } = {};

      allocations.forEach((alloc: Allocation) => {
        const start = new Date(alloc.startTime);
        const dayEn = format(start, 'EEEE', { locale: enUS });
        if (!groups[dayEn]) groups[dayEn] = [];
        const time = format(start, 'h:mm a');
        groups[dayEn].push({
          time,
          duration: alloc.timeSlot.duration.toString(),
          activity: alloc.timeSlot.sessionType?.name || 'Unknown',
          instructor: alloc.timeSlot.agent?.name || 'Unknown',
          status: alloc.status || 'Unknown',
          currentReservations: alloc.currentReservations,
          cron: alloc.timeSlot.cron || 'Unknown',
          maxConsumers: (alloc.timeSlot.sessionType as { maxConsumers?: number })?.maxConsumers || 0
        });
      });

      const weekDaysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const dayMapping: { [key: string]: string } = {
        Monday: "Lunes",
        Tuesday: "Martes",
        Wednesday: "Miércoles",
        Thursday: "Jueves",
        Friday: "Viernes",
        Saturday: "Sábado",
        Sunday: "Domingo"
      };
      const scheduleArray: DaySchedule[] = [];
      weekDaysOrder.forEach(day => {
        if (groups[day]) {
          scheduleArray.push({
            day: { en: day, es: dayMapping[day] },
            items: groups[day]
          });
        }
      });

      setFetchedSchedule(scheduleArray);
    }
  }, [scheduleData]);

  const getNextAvailableClass = () => {
    const today = new Date();
    const currentDay = format(today, 'EEEE', { locale: language === 'es' ? es : enUS });
    const currentTime = format(today, 'h:mm a');

    const todaySchedule = fetchedSchedule.find(daySchedule =>
      daySchedule.day[language].toLowerCase() === currentDay.toLowerCase()
    );

    if (todaySchedule) {
      const nextClass = todaySchedule.items.find(item => {
        const classTime = parse(item.time, 'h:mm a', new Date());
        const currentTimeDate = parse(currentTime, 'h:mm a', new Date());
        return isAfter(classTime, currentTimeDate);
      });

      if (nextClass) {
        return {
          ...nextClass,
          day: todaySchedule.day[language]
        };
      }
    }

    if (fetchedSchedule.length > 0) {
      const weekDaysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const currentIndex = weekDaysOrder.findIndex(
        (day) => day.toLowerCase() === currentDay.toLowerCase()
      );
      for (let i = 1; i < weekDaysOrder.length; i++) {
        const nextDay = weekDaysOrder[(currentIndex + i) % weekDaysOrder.length];
        const nextDaySchedule = fetchedSchedule.find(
          (daySchedule) => daySchedule.day.en.toLowerCase() === nextDay.toLowerCase()
        );
        if (nextDaySchedule && nextDaySchedule.items.length > 0) {
          return {
            ...nextDaySchedule.items[0],
            day: nextDaySchedule.day[language]
          };
        }
      }
    }
    return null;
  };

  const { data: bundleData } = useQuery<GetBundleQuery>(GET_BUNDLE, { variables: { contextId: "ec966559-0580-4adb-bc6b-b150c56f935c"} });
  const bundleTypes = bundleData?.bundleTypes;
  console.log(bundleTypes);


  const nextClass = getNextAvailableClass();
  const singleClassPass = bundleTypes?.find(bundle => {
    if (nextClass && nextClass.activity.toLowerCase().includes("acro")) {
      return bundle.name.toLowerCase().includes("acro");
    } else {
      return bundle.name.toLowerCase().startsWith("1 ");
    }
  });

  console.log(singleClassPass);
  const handleClassSelection = () => {
    if (nextClass) {
      router.push(`/class-pass/user-selection?classId=next&activity=${nextClass.activity}&instructor=${nextClass.instructor}&time=${nextClass.time}&day=${nextClass.day}`);
    }
  };

  if (scheduleLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (scheduleError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Error fetching schedule: {scheduleError.message}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 max-w-3xl"
    >
      <h1 className="text-3xl font-bold mb-2 text-center">
        {language === 'en' ? 'Next Available Class' : 'Próxima Clase Disponible'}
      </h1>

      {nextClass && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden mb-8"
        >
          <div className="relative">
            <div className="absolute top-4 right-4 flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium flex items-center">
                <Ticket className="w-4 h-4 mr-2" />
                <span>{singleClassPass ? singleClassPass.name : "No hay clases disponibles"}</span>
              </div>
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">{nextClass.activity}</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <User2 className="w-5 h-5 mr-3" />
                  <span className="font-medium">{nextClass.instructor}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3" />
                  <span className="font-medium">{nextClass.day}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3" />
                  <span className="font-medium">
                    {nextClass.time} ({nextClass.duration === '60' ? '1 hr' : nextClass.duration === '120' ? '2 hrs' : `${nextClass.duration} min`})
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Info className="w-5 h-5 mr-3" />
                  <span className="font-medium">
                    Estado: {nextClass.status} | Reservas actuales: {nextClass.currentReservations} | Cron: {nextClass.cron} | Máx. Consumidores: {nextClass.maxConsumers}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-center mb-8 text-gray-600">
                
              { singleClassPass && (
                <div className="text-5xl font-bold text-gray-800">
                  PEN {Number(singleClassPass.price).toFixed(2)}
                </div>
              )}
              </div>
              <button
                onClick={handleClassSelection}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 mb-4"
              >
                {language === 'en' ? 'Book This Class' : 'Reservar Esta Clase'}
              </button>
            </div>
            
          </div>
        </motion.div>
      )}

      <button
        onClick={() => router.push('/class-pass/schedule')}
        className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
      >
        {language === 'en' ? 'View Other Classes' : 'Ver Otras Clases'}
      </button>
    </motion.div>
  );
} 