"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Users,
  ChevronRight,
  CreditCard,
  ArrowRight,
  Tag,
  Globe2,
  Loader2,
} from "lucide-react";
import { format, isAfter, startOfDay, addDays } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useQuery, useApolloClient } from "@apollo/client";
import {
  GET_BUNDLE_TYPES,
  GET_POSSIBLE_ALLOCATIONS,
  CHECK_EXISTING_ALLOCATION,
  CREATE_ALLOCATION_FROM_TIMESLOT,
} from "@/lib/graphql/queries";
import type {
  Allocation,
  GetBundleQuery,
  GetPossibleAllocationsQuery,
} from "@/types/graphql";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleItem {
  id: string;
  time: string;
  duration: string;
  activity: string;
  instructor: string;
  status: string;
  currentReservations: number;
  cron: string;
  startDateTime: string;
  timeSlot: {
    id: string;
    sessionType: {
      maxConsumers: number;
    };
  };
}

interface DaySchedule {
  day: { en: string; es: string };
  items: ScheduleItem[];
}

function CountdownTimer({
  classTime,
  language,
}: {
  classTime: string;
  language: string;
}) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
  } | null>(null);
  const [isInProgress, setIsInProgress] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const [hours, minutes, period] = classTime.split(/:|\s/);
      const today = new Date();
      const classDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      if (!hours || !minutes || !period) return;

      // Convert to 24-hour format
      let hour = parseInt(hours);
      if (period.toLowerCase() === "pm" && hour !== 12) hour += 12;
      if (period.toLowerCase() === "am" && hour === 12) hour = 0;

      classDate.setHours(hour, parseInt(minutes), 0);

      // If the class time has passed for today, set it to tomorrow
      if (classDate.getTime() + 10 * 60 * 1000 < now.getTime()) {
        classDate.setDate(classDate.getDate() + 1);
      }

      const difference = classDate.getTime() - now.getTime();

      // Check if class is in progress (within 10 minutes after start)
      if (difference <= 0 && difference > -10 * 60 * 1000) {
        setIsInProgress(true);
        setTimeLeft(null);
        return;
      }

      setIsInProgress(false);

      if (difference <= -10 * 60 * 1000) {
        setTimeLeft(null);
        return;
      }

      const hoursLeft = Math.floor(difference / (1000 * 60 * 60));
      const minutesLeft = Math.floor(
        (difference % (1000 * 60 * 60)) / (1000 * 60)
      );

      setTimeLeft({ hours: hoursLeft, minutes: minutesLeft });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [classTime]);

  if (isInProgress) {
    return (
      <span className="text-green-600 font-semibold text-lg">
        {language === "en" ? "In progress" : "En progreso"}
      </span>
    );
  }

  if (!timeLeft) return null;

  return (
    <span className="text-gray-700 text-lg">
      {language === "en" ? (
        <>
          Starts in {timeLeft.hours > 0 ? `${timeLeft.hours}h ` : ""}
          {timeLeft.minutes}m
        </>
      ) : (
        <>
          Comienza en {timeLeft.hours > 0 ? `${timeLeft.hours}h ` : ""}
          {timeLeft.minutes}m
        </>
      )}
    </span>
  );
}

function ClassPassSkeletonLoader() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-4"
            >
              <div className="p-6 sm:p-8">
                {/* Header Section Skeleton */}
                <div className="flex flex-col gap-4 pb-6 border-b border-gray-100">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-col gap-4">
                        <Skeleton className="h-12 w-64" />
                        <Skeleton className="h-8 w-48" />
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-6 w-32" />
                          <div className="text-gray-400">•</div>
                          <Skeleton className="h-6 w-24" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Skeleton className="h-12 w-32 mb-2" />
                        <Skeleton className="h-10 w-40 rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button Skeleton */}
                <div className="mt-6">
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>

                {/* Additional Info Skeleton */}
                <div className="mt-4 pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-3 items-center">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-28" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Ver Horarios button skeleton */}
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClassPassContent() {
  const router = useRouter();
  const { language } = useLanguageContext();
  const client = useApolloClient();
  const [fetchedSchedule, setFetchedSchedule] = useState<DaySchedule[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [isViewingSchedule, setIsViewingSchedule] = useState(false);

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

        // Construir el ID compuesto si no hay un ID de allocation
        const compositeId = alloc.id || `${alloc.timeSlot.id}_${format(start, "yyyy-MM-dd_HH:mm")}`;

        groups[dayEn].push({
          id: compositeId,
          time,
          duration: alloc.duration.toString(),
          activity: alloc.timeSlot.sessionType?.name || "Unknown",
          instructor: alloc.timeSlot.agent?.name || "Unknown",
          status: alloc.status || "Unknown",
          currentReservations: alloc.currentReservations,
          cron: alloc.timeSlot.cron || "Unknown",
          timeSlot: {
            id: alloc.timeSlot.id,
            sessionType: {
              maxConsumers: alloc.timeSlot.sessionType?.maxConsumers || 0
            }
          },
          startDateTime: alloc.startTime,
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

    // Buscar primero en el día actual
    const todaySchedule = fetchedSchedule.find(
      (daySchedule) =>
        daySchedule.day[language].toLowerCase() === currentDay.toLowerCase()
    );

    if (todaySchedule) {
      const nextClass = todaySchedule.items.find((item) => {
        if (!item.startDateTime) return false;
        const classTime = new Date(item.startDateTime);
        const tenMinutesAfterStart = new Date(
          classTime.getTime() + 10 * 60 * 1000
        );
        return isAfter(tenMinutesAfterStart, today);
      });

      if (nextClass) {
        return {
          ...nextClass,
          day: todaySchedule.day[language],
        };
      }
    }

    // Si no hay clases disponibles hoy o ya pasaron todas, buscar en los días siguientes
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

    // Buscar en los días siguientes
    for (let i = 1; i < weekDaysOrder.length; i++) {
      const nextDay = weekDaysOrder[(currentIndex + i) % weekDaysOrder.length];
      const nextDaySchedule = fetchedSchedule.find(
        (daySchedule) =>
          daySchedule.day.en.toLowerCase() === nextDay.toLowerCase()
      );

      if (nextDaySchedule && nextDaySchedule.items.length > 0) {
        // Ordenar las clases por hora de inicio
        const sortedClasses = [...nextDaySchedule.items]
          .filter((item) => item.startDateTime) // Filter out items without startDateTime
          .sort((a, b) => {
            const timeA = new Date(a.startDateTime!);
            const timeB = new Date(b.startDateTime!);
            return timeA.getTime() - timeB.getTime();
          });

        if (sortedClasses.length > 0) {
          // Retornar la primera clase del día siguiente
          return {
            ...sortedClasses[0],
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

  const nextClass = getNextAvailableClass();
  const singleClassPass = bundleTypes?.find((bundle) => {
    if (nextClass && nextClass.activity.toLowerCase().includes("acro")) {
      return bundle.name.toLowerCase().includes("acro");
    } else {
      return bundle.name.toLowerCase().startsWith("1 ");
    }
  });

  const handleClassSelection = async () => {
    if (nextClass && singleClassPass && nextClass.startDateTime && nextClass.timeSlot?.id) {
      setIsBooking(true);
      try {
        console.log('🚀 [ClassPass] Starting class selection process...', {
          startDateTime: nextClass.startDateTime,
          timeSlotId: nextClass.timeSlot.id,
          activity: nextClass.activity,
        });

        const startDateTime = new Date(nextClass.startDateTime);
        const timeSlotId = nextClass.timeSlot.id;

        // First, check if allocation already exists
        console.log('🔍 [ClassPass] Checking for existing allocation...', {
          timeSlotId,
          startTime: startDateTime.toISOString(),
        });

        const { data: existingAllocation } = await client.query({
          query: CHECK_EXISTING_ALLOCATION,
          variables: {
            timeSlotId,
            startTime: startDateTime.toISOString(),
          },
        });

        console.log('📝 [ClassPass] Existing allocation check result:', existingAllocation);

        let allocationId;

        if (existingAllocation?.allocation?.id) {
          // Use existing allocation
          allocationId = existingAllocation.allocation.id;
          console.log('✅ [ClassPass] Using existing allocation:', allocationId);
        } else {
          // Create new allocation with the exact startDateTime
          console.log('🔨 [ClassPass] Creating new allocation...', {
            timeSlotId,
            startTime: startDateTime.toISOString(),
          });

          const { data: newAllocation } = await client.mutate({
            mutation: CREATE_ALLOCATION_FROM_TIMESLOT,
            variables: {
              input: {
                timeSlotId: timeSlotId,
                startTime: startDateTime.toISOString(),
                status: "AVAILABLE",
              },
            },
          });

          console.log('📝 [ClassPass] New allocation creation result:', newAllocation);

          if (newAllocation?.createAllocation?.id) {
            allocationId = newAllocation.createAllocation.id;
            console.log('✅ [ClassPass] Created new allocation:', allocationId);
          }
        }

        if (!allocationId) {
          console.error('❌ [ClassPass] Failed to find or create allocation');
          throw new Error("Could not find or create allocation");
        }

        console.log('🎯 [ClassPass] Navigating to user selection...', {
          allocationId,
          activity: nextClass.activity,
          instructor: nextClass.instructor,
          time: nextClass.time,
          day: nextClass.day,
          packageId: singleClassPass.id,
        });

        router.push(
          `/user-selection?classId=${allocationId}&activity=${nextClass.activity}&instructor=${nextClass.instructor}&time=${nextClass.time}&day=${nextClass.day}&packageId=${singleClassPass.id}&now=true`
        );
      } catch (error) {
        console.error('❌ [ClassPass] Error handling allocation:', error);
        setIsBooking(false);
      }
    }
  };

  const handleViewSchedule = () => {
    setIsViewingSchedule(true);
    console.log('🚀 [ClassPass] Navigating to schedule...');
    router.push("/schedule");
  };

  if (scheduleLoading) {
    return <ClassPassSkeletonLoader />;
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
      {/* Schedule Navigation Overlay */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-b from-blue-50 to-white"
      >
        <div className="container mx-auto px-4 py-16 md:py-24">
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
                          <div className="flex items-start justify-between mb-2">
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
                                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent tracking-tight mb-2">
                                  S/. {Number(singleClassPass.price).toFixed(2)}
                                </div>
                                <div className="bg-gradient-to-r from-green-600/10 to-teal-600/10 px-4 py-2 rounded-lg flex items-center gap-2">
                                  <Tag className="w-4 h-4 text-green-600" />
                                  <span className="text-green-700 font-medium">
                                    {nextClass?.activity
                                      .toLowerCase()
                                      .includes("acro")
                                      ? language === "en"
                                        ? "1 Acro MatPass"
                                        : "1 Acro MatPass"
                                      : "1 MatPass"}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button con Loader */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        whileHover={{ scale: isBooking ? 1 : 1.02 }}
                        whileTap={{ scale: isBooking ? 1 : 0.98 }}
                      >
                        <button
                          onClick={handleClassSelection}
                          disabled={isBooking}
                          className="relative w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-6 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-2xl font-semibold shadow-lg hover:shadow-xl group overflow-hidden"
                        >
                          {/* Darkening overlay */}
                          <motion.div
                            className="absolute inset-0 bg-black/0"
                            initial={{ x: "-100%" }}
                            whileHover={{
                              x: "0%",
                              backgroundColor: "rgba(0, 0, 0, 0.2)",
                              transition: { duration: 0.3, ease: "easeOut" },
                            }}
                          />

                          <CreditCard className="w-7 h-7 relative transition-transform group-hover:scale-110" />

                          {isBooking ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : (
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={language}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="relative"
                              >
                                {language === "en"
                                  ? "Book Now"
                                  : "Reservar Ahora"}
                              </motion.span>
                            </AnimatePresence>
                          )}

                          {/* Solo mostramos la flecha si no está en estado loader */}
                          {!isBooking && (
                            <motion.div
                              className="relative"
                              initial={{ x: 0, y: 0 }}
                              whileHover={{
                                x: [0, 10, 10],
                                y: [0, -5, 5],
                                transition: {
                                  duration: 1.5,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                  ease: "easeInOut",
                                },
                              }}
                            >
                              <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </motion.div>
                          )}
                        </button>
                      </motion.div>

                      {/* Additional Info */}
                      <div className="mt-4 pt-6 border-t border-gray-100">
                        <div className="grid grid-cols-3 items-center">
                          <div className="flex items-center gap-3 justify-start">
                            <Users className="w-6 h-6 text-green-500" />
                            <span className="text-gray-700 text-lg">
                              {(nextClass.timeSlot?.sessionType?.maxConsumers || 12) - nextClass.currentReservations}/
                              {nextClass.timeSlot?.sessionType?.maxConsumers || 12}{" "}
                              <AnimatePresence mode="wait">
                                <motion.span
                                  key={language}
                                  initial={{ y: 10, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  exit={{ y: -10, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  mats
                                </motion.span>
                              </AnimatePresence>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 justify-center">
                            <Clock className="w-6 h-6 text-green-500" />
                            <CountdownTimer
                              classTime={nextClass.time}
                              language={language}
                            />
                          </div>

                          <div className="flex items-center gap-3 justify-end">
                            <Globe2 className="w-6 h-6 text-green-500" />
                            <span className="text-gray-700 text-lg">
                              {language === "en"
                                ? "Bilingual Class"
                                : "Clase Bilingüe"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Ver Horarios button outside the card */}
                  <motion.button
                    onClick={handleViewSchedule}
                    disabled={isViewingSchedule}
                    className={`w-full bg-white/90 backdrop-blur-sm text-gray-500 py-3 px-6 rounded-xl hover:bg-white/95 transition-all duration-300 flex items-center justify-center gap-2 border border-gray-200 font-semibold text-lg shadow-sm hover:shadow-md group ${isViewingSchedule ? 'cursor-not-allowed opacity-80' : ''}`}
                  >
                    <AnimatePresence mode="wait">
                      {isViewingSchedule ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>
                            {language === "en" ? "Loading..." : "Cargando..."}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.span
                          key={language}
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -10, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {language === "en" ? "View Schedule" : "Ver Horarios"}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!isViewingSchedule && (
                      <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    )}
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
        </div>
      </motion.div>
    </>
  );
}
