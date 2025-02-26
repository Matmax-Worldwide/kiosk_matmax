import { User2, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NoUsersFoundProps {
  searchQuery?: string;
  onTryNewSearch?: () => void;
}

export function NoUsersFound({ searchQuery, onTryNewSearch }: NoUsersFoundProps) {
  const router = useRouter();
  const { language } = useLanguageContext();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateAccount = () => {
    setIsCreating(true);
    router.push('/new');
  };

  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-12 border border-gray-100">
        <div className="space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
              <User2 className="w-10 h-10 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="text-gray-600 text-xl">
                {language === "en" 
                  ? "No users found. Would you like to create a new account?"
                  : "No se encontraron usuarios. ¿Deseas crear una cuenta nueva?"}
              </div>
              {searchQuery && (
                <div className="text-sm text-gray-500">
                  {language === "en"
                    ? `Search term: "${searchQuery}"`
                    : `Término de búsqueda: "${searchQuery}"`}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={handleCreateAccount}
              disabled={isCreating}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transform hover:scale-102 active:scale-98 transition-all duration-200 py-6"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {language === "en" ? "Creating..." : "Creando..."}
                </>
              ) : (
                <>
                  <User2 className="w-5 h-5 mr-2" />
                  {language === "en" ? "Create New Account" : "Crear Nueva Cuenta"}
                </>
              )}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {language === "en" ? "or" : "o"}
                </span>
              </div>
            </div>
            <Button
              onClick={onTryNewSearch}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transform hover:scale-102 active:scale-98 transition-all duration-200 py-6"
            >
              <Search className="w-5 h-5 mr-2" />
              {language === "en" ? "Try Another Search" : "Intentar Otra Búsqueda"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 