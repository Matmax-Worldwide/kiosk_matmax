import { Check } from 'lucide-react'
import { Button } from './ui/button'

interface AddToCartButtonProps {
  isAdded: boolean
  onClick: () => void
  buttonText?: string
}

export function AddToCartButton({ isAdded, onClick, buttonText = 'Add to Cart' }: AddToCartButtonProps) {
  return (
    <Button 
      variant="default"
      onClick={onClick}
      className={`w-auto min-w-[100px] flex items-center justify-center transition-all duration-300 rounded-2xl
        ${isAdded ? 'bg-gray-500 hover:bg-gray-600' : 'bg-[#4ab050] hover:bg-[#37873c]'} text-white`}
    >
      {isAdded ? (
        <><Check size={14} className="mr-1" /> Added</>
      ) : (
        buttonText
      )}
    </Button>
  )
} 