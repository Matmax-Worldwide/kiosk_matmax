'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/spinner';
import { CreditCard, Timer, ChevronRight, Music2, Armchair } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ClassPass {
id: string;
name: string;
description: string;
credits: number;
validityPeriod: string;
price: number;
classesIncluded: string[];
maxClasses: number;
currentAttendees: number;
maxAttendees: number;
nextClass: string;
instructor: string;
location: string;
duration: string;
}

// Mock data
const MOCK_CLASS_PASSES: ClassPass[] = [
{
id: '1',
name: 'MatPass Básico',
description: 'Nidra Beats',
credits: 1,
validityPeriod: '30 días',
price: 50,
classesIncluded: ['Yoga', 'Pilates', 'Meditación'],
maxClasses: 8,
currentAttendees: 12,
maxAttendees: 20,
nextClass: 'Miércoles 8:00 pm',
instructor: 'Moises',
location: 'Estudio A',
duration: '60 minutos'
}
];

// Changed to default export
export default function ClientClassPassContent() {
const [isLoading, setIsLoading] = useState(true);
const [classPasses, setClassPasses] = useState<ClassPass[]>([]);
const [error, setError] = useState<string | null>(null);
const router = useRouter();

useEffect(() => {
const fetchClassPasses = async () => {
try {
await new Promise(resolve => setTimeout(resolve, 1000));
setClassPasses(MOCK_CLASS_PASSES);
} catch (err) {
setError(err instanceof Error ? err.message : 'An error occurred');
} finally {
setIsLoading(false);
}
};

fetchClassPasses();
}, []);

if (isLoading) {
return (
<div className="flex items-center justify-center min-h-[50vh]">
<Spinner />
</div>
);
}

if (error) {
return (
<div className="container mx-auto px-4 py-8">
<div className="max-w-4xl mx-auto text-center text-red-600">
<p>Error: {error}</p>
</div>
</div>
);
}

return (
<motion.div
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.5 }}
className="container mx-auto px-4 py-8"
>
<div className="max-w-4xl mx-auto">
<div className="space-y-6">
{classPasses.map((classPass) => (
<div key={classPass.id}>
<motion.div
initial={{ y: 20, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ duration: 0.5, delay: 0.2 }}
className="bg-white rounded-2xl shadow-lg overflow-hidden border
border-gray-100 mb-4"
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
{classPass.description}
</motion.h2>
<motion.span
initial={{ x: -20, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
transition={{ duration: 0.5, delay: 0.4 }}
className="text-2xl text-gray-600 font-medium mt-2"
>
con <span className="font-semibold">{classPass.instructor}</span>
</motion.span>
<motion.div
initial={{ x: -20, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
transition={{ duration: 0.5, delay: 0.5 }}
className="flex items-center gap-3 text-xl mt-3"
>
<p className="font-medium text-gray-800">{classPass.nextClass}</p>
<span className="text-gray-400">•</span>
<p className="font-medium text-gray-800">{classPass.duration}</p>
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
S/. {classPass.price}
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
className="w-full bg-green-500 text-white py-6 px-6 rounded-xl
hover:bg-green-600 transition-colors flex items-center justify-center
gap-3 text-2xl font-semibold shadow-lg hover:shadow-xl"
onClick={() => {
console.log('Purchase:', classPass.id);
}}
>
<CreditCard className="w-7 h-7" />
Comprar Ahora
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
<Armchair className="w-6 h-6 text-green-500" />
<span className="text-gray-700 text-lg">12 mats</span>
</div>
<div className="flex items-center gap-3">
<Timer className="w-6 h-6 text-green-500" />
<span className="text-gray-700 text-lg">Válido por
{classPass.validityPeriod}</span>
</div>
<div className="flex items-center gap-3">
<Music2 className="w-6 h-6 text-green-500" />
<span className="text-gray-700 text-lg">Sound healing</span>
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
className="w-full bg-white text-gray-500 py-3 px-6 rounded-xl
hover:bg-gray-50 transition-colors flex items-center justify-center
gap-2 border-2 border-gray-300 font-semibold text-lg"
onClick={() => router.push('/schedule')}
>
Ver Horarios
<ChevronRight className="w-5 h-5" />
</motion.button>
</div>
))}
</div>
{classPasses.length === 0 && (
<div className="text-center text-gray-500 py-8">
No hay pases disponibles en este momento.
</div>
)}
</div>
</motion.div>
);
}