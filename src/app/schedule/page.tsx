"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Users, Tag, Clock, Calendar, Loader2 } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { 
  format, 
  addDays, 
  startOfWeek, 
  addWeeks, 
  startOfMonth, 
  endOfMonth, 
  endOfWeek, 
  isSameMonth, 
  isEqual, 
  isBefore, 
  startOfDay,
  addMonths,
  differenceInDays
} from "date-fns";
import { enUS, es } from "date-fns/locale";
import { useApolloClient, useMutation } from "@apollo/client";
import { GET_POSSIBLE_ALLOCATIONS, CREATE_ALLOCATION } from "@/lib/graphql/queries";
import { Allocation, GetPossibleAllocationsQuery } from "@/types/graphql";
import { Header } from "@/components/header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  language: string;
  show: boolean;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ selectedDate, onDateSelect, onClose, language, show }) => {
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
  const [createAllocation] = useMutation(CREATE_ALLOCATION);
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
    if (newWeek < 0) {
      return;
    }
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

        const startDate = selectedDate;
        const endDate = addDays(startDate, 7);

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
        const now = new Date();

        res.data.possibleAllocations.forEach((allocation: Allocation) => {
          const startTime = new Date(allocation.startTime);
          if (startTime <= now) return;

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
                      const isPast = isBefore(day.date, startOfDay(new Date()));
                      return (
                        <button
                          key={day.dayNumber}
                          onClick={() => !isPast && handleDateSelect(day.date)}
                          disabled={isPast}
                          className={`
                            flex flex-col items-center p-3 rounded-xl transition-all duration-200
                            ${isPast ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-green-50/80 cursor-pointer bg-green-50/40'}
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
                        {blockClasses.map((classInfo, index) => (
                          <motion.div
                            key={`${classInfo.id}-${index}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex-1 border border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 bg-white"
                            style={{
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                              borderBottom: "4px solid #f3f4f6",
                              minHeight: "calc((100vh - 400px) / 3)",
                            }}
                          >
                            <div className="flex flex-col h-full justify-between space-y-6">
                              <div className="flex items-start justify-between space-x-6">
                                <div className="flex space-x-4">
                                  <div className="w-20 h-20 rounded-xl bg-gradient-to-b from-green-50 to-gray-50 flex items-center justify-center flex-shrink-0">
                                    <Tag className="w-10 h-10 text-green-600" />
                                  </div>
                                  
                                  <div className="flex flex-col space-y-3">
                                    <div className="flex items-center space-x-3">
                                      <h3 className="text-[1.6rem] font-bold text-gray-900">
                                        {classInfo.schedule.name}
                                      </h3>
                                      
                                      <div
                                        className={`flex items-center px-2 py-1 rounded-lg border ${
                                          classInfo.schedule.name.toLowerCase().includes("nidra") ||
                                          classInfo.schedule.name.toLowerCase().includes("beats")
                                            ? "border-purple-200 bg-purple-50"
                                            : "border-blue-200 bg-blue-50"
                                        }`}
                                      >
                                        <Tag
                                          className={`w-3 h-3 mr-1 ${
                                            classInfo.schedule.name.toLowerCase().includes("nidra") ||
                                            classInfo.schedule.name.toLowerCase().includes("beats")
                                              ? "text-purple-600"
                                              : "text-blue-600"
                                          }`}
                                        />
                                        <span
                                          className={`text-xs font-medium ${
                                            classInfo.schedule.name.toLowerCase().includes("nidra") ||
                                            classInfo.schedule.name.toLowerCase().includes("beats")
                                              ? "text-purple-600"
                                              : "text-blue-600"
                                          }`}
                                        >
                                          {classInfo.schedule.name.toLowerCase().includes("nidra") ||
                                          classInfo.schedule.name.toLowerCase().includes("beats")
                                            ? "Sound Healing"
                                            : "Yoga"}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <p className="text-gray-600 text-2xl">
                                        {language === "en" ? "with " : "con "}
                                        <span className="font-large">{classInfo.primaryTeacher.user.firstName}</span>
                                      </p>
                                      {classInfo.schedule.description[language as keyof typeof classInfo.schedule.description] && (
                                        <span className="text-sm text-gray-500">
                                          • {classInfo.schedule.description[language as keyof typeof classInfo.schedule.description]}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0 space-y-2">
                                  <p className="text-2xl font-bold text-gray-900">
                                    {format(new Date(classInfo.startDateTime), "h:mm a")}
                                  </p>
                                  
                                  <div className="flex items-center gap-2 mt-2">
                                    <p className="text-sm bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                      {classInfo.schedule.duration} min
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                  <div className="bg-gradient-to-r from-green-600/10 to-teal-600/10 px-4 py-2 rounded-lg flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-green-600" />
                                    <span className="text-green-700 font-medium">
                                      {classInfo.schedule.name.toLowerCase().includes("acro")
                                        ? language === "en"
                                          ? "1 Acro MatPass"
                                          : "1 Acro MatPass"
                                        : "1 MatPass"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 bg-gray-50/80 px-4 py-2 rounded-lg">
                                    <Users className="w-5 h-5 text-gray-500" />
                                    <span
                                      className={
                                        classInfo.enrolled >= classInfo.room.capacity
                                          ? "text-red-600 font-medium"
                                          : classInfo.enrolled >= classInfo.room.capacity * 0.8
                                          ? "text-yellow-600 font-medium"
                                          : "text-gray-600 font-medium"
                                      }
                                    >
                                      {language === "en"
                                        ? `${classInfo.room.capacity - classInfo.enrolled} spots left`
                                        : `${classInfo.room.capacity - classInfo.enrolled} cupos disponibles`}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  className={`px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 ${
                                    classInfo.enrolled >= classInfo.room.capacity
                                      ? "bg-gray-400 text-white cursor-not-allowed"
                                      : loadingAllocation === classInfo.id
                                      ? "bg-gradient-to-r from-green-600/80 to-teal-600/80 text-white cursor-wait"
                                      : "bg-gradient-to-r from-green-600 to-teal-600 text-white hover:shadow-lg transform hover:scale-[1.02]"
                                  }`}
                                  disabled={classInfo.enrolled >= classInfo.room.capacity || loadingAllocation === classInfo.id}
                                  onClick={async () => {
                                    const params = new URLSearchParams();
                                    setLoadingAllocation(classInfo.id);
                                    
                                    try {
                                      let allocationId = classInfo.id;
                                      
                                      // Si el ID contiene '_', es un timeSlot y necesitamos crear una allocation
                                      if (classInfo.id && classInfo.id.includes('_')) {
                                        const [timeSlotId, dateTime] = classInfo.id.split('_');
                                        const startTime = new Date(dateTime.replace('_', ' ')).toISOString();
                                        
                                        // Creamos una nueva allocation directamente
                                        const { data: newAllocationData } = await createAllocation({
                                          variables: {
                                            input: {
                                              timeSlotId,
                                              startTime,
                                              status: "AVAILABLE"
                                            }
                                          }
                                        });
                                        
                                        if (newAllocationData?.createAllocation?.id) {
                                          allocationId = newAllocationData.createAllocation.id;
                                        } else {
                                          throw new Error('Failed to create allocation');
                                        }
                                      }

                                      // Agregamos los parámetros a la URL
                                      if (allocationId) {
                                        params.append('classId', allocationId);
                                        params.append('activity', classInfo.schedule.name);
                                        params.append('instructor', `${classInfo.primaryTeacher.user.firstName} ${classInfo.primaryTeacher.user.lastName}`);
                                        params.append('time', format(new Date(classInfo.startDateTime), "HH:mm"));
                                        params.append('day', format(new Date(classInfo.startDateTime), "EEEE d 'de' MMMM", { locale: language === 'es' ? es : undefined }));
                                        
                                        router.push(`/user-selection${params.toString() ? `?${params.toString()}` : ''}`);
                                      }
                                    } catch (error) {
                                      console.error('Error handling allocation:', error);
                                      setLoadingAllocation(null);
                                      // Aquí podrías mostrar un mensaje de error al usuario
                                    }
                                  }}
                                >
                                  {loadingAllocation === classInfo.id ? (
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                      <span>{language === "en" ? "Processing..." : "Procesando..."}</span>
                                    </div>
                                  ) : classInfo.enrolled >= classInfo.room.capacity ? (
                                    language === "en" ? "Full" : "Lleno"
                                  ) : (
                                    language === "en" ? "Book Now" : "Reservar"
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
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
                initial={{ opacity: 0.5, y: -10 }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                  y: [-10, 0, -10],
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
                      ? "Scroll for more classes"
                      : "Desliza para ver más clases"}
                  </span>
                  <svg
                    className="w-6 h-6 text-green-500"
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