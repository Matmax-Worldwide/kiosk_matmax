"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, User2 } from "lucide-react";
import { SEARCH_CONSUMERS } from "@/lib/graphql/queries";

interface Consumer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export default function CheckInPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Search consumers query
  const { data: searchData } = useQuery(SEARCH_CONSUMERS, {
    variables: { query: searchQuery, limit: 5 },
    skip: searchQuery.length < 3,
  });

  const handleConsumerSelect = (consumerId: string) => {
    router.push(`/check-in/${consumerId}`);
  };

  return (
    <>
      <Header title={{ en: "Check-in", es: "Check-in" }} />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Buscar Alumno</h2>
                <p className="text-gray-600">
                  Ingresa el nombre o email del alumno para realizar el check-in
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {searchQuery.length >= 3 && searchData?.searchConsumers && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 space-y-2"
                  >
                    {searchData.searchConsumers.map((consumer: Consumer) => (
                      <motion.div
                        key={consumer.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-3 rounded-lg bg-white shadow-sm hover:shadow-md
                        cursor-pointer border border-gray-100"
                        onClick={() => handleConsumerSelect(consumer.id)}
                      >
                        <div className="flex items-center gap-3">
                          <User2 className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {consumer.firstName} {consumer.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{consumer.email}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>
      </main>
    </>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; 