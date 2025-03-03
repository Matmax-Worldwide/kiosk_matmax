"use client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Tag, Users, Clock, Loader2 } from "lucide-react";

interface ClassCardProps {
  classInfo: {
    id: string;
    startDateTime: string;
    endDateTime: string;
    enrolled: number;
    status: string;
    schedule: {
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
  };
  language: string;
  loadingAllocation: string | null;
  isPast?: boolean;
  onBookClass: () => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  classInfo,
  language,
  loadingAllocation,
  isPast = false,
  onBookClass,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex-1 border border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 bg-white ${
        isPast ? 'opacity-75' : ''
      }`}
      style={{
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        borderBottom: isPast ? "4px solid #e5e7eb" : "4px solid #f3f4f6",
        minHeight: "calc((100vh - 400px) / 3)",
      }}
    >
      <div className="flex flex-col h-full justify-between space-y-6">
        <div className="flex items-start justify-between space-x-6">
          <div className="flex space-x-4">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl ${
              isPast 
                ? 'bg-gradient-to-b from-gray-50 to-gray-100' 
                : 'bg-gradient-to-b from-green-50 to-gray-50'
              } flex items-center justify-center flex-shrink-0`}>
              <Tag className={`w-8 h-8 md:w-10 md:h-10 ${isPast ? 'text-gray-400' : 'text-green-600'}`} />
            </div>
            
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3">
                <h3 className={`text-lg md:text-[1.6rem] font-bold ${isPast ? 'text-gray-600' : 'text-gray-900'}`}>
                  {classInfo.schedule.name}
                </h3>
                
                <div
                  className={`flex items-center px-2 py-1 rounded-lg border ${
                    isPast
                      ? "border-gray-200 bg-gray-50"
                      : classInfo.schedule.name.toLowerCase().includes("nidra") ||
                        classInfo.schedule.name.toLowerCase().includes("beats")
                        ? "border-purple-200 bg-purple-50"
                        : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <Tag
                    className={`w-3 h-3 mr-1 ${
                      isPast
                        ? "text-gray-400"
                        : classInfo.schedule.name.toLowerCase().includes("nidra") ||
                          classInfo.schedule.name.toLowerCase().includes("beats")
                          ? "text-purple-600"
                          : "text-blue-600"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isPast
                        ? "text-gray-400"
                        : classInfo.schedule.name.toLowerCase().includes("nidra") ||
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
                <p className={`text-base md:text-2xl ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
                  {language === "en" ? "with " : "con "}
                  <span className="font-medium">{classInfo.primaryTeacher.user.firstName}</span>
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
            <p className={`text-xl md:text-2xl font-bold ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
              {format(new Date(classInfo.startDateTime), "h:mm a")}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs md:text-sm bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full flex items-center gap-2">
                <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                {classInfo.schedule.duration} min
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className={`${
              isPast 
                ? 'bg-gray-100 text-gray-500' 
                : 'bg-gradient-to-r from-green-600/10 to-teal-600/10 text-green-700'
              } px-4 py-2 rounded-lg flex items-center gap-2`}>
              <Tag className={`w-3 h-3 md:w-4 md:h-4 ${isPast ? 'text-gray-400' : 'text-green-600'}`} />
              <span className="text-xs md:text-base font-medium">
                {classInfo.schedule.name.toLowerCase().includes("acro")
                  ? language === "en"
                    ? "1 Acro MatPass"
                    : "1 Acro MatPass"
                  : "1 MatPass"}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-gray-50/80 px-4 py-2 rounded-lg">
              <Users className="w-3 h-3 md:w-5 md:h-5 text-gray-500" />
              <span
                className={`text-xs md:text-base font-medium ${
                  isPast
                    ? "text-gray-500"
                    : classInfo.enrolled >= classInfo.room.capacity
                    ? "text-red-600"
                    : classInfo.enrolled >= classInfo.room.capacity * 0.8
                    ? "text-yellow-600"
                    : "text-gray-600"
                }`}
              >
                {isPast
                  ? language === "en"
                    ? `${classInfo.enrolled} attended`
                    : `${classInfo.enrolled} asistieron`
                  : language === "en"
                  ? `${classInfo.room.capacity - classInfo.enrolled} spots left`
                  : `${classInfo.room.capacity - classInfo.enrolled} cupos disponibles`}
              </span>
            </div>
          </div>

          {isPast ? (
            <div className="px-6 md:px-8 py-2 md:py-3 rounded-xl text-sm md:text-lg font-semibold bg-gray-200 text-gray-500">
              {language === "en" ? "Past Class" : "Clase Pasada"}
            </div>
          ) : (
            <button
              className={`px-6 md:px-8 py-2 md:py-3 rounded-xl text-sm md:text-lg font-semibold transition-all duration-300 ${
                classInfo.enrolled >= classInfo.room.capacity
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : loadingAllocation === classInfo.id
                  ? "bg-gradient-to-r from-green-600/80 to-teal-600/80 text-white cursor-wait"
                  : "bg-gradient-to-r from-green-600 to-teal-600 text-white hover:shadow-lg transform hover:scale-[1.02]"
              }`}
              disabled={classInfo.enrolled >= classInfo.room.capacity || loadingAllocation === classInfo.id}
              onClick={onBookClass}
            >
              {loadingAllocation === classInfo.id ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  <span>{language === "en" ? "Processing..." : "Procesando..."}</span>
                </div>
              ) : classInfo.enrolled >= classInfo.room.capacity ? (
                language === "en" ? "Full" : "Lleno"
              ) : (
                language === "en" ? "Book Now" : "Reservar"
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}; 