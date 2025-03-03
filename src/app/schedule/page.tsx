"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { 
  format, 
  addDays, 
  startOfWeek, 
  addWeeks,
  startOfDay,
  differenceInDays
} from "date-fns";
import { enUS, es } from "date-fns/locale";
import { useApolloClient } from "@apollo/client";
import { 
  GET_POSSIBLE_ALLOCATIONS,
  CHECK_EXISTING_ALLOCATION,
  CREATE_ALLOCATION_FROM_TIMESLOT,
} from "@/lib/graphql/queries";
import { Allocation, GetPossibleAllocationsQuery } from "@/types/graphql";
import { Header } from "@/components/header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassCard } from "@/components/schedule/ClassCard";
import { MonthlyCalendar } from "@/components/schedule/MonthlyCalendar";

interface ClassInstance {
  id: string;
  startDateTime: string;
  endDateTime: string;
  enrolled: number;
  status: string;
  schedule: {
    id: string;
    name: string;
    description: { en: string; es: string };
    duration: number;
    matpassRequirement: number;
    expertiseLevel: string;
  };
  timeSlot: {
    id: string;
    sessionType: {
      name: string;
      maxConsumers: number;
    };
    agent?: {
      name: string;
    };
  };
  primaryTeacher: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  room: {
    name: string;
    capacity: number;
  };
}

interface GroupedClasses {
  [key: string]: ClassInstance[];
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunked: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}

function ScheduleSkeletonLoader() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
      <div className="h-full flex flex-col space-y-6">
        {[1, 2, 3].map((block) => (
          <div 
            key={block} 
            className="flex-1 border border-gray-100 rounded-xl p-6"
            style={{
              minHeight: "calc((100vh - 400px) / 3)"
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-6 w-20 mt-1" />
              </div>
            </div>
            <Skeleton className="h-6 w-72 mt-4" />
            <div className="flex items-center justify-between mt-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const router = useRouter();
  const { language } = useLanguageContext();
  const client = useApolloClient();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [schedule, setSchedule] = useState<GroupedClasses>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showMonthlyCalendar, setShowMonthlyCalendar] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'calendar'>('week');
  const [loadingAllocation, setLoadingAllocation] = useState<string | null>(null);

  const weekStarts = [0, 1, 2].map(offset => 
    startOfWeek(addWeeks(today, selectedWeek + offset), { weekStartsOn: 1 })
  );

  const allWeekDays = weekStarts.map(weekStart => 
    Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(weekStart, index);
      return {
        date,
        dayName: format(date, "EEEE", { locale: language === "es" ? es : enUS }),
        dayNumber: format(date, "d"),
        isToday: format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
        isSelected: format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
      };
    })
  );

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleWeekChange = (direction: number) => {
    const newWeek = selectedWeek + direction;
    setSelectedWeek(newWeek);
  };

  useEffect(() => {
    if (scrollRef.current) {
      const currentDayClasses =
        schedule[format(selectedDate, "yyyy-MM-dd")] || [];
      setIsScrollable(
        scrollRef.current.scrollHeight > scrollRef.current.clientHeight &&
          currentDayClasses.length > 3
      );
    }
  }, [schedule, selectedDate, loading]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = addDays(selectedDate, -30);
        const endDate = addDays(selectedDate, 7);

        const res = await client.query<GetPossibleAllocationsQuery>({
          query: GET_POSSIBLE_ALLOCATIONS,
          variables: {
            contextId: "ec966559-0580-4adb-bc6b-b150c56f935c",
            startDate,
            endDate,
          },
          fetchPolicy: "network-only",
        });

        if (res.errors?.length) {
          throw new Error(res.errors[0].message);
        }

        if (!res.data?.possibleAllocations?.length) {
          setSchedule({});
          return;
        }

        const groupedSchedule: GroupedClasses = {};

        res.data.possibleAllocations.forEach((allocation: Allocation) => {
          const startTime = new Date(allocation.startTime);
          const dayKey = format(startTime, "yyyy-MM-dd");
          if (!groupedSchedule[dayKey]) {
            groupedSchedule[dayKey] = [];
          }

          const sessionType = allocation.sessionType;
          const timeSlot = allocation.timeSlot;
          const duration =
            timeSlot?.duration || sessionType?.defaultDuration || 60;

          const allocationId =
            allocation.id ||
            `${timeSlot.id}_${format(startTime, "yyyy-MM-dd_HH:mm")}`;

          groupedSchedule[dayKey].push({
            id: allocationId,
            startDateTime: allocation.startTime,
            endDateTime: new Date(
              new Date(allocation.startTime).getTime() + duration * 60000
            ).toISOString(),
            enrolled: allocation.currentReservations || 0,
            status: allocation.status || "AVAILABLE",
            schedule: {
              id: timeSlot?.id || "",
              name: timeSlot?.sessionType?.name || sessionType?.name || "Class",
              description: {
                en: sessionType?.description?.en || "",
                es: sessionType?.description?.es || "",
              },
              duration: duration,
              matpassRequirement: 1,
              expertiseLevel: sessionType?.expertiseLevel || "all",
            },
            timeSlot: {
              id: timeSlot?.id || "",
              sessionType: {
                name: timeSlot?.sessionType?.name || sessionType?.name || "Class",
                maxConsumers: sessionType?.maxConsumers || timeSlot?.room?.capacity || 12,
              },
              agent: timeSlot?.agent,
            },
            primaryTeacher: {
              user: {
                firstName: timeSlot?.agent?.name?.split(" ")[0] || "",
                lastName: timeSlot?.agent?.name?.split(" ")[1] || "",
              },
            },
            room: {
              name: timeSlot?.room?.name || "Main Studio",
              capacity:
                sessionType?.maxConsumers || timeSlot?.room?.capacity || 12,
            },
          });
        });

        Object.keys(groupedSchedule).forEach((dayKey) => {
          groupedSchedule[dayKey].sort(
            (a, b) =>
              new Date(a.startDateTime).getTime() -
              new Date(b.startDateTime).getTime()
          );
        });

        setSchedule(groupedSchedule);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [client, selectedDate]);

  const handleMonthlyDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedWeek(Math.floor(differenceInDays(date, today) / 7));
    setShowMonthlyCalendar(false);
    setViewMode('week');
  };

  const handleNavigation = async (params: URLSearchParams) => {
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const attemptAllocationCreation = async (timeSlotId: string, startDateTime: Date): Promise<string> => {
      try {
        console.log('🔍 [Schedule] Checking for existing allocation...', {
          timeSlotId,
          startTime: startDateTime.toISOString(),
        });

        const { data: existingAllocation } = await client.query({
          query: CHECK_EXISTING_ALLOCATION,
          variables: {
            timeSlotId,
            startTime: startDateTime.toISOString(),
          },
          fetchPolicy: 'network-only',
        });

        if (existingAllocation?.allocation?.id) {
          console.log('✅ [Schedule] Using existing allocation:', existingAllocation.allocation.id);
          return existingAllocation.allocation.id;
        }

        console.log('🔨 [Schedule] Creating new allocation...', {
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

        console.log('✅ [Schedule] Created new allocation:', newAllocation.createAllocation.id);
        return newAllocation.createAllocation.id;
      } catch (error) {
        console.error(`❌ [Schedule] Attempt ${retryCount + 1} failed:`, error);
        
        if (error instanceof Error && error.message.includes('already exists')) {
          const { data: retryExistingAllocation } = await client.query({
            query: CHECK_EXISTING_ALLOCATION,
            variables: {
              timeSlotId,
              startTime: startDateTime.toISOString(),
            },
            fetchPolicy: 'network-only',
          });

          if (retryExistingAllocation?.allocation?.id) {
            return retryExistingAllocation.allocation.id;
          }
        }

        throw error;
      }
    };

    try {
      console.log('🚀 [Schedule] Starting navigation process...', {
        params: Object.fromEntries(params.entries()),
      });

      const currentParams = new URLSearchParams(window.location.search);
      const consumerId = currentParams.get('consumerId');
      const classInfo = schedule[format(selectedDate, "yyyy-MM-dd")]?.find(
        c => c.id === params.get('classId')
      );

      if (!classInfo) {
        console.error('❌ [Schedule] Class information not found');
        throw new Error("Class information not found");
      }

      const timeSlotId = classInfo.timeSlot.id;
      const startDateTime = new Date(classInfo.startDateTime);

      let allocationId: string | null = null;

      while (retryCount < MAX_RETRIES && !allocationId) {
        try {
          allocationId = await attemptAllocationCreation(timeSlotId, startDateTime);
        } catch (error) {
          retryCount++;
          if (retryCount === MAX_RETRIES) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }

      if (!allocationId) {
        throw new Error("Could not create or find allocation after multiple attempts");
      }

      params.set('classId', allocationId);
      
      console.log('🎯 [Schedule] Preparing navigation...', {
        consumerId,
        allocationId,
        params: Object.fromEntries(params.entries()),
      });

      if (consumerId) {
        console.log('➡️ [Schedule] Navigating to user details...');
        router.push(`/user-details?consumerId=${consumerId}&classId=${allocationId}`);
      } else {
        console.log('➡️ [Schedule] Navigating to user selection...');
        router.push(`/user-selection?${params.toString()}`);
      }
    } catch (error) {
      console.error('❌ [Schedule] Navigation error:', error);
      setLoadingAllocation(null);
    }
  };

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white max-h-screen h-screen overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-95 backdrop-blur-sm shadow-sm">
        <Header title={{ en: "Schedule", es: "Horarios" }} />
      </div>
      <div className="h-full pt-16 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 h-full flex flex-col relative">
          <div className="z-40 bg-gradient-to-b from-blue-50 via-blue-50 to-transparent pb-4 flex-shrink-0">
            <div className="pt-4">
              <div className="bg-white rounded-2xl shadow-lg">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 font-bold">
                      {language === "en" ? "Calendar View" : "Vista de Calendario"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode('week')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          viewMode === 'week' 
                            ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg transform hover:scale-[1.02]' 
                            : 'bg-gradient-to-r from-green-600/10 to-teal-600/10 text-green-700 hover:from-green-600/20 hover:to-teal-600/20'
                        }`}
                      >
                        {language === "en" ? "Week" : "Semana"}
                      </button>
                      <button
                        onClick={() => {
                          setShowMonthlyCalendar(true);
                          setViewMode('calendar');
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          viewMode === 'calendar' 
                            ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg transform hover:scale-[1.02]' 
                            : 'bg-gradient-to-r from-green-600/10 to-teal-600/10 text-green-700 hover:from-green-600/20 hover:to-teal-600/20'
                        }`}
                      >
                        {language === "en" ? "Month" : "Mes"}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-auto">
                    {selectedWeek > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleWeekChange(-1)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </motion.button>
                    )}
                    <motion.button
                      key={selectedWeek}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors bg-gray-50/50"
                      onClick={() => setShowMonthlyCalendar(true)}
                    >
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {format(weekStarts[0], "MMMM d", { locale: language === "es" ? es : enUS })} - 
                        {format(addDays(weekStarts[0], 6), "MMMM d", { locale: language === "es" ? es : enUS })}
                      </span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      animate={
                        selectedWeek === 0
                          ? {
                              x: [0, 8, 0],
                              transition: {
                                repeat: Infinity,
                                duration: 1.5,
                              },
                            }
                          : {}
                      }
                      onClick={() => handleWeekChange(1)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-7 gap-3">
                    {allWeekDays[0].map((day) => {
                      const isPast = day.date < startOfDay(new Date());
                      return (
                        <button
                          key={day.dayNumber}
                          onClick={() => handleDateSelect(day.date)}
                          className={`
                            flex flex-col items-center p-3 rounded-xl transition-all duration-200
                            ${isPast ? 'bg-gray-50/80 hover:bg-gray-100/80' : 'hover:bg-green-50/80 cursor-pointer bg-green-50/40'}
                            ${day.isSelected ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg transform scale-105' : ''}
                            ${day.isToday ? 'bg-green-50 text-green-600 ring-2 ring-green-300 ring-offset-2' : ''}
                          `}
                        >
                          <span className={`text-sm font-medium capitalize
                            ${day.isSelected ? 'text-white' : 'text-gray-900'}
                          `}>
                            {day.dayName}
                          </span>
                          <span className={`text-2xl font-bold mt-1
                            ${day.isSelected ? 'text-white' : 'text-gray-900'}
                          `}>
                            {day.dayNumber}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1"
              >
                <ScheduleSkeletonLoader />
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-lg p-6 h-full"
              >
                <Alert variant="destructive">
                  <AlertDescription>
                    {language === "en"
                      ? "Error loading schedule: "
                      : "Error al cargar el horario: "}
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            ) : (
              <motion.div
                key={format(selectedDate, "yyyy-MM-dd")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  delay: 0.1,
                }}
                className="rounded-2xl p-6 h-full relative"
              >
                <div
                  ref={scrollRef}
                  className="snap-y snap-mandatory h-full overflow-y-auto scrollbar-hide"
                >
                  {chunk(
                    schedule[format(selectedDate, "yyyy-MM-dd")] || [],
                    3
                  ).map((blockClasses, blockIndex) => (
                    <motion.div
                      key={`block-${blockIndex}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.2 + blockIndex * 0.1,
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                      }}
                      className="snap-start min-h-full w-full flex flex-col"
                    >
                      <div className="flex flex-col flex-1 space-y-6">
                        {blockClasses.map((classInfo) => {
                          const isPastClass = new Date(classInfo.startDateTime) < new Date();
                          return (
                            <ClassCard
                              key={classInfo.id}
                              classInfo={classInfo}
                              language={language}
                              loadingAllocation={loadingAllocation}
                              isPast={isPastClass}
                              onBookClass={async () => {
                                if (isPastClass) return;
                                
                                const params = new URLSearchParams();
                                setLoadingAllocation(classInfo.id);
                                
                                try {
                                  const allocationId = classInfo.id;
                                  
                                  if (allocationId) {
                                    params.append('classId', allocationId);
                                    params.append('activity', classInfo.schedule.name);
                                    params.append('instructor', `${classInfo.primaryTeacher.user.firstName} ${classInfo.primaryTeacher.user.lastName}`);
                                    params.append('time', format(new Date(classInfo.startDateTime), "HH:mm"));
                                    params.append('day', format(new Date(classInfo.startDateTime), "EEEE d 'de' MMMM", { locale: language === 'es' ? es : undefined }));
                                    
                                    // Determinar si esta es la próxima clase disponible (nextClass)
                                    const now = new Date();
                                    const allClasses = Object.values(schedule).flat();
                                    
                                    // Filtrar solo clases futuras y ordenarlas por fecha de inicio
                                    const futureClasses = allClasses
                                      .filter(c => new Date(c.startDateTime) > now)
                                      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
                                    
                                    // Si hay clases futuras y esta es la primera (la más próxima), es nextClass
                                    const isNextClass = futureClasses.length > 0 && futureClasses[0].id === classInfo.id;
                                    
                                    // Si es la próxima clase disponible, añadir now=true
                                    if (isNextClass) {
                                      console.log('🔍 [Schedule] This is the next available class, adding now=true parameter');
                                      params.append('now', 'true');
                                    }
                                    
                                    await handleNavigation(params);
                                  }
                                } catch (error) {
                                  console.error('Error handling allocation:', error);
                                  setLoadingAllocation(null);
                                }
                              }}
                            />
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}

                  {(!schedule[format(selectedDate, "yyyy-MM-dd")] ||
                    schedule[format(selectedDate, "yyyy-MM-dd")].length ===
                      0) && (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-gray-500 text-lg">
                          {language === "en"
                            ? "No classes available for this day"
                            : "No hay clases disponibles para este día"}
                        </p>
                        <p className="text-gray-400 mt-2">
                          {language === "en"
                            ? "Please select another day to view available classes"
                            : "Por favor selecciona otro día para ver las clases disponibles"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {isScrollable && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0.5, y: 10 }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                  y: [10, 0, 10],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium bg-green-100 text-green-600 px-3 py-1 rounded-full">
                    {language === "en" 
                      ? "Scroll up to see more classes"
                      : "Desliza hacia arriba para ver más clases"}
                  </span>
                  <svg
                    className="w-6 h-6 text-green-500 rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        <MonthlyCalendar
          selectedDate={selectedDate}
          onDateSelect={handleMonthlyDateSelect}
          onClose={() => setShowMonthlyCalendar(false)}
          language={language}
          show={showMonthlyCalendar}
        />
      </AnimatePresence>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}