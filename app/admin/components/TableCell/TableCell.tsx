import * as React from 'react'

import { TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type AdminTableCellProps = React.ComponentProps<typeof TableCell> & {
  bordered?: boolean
  nowrap?: boolean
}

export const AdminTableCell = React.forwardRef<HTMLTableCellElement, AdminTableCellProps>(
  ({ className, bordered = true, nowrap = true, ...props }, ref) => {
    return (
      <TableCell
        ref={ref}
        className={cn(
          'p-2 align-middle py-4',
          bordered && 'border-r border-border',
          nowrap && 'whitespace-nowrap',
          className
        )}
        {...props}
      />
    )
  }
)

AdminTableCell.displayName = 'AdminTableCell'
