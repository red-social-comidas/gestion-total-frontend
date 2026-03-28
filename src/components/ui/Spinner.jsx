// src/components/ui/Spinner.jsx
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div
      className={`${sizes[size]} border-2 border-gray-200 border-t-acento
                  rounded-full animate-spin ${className}`}
      style={{ borderTopColor: 'var(--color-acento)' }}
    />
  )
}

export const PageSpinner = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <Spinner size="lg" />
  </div>
)
