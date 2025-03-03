import { Check } from 'lucide-react'
import { Button } from './ui/button'

interface AddToCartButtonProps {
  isAdded: boolean
  onClick: () => void
  buttonText?: string
  language: string
}

export function AddToCartButton({ isAdded, onClick, buttonText = 'Add to Cart', language }: AddToCartButtonProps) {
  const handleClick = () => {
    console.log('AddToCartButton clicked:', buttonText);
    onClick();
  };

  return (
    <Button 
      variant="default"
      onClick={handleClick}
      className={`w-auto min-w-[100px] flex items-center justify-center transition-all duration-300 rounded-2xl
        ${isAdded ? 'bg-gray-500 hover:bg-gray-600' : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-md hover:shadow-lg transform hover:scale-102 active:scale-98'} text-white`}
    >
      {isAdded ? (
        <><Check size={14} className="mr-1" />{language === "en" ? "Added" : "Agregado"}</>
      ) : (
        buttonText
      )}
    </Button>
  )
} 