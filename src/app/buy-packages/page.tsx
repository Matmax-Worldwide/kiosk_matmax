  'use client'

  import { Suspense } from 'react'
  import MatPass from '@/components/MatPass'
  import KioskLayout from '@/components/KioskLayout'

  export default function BuyBundleTypesPage() {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <KioskLayout>
          <MatPass />
        </KioskLayout>
      </Suspense>
    )
  }