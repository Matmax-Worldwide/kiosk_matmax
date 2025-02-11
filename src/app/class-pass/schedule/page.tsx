"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, User2, Ticket, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApolloClient } from '@apollo/client';
import { GET_HORARIOS } from '@/lib/graphql/queries';
import { Allocation, GetHorariosQuery } from '@/types/graphql';
import { Header } from '@/components/header';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [schedule, setSchedule] = useState<GroupedClasses>({});
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      handleScroll();
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await client.query<GetHorariosQuery>({
          query: GET_HORARIOS,
          variables: { contextId: "ec966559-0580-4adb-bc6b-b150c56f935c" }
        });

        if (res.errors && res.errors.length > 0) {
          throw new Error(res.errors[0].message);
        }

        if (!res.data.allocations) {
          throw new Error('No schedule data found');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const groupedSchedule: GroupedClasses = {};
        res.data.allocations
          .filter((allocation: Allocation) => {
            const allocationDate = new Date(allocation.startTime);
            return allocationDate >= today;
          })
          .sort((a: Allocation, b: Allocation) => {
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
          })
          .forEach((allocation: Allocation) => {
            const date = new Date(allocation.startTime);
            const dayKey = format(date, 'yyyy-MM-dd');
            
            if (!groupedSchedule[dayKey]) {
              groupedSchedule[dayKey] = [];
            }

            groupedSchedule[dayKey].push({
              id: allocation.id,
              startDateTime: allocation.startTime,
              endDateTime: allocation.endTime,
              enrolled: allocation.currentReservations,
              status: allocation.status,
              schedule: {
                id: allocation.timeSlot.id,
                name: allocation.timeSlot.sessionType.name,
                description: { en: '', es: '' }, // Add descriptions if available
                duration: allocation.timeSlot.duration,
                matpassRequirement: 1, // Add if available
                expertiseLevel: 'all' // Add if available
              },
              primaryTeacher: {
                user: {
                  firstName: allocation.timeSlot.agent?.name?.split(' ')[0] || '',
                  lastName: allocation.timeSlot.agent?.name?.split(' ')[1] || ''
                }
              },
              room: {
                name: 'Main Studio', // Add if available
                capacity: allocation.timeSlot.sessionType.maxConsumers
              }
            });
          });

        setSchedule(groupedSchedule);
        // Set the first available day as default selected day
        const sortedDays = Object.keys(groupedSchedule).sort();
        if (sortedDays.length > 0 && !selectedDay) {
          setSelectedDay(sortedDays[0]);
        }
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [client, selectedDay]);

  const handleClassSelection = (classInfo: ClassInstance) => {
    router.push(`/class-pass/purchase?classId=${classInfo.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">
          {language === 'en' ? 'Loading schedule...' : 'Cargando horario...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-500">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  if (!Object.keys(schedule).length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-600">
        <AlertCircle className="w-8 h-8 mb-2" />
        <span>
          {language === 'en'
            ? 'No classes available for this week'
            : 'No hay clases disponibles para esta semana'}
        </span>
      </div>
    );
  }

  return (
    <>
    <Header title={{ en: "Schedule", es: "Horario" }} />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 max-w-4xl"
    >
      <div className="flex items-center justify-start mb-8 text-gray-600">
        <Ticket className="w-5 h-5 mr-2" />
        <span>
          {language === 'en'
            ? 'All classes require 1 MatPass'
            : 'Todas las clases requieren 1 MatPass'}
        </span>
      </div>

      <div className="relative flex items-center mb-8">
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-opacity duration-200 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex space-x-2 overflow-x-auto scrollbar-hide mx-10 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={handleScroll}
        >
          <style jsx global>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {Object.keys(schedule).sort().map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`
                px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-colors
                ${selectedDay === day
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              `}
            >
              {format(new Date(day), "EEE d MMM", { locale: es })}
            </button>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-opacity duration-200 ${
            canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="space-y-4">
        {selectedDay && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {format(new Date(selectedDay), "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {language === 'en' 
                ? 'Available classes for this day'
                : 'Clases disponibles para este día'}
            </p>
          </div>
        )}
        {schedule[selectedDay]?.sort((a, b) => 
          new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
        ).map((classInfo, index) => (
          <motion.div
            key={`${classInfo.id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => handleClassSelection(classInfo)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{classInfo.schedule.name}</h3>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Ticket className="w-4 h-4 mr-1" />
                  <span>{classInfo.schedule.matpassRequirement} MatPass</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center text-gray-600">
                  <User2 className="w-5 h-5 mr-2" />
                  <span>
                    {`${classInfo.primaryTeacher.user.firstName}`}
                  </span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>{format(new Date(classInfo.startDateTime), 'EEEE', { locale: es })}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>
                    {`${format(new Date(classInfo.startDateTime), 'h:mm a')} (${classInfo.schedule.duration} min)`}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                {classInfo.schedule.description[language as keyof typeof classInfo.schedule.description]}
              </div>

              <div className="mt-2 text-sm text-gray-500">
                {language === 'en'
                  ? `${classInfo.enrolled}/${classInfo.room.capacity} spots filled`
                  : `${classInfo.enrolled}/${classInfo.room.capacity} cupos ocupados`}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
    </>
  );
} 