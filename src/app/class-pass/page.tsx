"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User2,
  Award,
  Users,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { format, parse, isAfter, startOfDay, addDays } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useQuery } from "@apollo/client";
import {
  GET_BUNDLE_TYPES,
  GET_POSSIBLE_ALLOCATIONS,
} from "@/lib/graphql/queries";
import type {
  Allocation,
  GetBundleQuery,
  GetPossibleAllocationsQuery,
} from "@/types/graphql";
import { Header } from "@/components/header";
import { Spinner } from "@/components/spinner";
import { motion } from "framer-motion";

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

  const startDate = startOfDay(new Date());
  const endDate = addDays(startDate, 7);

  const {
    data: scheduleData,
    loading: scheduleLoading,
    error: scheduleError,
  } = useQuery<GetPossibleAllocationsQuery>(GET_POSSIBLE_ALLOCATIONS, {
    variables: {
      contextId: "ec966559-0580-4adb-bc6b-b150c56f935c",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
  });

  useEffect(() => {
    if (scheduleData && scheduleData.possibleAllocations) {
      const allocations: Allocation[] = scheduleData.possibleAllocations;
      const groups: { [day: string]: ScheduleItem[] } = {};

      allocations.forEach((alloc: Allocation) => {
        const start = new Date(alloc.startTime);
        const dayEn = format(start, "EEEE", { locale: enUS });
        if (!groups[dayEn]) groups[dayEn] = [];
        const time = format(start, "h:mm a");
        groups[dayEn].push({
          time,
          duration: alloc.duration.toString(),
          activity: alloc.sessionType?.name || "Unknown",
          instructor: alloc.timeSlot.agent?.name || "Unknown",
          status: alloc.status || "Unknown",
          currentReservations: alloc.currentReservations,
          cron: alloc.timeSlot.cron || "Unknown",
          maxConsumers:
            (alloc.sessionType as { maxConsumers?: number })?.maxConsumers || 0,
        });
      });

      const weekDaysOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const dayMapping: { [key: string]: string } = {
        Monday: "Lunes",
        Tuesday: "Martes",
        Wednesday: "Miércoles",
        Thursday: "Jueves",
        Friday: "Viernes",
        Saturday: "Sábado",
        Sunday: "Domingo",
      };
      const scheduleArray: DaySchedule[] = [];
      weekDaysOrder.forEach((day) => {
        if (groups[day]) {
          scheduleArray.push({
            day: { en: day, es: dayMapping[day] },
            items: groups[day],
          });
        }
      });

      setFetchedSchedule(scheduleArray);
    }
  }, [scheduleData]);

  const getNextAvailableClass = () => {
    const today = new Date();
    const currentDay = format(today, "EEEE", {
      locale: language === "es" ? es : enUS,
    });
    const currentTime = format(today, "h:mm a");

    const todaySchedule = fetchedSchedule.find(
      (daySchedule) =>
        daySchedule.day[language].toLowerCase() === currentDay.toLowerCase()
    );

    if (todaySchedule) {
      const nextClass = todaySchedule.items.find((item) => {
        const classTime = parse(item.time, "h:mm a", new Date());
        const currentTimeDate = parse(currentTime, "h:mm a", new Date());
        return isAfter(classTime, currentTimeDate);
      });

      if (nextClass) {
        return {
          ...nextClass,
          day: todaySchedule.day[language],
        };
      }
    }

    if (fetchedSchedule.length > 0) {
      const weekDaysOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const currentIndex = weekDaysOrder.findIndex(
        (day) => day.toLowerCase() === currentDay.toLowerCase()
      );
      for (let i = 1; i < weekDaysOrder.length; i++) {
        const nextDay =
          weekDaysOrder[(currentIndex + i) % weekDaysOrder.length];
        const nextDaySchedule = fetchedSchedule.find(
          (daySchedule) =>
            daySchedule.day.en.toLowerCase() === nextDay.toLowerCase()
        );
        if (nextDaySchedule && nextDaySchedule.items.length > 0) {
          return {
            ...nextDaySchedule.items[0],
            day: nextDaySchedule.day[language],
          };
        }
      }
    }
    return null;
  };

  const { data: bundleData } = useQuery<GetBundleQuery>(GET_BUNDLE_TYPES, {
    variables: { contextId: "ec966559-0580-4adb-bc6b-b150c56f935c" },
  });
  const bundleTypes = bundleData?.bundleTypes;
  console.log(bundleTypes);

  const nextClass = getNextAvailableClass();
  const singleClassPass = bundleTypes?.find((bundle) => {
    if (nextClass && nextClass.activity.toLowerCase().includes("acro")) {
      return bundle.name.toLowerCase().includes("acro");
    } else {
      return bundle.name.toLowerCase().startsWith("1 ");
    }
  });

  console.log(singleClassPass);
  const handleClassSelection = () => {
    if (nextClass) {
      router.push(
        `/class-pass/user-selection?classId=next&activity=${nextClass.activity}&instructor=${nextClass.instructor}&time=${nextClass.time}&day=${nextClass.day}`
      );
    }
  };

  if (scheduleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
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
    <>
      <Header title={{ en: "Reserve Now", es: "Reserva Ahora" }} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {nextClass && singleClassPass && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-8">
              <div className="p-6 sm:p-8">
                {/* Header Section with Price */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {nextClass.activity}
                    </h2>
                    <p className="text-gray-600 mt-1">{singleClassPass.name}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-bold text-blue-600">
                      S/. {Number(singleClassPass.price).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">per class</div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                  {/* Class Details */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900">
                      Class Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-600">
                          {nextClass.instructor}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-600">{nextClass.day}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-600">
                          {nextClass.time} ({nextClass.duration} min)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Details */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900">
                      Class Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-600">
                          {nextClass.currentReservations}/
                          {nextClass.maxConsumers} attendees
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-600">
                          Status: {nextClass.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      onClick={handleClassSelection}
                      className="bg-gradient-to-r from-green-600 to-teal-600 text-white
    p-6 rounded-2xl
    shadow-lg hover:shadow-xl transition-all duration-300 flex items-center
    justify-center gap-3 group"
                    >
                      <CreditCard className="w-8 h-8 transition-transform group-hover:scale-110" />
                      <span className="text-xl font-semibold">
                        {language === "en"
                          ? "Book This Class"
                          : "Reservar Esta Clase"}
                      </span>
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => router.push("/class-pass/schedule")}
                      className="w-full bg-white text-blue-600 py-3 px-6 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 border-2 border-blue-600"
                    >
                      {language === "en"
                        ? "View Other Classes"
                        : "Ver Otras Clases"}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
          )}

          {!nextClass && (
            <div className="text-center text-gray-500 py-8">
              {language === "en"
                ? "No classes available at the moment."
                : "No hay clases disponibles en este momento."}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
