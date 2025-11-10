'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface AdminPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isDisabled?: boolean
}

export function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  isDisabled = false,
}: AdminPaginationProps) {
  const disabled = isDisabled || totalPages <= 1

  const handlePrevious = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (!disabled && currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (!disabled && currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handleSelectPage = (event: React.MouseEvent<HTMLAnchorElement>, page: number) => {
    event.preventDefault()
    if (!disabled) {
      onPageChange(page)
    }
  }

  const pages: (number | 'ellipsis')[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)

    if (currentPage > 3) {
      pages.push('ellipsis')
    }

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis')
    }

    pages.push(totalPages)
  }

  return (
    <Pagination
      className={`bg-muted rounded-lg border p-4 w-fit ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      style={{ marginTop: '15px' }}
    >
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            size="default"
            onClick={handlePrevious}
            className={`${currentPage === 1 || disabled ? 'pointer-events-none opacity-50' : ''}`}
            aria-disabled={disabled || currentPage === 1}
          />
        </PaginationItem>
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          }

          return (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                size="icon"
                onClick={(event) => handleSelectPage(event, page)}
                isActive={currentPage === page}
                aria-disabled={disabled}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        })}
        <PaginationItem>
          <PaginationNext
            href="#"
            size="default"
            onClick={handleNext}
            className={`${currentPage === totalPages || disabled ? 'pointer-events-none opacity-50' : ''}`}
            aria-disabled={disabled || currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
