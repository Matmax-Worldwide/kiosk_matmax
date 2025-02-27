"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
      <span className="text-gray-700 text-[10px] sm:text-base md:text-lg">
        {language === "en" ? "In progress" : "En progreso"}
      </span>
    );
  }

  if (!timeLeft) return null;

  return (
    <span className="text-gray-700 text-[10px] sm:text-base md:text-lg">
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
            <Skeleton className="h-14 w-full rounded-xl shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClassPassContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const client = useApolloClient();
  const [fetchedSchedule, setFetchedSchedule] = useState<DaySchedule[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [isViewingSchedule, setIsViewingSchedule] = useState(false);

  const consumerId = searchParams.get("consumerId");

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
        const compositeId =
          alloc.id ||
          `${alloc.timeSlot.id}_${format(start, "yyyy-MM-dd_HH:mm")}`;

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
              maxConsumers: alloc.timeSlot.sessionType?.maxConsumers || 0,
            },
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
    setIsBooking(true);
    if (
      nextClass &&
      singleClassPass &&
      nextClass.startDateTime &&
      nextClass.timeSlot?.id
    ) {
      let retryCount = 0;
      const MAX_RETRIES = 3;

      const attemptAllocationCreation = async (): Promise<string> => {
        try {
          const startDateTime = new Date(nextClass.startDateTime);
          const timeSlotId = nextClass.timeSlot.id;

          // First, check if allocation already exists
          console.log("🔍 [ClassPass] Checking for existing allocation...", {
            timeSlotId,
            startTime: startDateTime.toISOString(),
          });

          const { data: existingAllocation } = await client.query({
            query: CHECK_EXISTING_ALLOCATION,
            variables: {
              timeSlotId,
              startTime: startDateTime.toISOString(),
            },
            fetchPolicy: "network-only", // Ensure we get fresh data
          });

          if (existingAllocation?.allocation?.id) {
            console.log(
              "✅ [ClassPass] Using existing allocation:",
              existingAllocation.allocation.id
            );
            return existingAllocation.allocation.id;
          }

          // Create new allocation
          console.log("🔨 [ClassPass] Creating new allocation...", {
            timeSlotId,
            startTime: startDateTime.toISOString(),
          });

          const { data: newAllocation } = await client.mutate({
            mutation: CREATE_ALLOCATION_FROM_TIMESLOT,
            variables: {
              input: {
                timeSlotId,
                startTime: startDateTime.toISOString(),
                status: "AVAILABLE",
              },
            },
          });

          if (!newAllocation?.createAllocation?.id) {
            throw new Error("Failed to create allocation: No ID returned");
          }

          console.log(
            "✅ [ClassPass] Created new allocation:",
            newAllocation.createAllocation.id
          );
          return newAllocation.createAllocation.id;
        } catch (error) {
          console.error(
            `❌ [ClassPass] Attempt ${retryCount + 1} failed:`,
            error
          );

          if (
            error instanceof Error &&
            error.message.includes("already exists")
          ) {
            // If allocation already exists, try to fetch it again
            const { data: retryExistingAllocation } = await client.query({
              query: CHECK_EXISTING_ALLOCATION,
              variables: {
                timeSlotId: nextClass.timeSlot.id,
                startTime: new Date(nextClass.startDateTime).toISOString(),
              },
              fetchPolicy: "network-only",
            });

            if (retryExistingAllocation?.allocation?.id) {
              return retryExistingAllocation.allocation.id;
            }
          }

          throw error;
        }
      };

      try {
        let allocationId: string | null = null;

        while (retryCount < MAX_RETRIES && !allocationId) {
          try {
            allocationId = await attemptAllocationCreation();
          } catch (error) {
            retryCount++;
            if (retryCount === MAX_RETRIES) {
              throw error;
            }
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );
          }
        }

        if (!allocationId) {
          throw new Error(
            "Could not create or find allocation after multiple attempts"
          );
        }

        console.log("🎯 [ClassPass] Navigating to user selection...", {
          allocationId,
          activity: nextClass.activity,
          instructor: nextClass.instructor,
          time: nextClass.time,
          day: nextClass.day,
          packageId: singleClassPass.id,
        });

        const params = new URLSearchParams();
        params.append("classId", allocationId);
        params.append("activity", nextClass.activity);
        params.append("instructor", nextClass.instructor);
        params.append("time", nextClass.time);
        params.append("day", nextClass.day);
        params.append("packageId", singleClassPass.id);
        params.append("now", "true");
        if (consumerId) {
          params.append("consumerId", consumerId);
          router.push(`/payment?${params.toString()}`);
        } else {
          router.push(`/user-selection?${params.toString()}`);
        }

      } catch (error) {
        console.error("❌ [ClassPass] Error handling allocation:", error);
        setIsBooking(false); // Solo deshabilitamos el botón en caso de error
      }
    }
  };

  const handleViewSchedule = () => {
    setIsViewingSchedule(true);
    console.log("🚀 [ClassPass] Navigating to schedule...");
    const params = new URLSearchParams();
    if (consumerId) {
      params.append("consumerId", consumerId);
      router.push(`/schedule?${params.toString()}`);
    } else {
      router.push("/schedule");
    }
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-14"
    >
      <div className="container mx-auto px-2 sm:px-4 md:px-4 py-2 sm:py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-2 sm:space-y-4">
            {nextClass && singleClassPass && (
              <div key={nextClass.activity}>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white rounded-xl sm:rounded-2xl md:rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-2 sm:mb-4"
                >
                  <div className="p-2 sm:p-6 md:p-8">
                    {/* Header Section with Class Info */}
                    <div className="flex flex-col gap-1.5 sm:gap-4 md:gap-4 pb-2 sm:pb-6 md:pb-6 border-b border-gray-100">
                      <div className="flex flex-row items-start justify-between gap-2 sm:gap-6 md:gap-6">
                        {/* Left side - Class info */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <motion.h2
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="text-base sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight truncate"
                          >
                            {nextClass.activity}
                          </motion.h2>
                          <motion.span
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="text-xs sm:text-xl md:text-2xl text-gray-600 font-medium mt-0.5 sm:mt-2 md:mt-2"
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
                            className="flex flex-wrap items-center gap-1 sm:gap-3 md:gap-3 text-[10px] sm:text-lg md:text-xl mt-1 sm:mt-3 md:mt-3"
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
                          className="flex flex-col items-end justify-start gap-1 sm:gap-2 md:gap-2"
                        >
                          <div className="text-base sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent tracking-tight">
                            S/. {Number(singleClassPass.price).toFixed(2)}
                          </div>
                          <div className="bg-gradient-to-r from-green-600/10 to-teal-600/10 px-1.5 sm:px-4 md:px-4 py-0.5 sm:py-2 md:py-2 rounded-lg flex items-center gap-1 sm:gap-2 md:gap-2">
                            <Tag className="w-3 h-3 sm:w-4 sm:h-4 md:w-4 md:h-4 text-green-600" />
                            <span className="text-green-700 font-medium text-[10px] sm:text-base md:text-base whitespace-nowrap">
                              {nextClass?.activity
                                .toLowerCase()
                                .includes("acro")
                                ? language === "en"
                                  ? "1 Acro MatPass"
                                  : "1 Acro MatPass"
                                : "1 MatPass"}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      className="mt-2 sm:mt-6 md:mt-6"
                    >
                      <button
                        onClick={handleClassSelection}
                        disabled={isBooking}
                        className="relative w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 sm:py-6 md:py-6 px-2 sm:px-6 md:px-6 rounded-lg sm:rounded-xl md:rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-3 md:gap-3 text-sm sm:text-xl md:text-2xl font-semibold shadow-lg hover:shadow-xl group overflow-hidden"
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

                        <CreditCard className="w-3.5 h-3.5 sm:w-6 sm:h-6 md:w-7 md:h-7 relative transition-transform group-hover:scale-110" />

                        {isBooking ? (
                          <Loader2 className="w-3.5 h-3.5 sm:w-6 sm:h-6 animate-spin" />
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
                            <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </motion.div>
                        )}
                      </button>
                    </motion.div>

                    {/* Additional Info */}
                    <div className="mt-2 pt-2 sm:mt-6 md:mt-6 sm:pt-6 md:pt-6 border-t border-gray-100">
                      <div className="grid grid-cols-3 items-center">
                        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-3 justify-start">
                          <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-500" />
                          <span className="text-gray-700 text-[10px] sm:text-base md:text-lg">
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
                                {language === "en" ? "mats available" : "mats disponibles"}
                              </motion.span>
                            </AnimatePresence>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-3 justify-start sm:justify-center">
                          <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-500" />
                          <CountdownTimer
                            classTime={nextClass.time}
                            language={language}
                          />
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-3 justify-start sm:justify-end">
                          <Globe2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-500" />
                          <span className="text-gray-700 text-[10px] sm:text-base md:text-lg whitespace-nowrap">
                            {language === "en" ? "Bilingual Class" : "Clase Bilingüe"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Ver Horarios button */}
                <motion.button
                  onClick={handleViewSchedule}
                  disabled={isViewingSchedule}
                  className={`w-full bg-white/90 backdrop-blur-sm text-gray-500 py-2 sm:py-4 md:py-4 px-2.5 sm:px-6 md:px-6 rounded-lg sm:rounded-xl md:rounded-xl hover:bg-white/95 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 md:gap-2 border border-gray-200 font-semibold text-xs sm:text-lg md:text-lg group ${isViewingSchedule ? 'cursor-not-allowed opacity-80' : ''}`}
                  style={{
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                    borderBottom: "4px solid #f3f4f6"
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isViewingSchedule ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 sm:gap-2 md:gap-2"
                      >
                        <Loader2 className="w-3 h-3 sm:w-5 sm:h-5 md:w-5 md:h-5 animate-spin" />
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
                    <ChevronRight className="w-3 h-3 sm:w-5 sm:h-5 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
                  )}
                </motion.button>
              </div>
            )}

            {!nextClass && (
              <div className="text-center text-gray-500 py-3 sm:py-8">
                {language === "en"
                  ? "No classes available at the moment."
                  : "No hay clases disponibles en este momento."}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
