"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {nextClass && singleClassPass && (
              <div key={nextClass.activity}>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-4"
                >
                  <div className="p-6 sm:p-8">
                    {/* Header Section with Class Info */}
                    <div className="flex flex-col gap-4 pb-6 border-b border-gray-100">
                      <div>
                        <div className="flex items-start justify-between mb-6">
                          {/* Left side - Class info */}
                          <div className="flex flex-col">
                            <motion.h2
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.5, delay: 0.3 }}
                              className="text-4xl font-bold text-gray-900"
                            >
                              {nextClass.activity}
                            </motion.h2>
                            <motion.span
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.5, delay: 0.4 }}
                              className="text-2xl text-gray-600 font-medium mt-2"
                            >
                              {language === "en" ? "with" : "con"}{" "}
                              <span className="font-semibold">
                                {nextClass.instructor}
                              </span>
                            </motion.span>
                            <motion.div
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.5, delay: 0.5 }}
                              className="flex items-center gap-3 text-xl mt-3"
                            >
                              <p className="font-medium text-gray-800">
                                {`${nextClass.day} ${nextClass.time}`}
                              </p>
                              <span className="text-gray-400">•</span>
                              <p className="font-medium text-gray-800">
                                {nextClass.duration} min
                              </p>
                            </motion.div>
                          </div>

                          {/* Right side - Price */}
                          <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col items-end"
                          >
                            <div className="flex flex-col items-end">
                              <div className="text-6xl font-bold text-green-600 tracking-tight mb-1">
                                S/. {Number(singleClassPass.price).toFixed(2)}
                              </div>
                              <div className="bg-green-100 px-4 py-2 rounded-lg">
                                <span className="text-green-700 font-bold tracking-wider text-xl">
                                  01 MATPASS
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      className="mt-6"
                    >
                      <button
                        onClick={handleClassSelection}
                        className="w-full bg-green-500 text-white py-6 px-6 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-3 text-2xl font-semibold shadow-lg hover:shadow-xl"
                      >
                        <CreditCard className="w-7 h-7" />
                        {language === "en" ? "Book Now" : "Reservar Ahora"}
                      </button>
                    </motion.div>

                    {/* Additional Info */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      className="mt-8 pt-6 border-t border-gray-100"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                          <Users className="w-6 h-6 text-green-500" />
                          <span className="text-gray-700 text-lg">
                            {nextClass.currentReservations}/{nextClass.maxConsumers}{" "}
                            {language === "en" ? "mats" : "mats"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-6 h-6 text-green-500" />
                          <span className="text-gray-700 text-lg">
                            {nextClass.duration} {language === "en" ? "minutes" : "minutos"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Award className="w-6 h-6 text-green-500" />
                          <span className="text-gray-700 text-lg">
                            {nextClass.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Ver Horarios button outside the card */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="w-full bg-white text-gray-500 py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 border-2 border-gray-300 font-semibold text-lg"
                  onClick={() => router.push("/class-pass/schedule")}
                >
                  {language === "en" ? "View Schedule" : "Ver Horarios"}
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
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
      </motion.div>
    </>
  );
}
