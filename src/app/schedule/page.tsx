"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { format, addDays, startOfWeek, addWeeks, getISOWeek, differenceInWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApolloClient } from '@apollo/client';
import { GET_POSSIBLE_ALLOCATIONS } from '@/lib/graphql/queries';
import { Allocation, GetPossibleAllocationsQuery } from '@/types/graphql';
import { Header } from '@/components/header';
import { Spinner } from '@/components/spinner';
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export default function SchedulePage() {
  const router = useRouter();
  const { language } = useLanguageContext();
  const client = useApolloClient();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [schedule, setSchedule] = useState<GroupedClasses>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const start = startOfWeek(today);
    const diff = differenceInWeeks(today, start);
    return diff;
  });

  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(startOfWeek(addWeeks(currentDate, selectedWeek), { weekStartsOn: 1 }), index);
    return {
      date,
      dayName: format(date, 'EEEE', { locale: es }),
      dayNumber: format(date, 'd'),
      isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    };
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
  };

  const handleWeekChange = (direction: number) => {
    setSelectedWeek(prevWeek => prevWeek + direction);
    setSlideDirection(direction);
  };

  const getWeekOfMonth = (date: Date) => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstWeek = getISOWeek(firstDayOfMonth);
    const currentWeek = getISOWeek(date);
    return currentWeek - firstWeek + 1;
  };

  const formatMonthAndWeek = (date: Date) => {
    const monthName = format(date, "MMMM", { locale: es });
    const weekNumber = getWeekOfMonth(date);
    return (
      <div className="flex flex-col items-center">
        <span className="text-sm text-gray-500">
          Semana {weekNumber}
        </span>
        <span className="text-lg font-medium capitalize">
          {monthName}
        </span>
      </div>
    );
  };

  const getDayButtonClass = (day: typeof weekDays[0]) => {
    const isSelected = format(day.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    const isToday = format(day.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    if (isSelected) {
      return 'bg-green-500 text-white shadow-lg transform scale-105 ring-2 ring-green-300 ring-offset-2';
    }
    if (isToday) {
      return 'bg-green-50 text-green-600 hover:bg-green-100 hover:scale-105 transition-transform';
    }
    return 'bg-gray-50 hover:bg-green-50 text-gray-700 hover:scale-105 transition-transform';
  };

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
            endDate
          },
          fetchPolicy: 'network-only',
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
          const date = new Date(allocation.startTime);
          const dayKey = format(date, 'yyyy-MM-dd');
          
          if (!groupedSchedule[dayKey]) {
            groupedSchedule[dayKey] = [];
          }

          const sessionType = allocation.sessionType;
          const timeSlot = allocation.timeSlot;
          const duration = timeSlot?.duration || sessionType?.defaultDuration || 60;

          groupedSchedule[dayKey].push({
            id: allocation.id,
            startDateTime: allocation.startTime,
            endDateTime: new Date(new Date(allocation.startTime).getTime() + duration * 60000).toISOString(),
            enrolled: allocation.currentReservations || 0,
            status: allocation.status || 'AVAILABLE',
            schedule: {
              id: timeSlot?.id || '',
              name: sessionType?.name || 'Class',
              description: { 
                en: sessionType?.description?.en || '', 
                es: sessionType?.description?.es || '' 
              },
              duration: duration,
              matpassRequirement: 1,
              expertiseLevel: sessionType?.expertiseLevel || 'all'
            },
            primaryTeacher: {
              user: {
                firstName: timeSlot?.agent?.name?.split(' ')[0] || '',
                lastName: timeSlot?.agent?.name?.split(' ')[1] || ''
              }
            },
            room: {
              name: timeSlot?.room?.name || 'Main Studio',
              capacity: sessionType?.maxConsumers || timeSlot?.room?.capacity || 20
            }
          });
        });

        setSchedule(groupedSchedule);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [client, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header title={{ en: "Schedule", es: "Horarios" }} />
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header title={{ en: "Schedule", es: "Horarios" }} />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              {language === 'en' ? 'Error loading schedule: ' : 'Error al cargar el horario: '}{error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="sticky top-0 z-50 bg-white bg-opacity-95 backdrop-blur-sm shadow-sm">
        <Header title={{ en: "Schedule", es: "Horarios" }} />
      </div>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Week navigator */}
          <div className="fixed top-[72px] left-0 right-0 z-40 bg-gradient-to-b from-blue-50 via-blue-50 to-transparent pb-2">
            <div className="container mx-auto px-4 pt-4">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {language === 'en' ? 'Class Schedule' : 'Horarios de Clases'}
                    </h1>
                    <div className="flex items-center gap-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleWeekChange(-1)}
                        className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </motion.button>
                      <motion.div
                        key={selectedWeek}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="min-w-[150px] text-center"
                      >
                        {formatMonthAndWeek(addWeeks(currentDate, selectedWeek))}
                      </motion.div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleWeekChange(1)}
                        className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Days of Week */}
                  <motion.div
                    key={selectedWeek}
                    initial={{ x: 50 * slideDirection, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="grid grid-cols-7 gap-3"
                  >
                    {weekDays.map((day) => (
                      <motion.button
                        key={day.date.toString()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${getDayButtonClass(day)}`}
                        onClick={() => handleDateSelect(day.date)}
                      >
                        <span className={`text-sm font-medium capitalize
                          ${format(day.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                            ? 'text-white font-semibold'
                            : format(day.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                              ? 'text-green-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {day.dayName}
                        </span>
                        <span className={`text-3xl font-bold mt-1
                          ${format(day.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                            ? 'text-white'
                            : format(day.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                              ? 'text-green-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Schedule content */}
          <div className="mt-[240px]">
            <motion.div
              key={format(selectedDate, 'yyyy-MM-dd')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-4"
            >
              <div className="space-y-4">
                {schedule[format(selectedDate, 'yyyy-MM-dd')]?.map((classInfo, index) => (
                  <motion.div
                    key={`${classInfo.id}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 h-[180px] flex flex-col justify-between bg-white"
                    style={{
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                      borderBottom: '4px solid #f3f4f6'
                    }}
                    onClick={() => router.push(`/user-selection?classId=${classInfo.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-bold text-gray-900">
                            {classInfo.schedule.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                              {classInfo.schedule.duration} min
                            </span>
                            <span className={`text-sm px-3 py-1 rounded-full ${
                              classInfo.enrolled >= classInfo.room.capacity
                                ? 'bg-red-100 text-red-600'
                                : classInfo.enrolled >= classInfo.room.capacity * 0.8
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {classInfo.enrolled}/{classInfo.room.capacity}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-gray-600 text-lg">
                            {language === 'en' ? 'with' : 'con'} {classInfo.primaryTeacher.user.firstName}
                          </p>
                          {classInfo.schedule.description[language as keyof typeof classInfo.schedule.description] && (
                            <span className="text-sm text-gray-500">
                              • {classInfo.schedule.description[language as keyof typeof classInfo.schedule.description]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {format(new Date(classInfo.startDateTime), 'h:mm a')}
                        </p>
                        <p className="text-gray-600">
                          {format(new Date(classInfo.endDateTime), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-5 h-5" />
                        <span className={
                          classInfo.enrolled >= classInfo.room.capacity
                            ? 'text-red-600'
                            : classInfo.enrolled >= classInfo.room.capacity * 0.8
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                        }>
                          {language === 'en'
                            ? `${classInfo.room.capacity - classInfo.enrolled} spots left`
                            : `${classInfo.room.capacity - classInfo.enrolled} cupos disponibles`}
                        </span>
                      </div>
                      <button 
                        className={`px-8 py-3 rounded-xl transition-colors text-lg font-semibold ${
                          classInfo.enrolled >= classInfo.room.capacity
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                        disabled={classInfo.enrolled >= classInfo.room.capacity}
                      >
                        {classInfo.enrolled >= classInfo.room.capacity
                          ? (language === 'en' ? 'Full' : 'Lleno')
                          : (language === 'en' ? 'Book Now' : 'Reservar')}
                      </button>
                    </div>
                  </motion.div>
                ))}
                {(!schedule[format(selectedDate, 'yyyy-MM-dd')] || schedule[format(selectedDate, 'yyyy-MM-dd')].length === 0) && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-lg">
                      {language === 'en'
                        ? 'No classes available for this day'
                        : 'No hay clases disponibles para este día'}
                    </p>
                    <p className="text-gray-400 mt-2">
                      {language === 'en'
                        ? 'Please select another day to view available classes'
                        : 'Por favor selecciona otro día para ver las clases disponibles'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 