import * as React from 'react'
import * as RPNInput from 'react-phone-number-input'

import { Button } from '@/components/ui/button'
import { countryNames } from '@/components/ui/utils'
import { cn } from '@/lib/utils'

import { FlagComponent } from '@/components/ui/phone-input/flag-component'

type CountrySelectButtonProps = {
  country?: RPNInput.Country
  isOpen: boolean
  onToggle: () => void
  disabled?: boolean
  hasError?: boolean
}

export const CountrySelectButton = ({
  country,
  onToggle,
  disabled,
  hasError = false,
  isOpen,
}: CountrySelectButtonProps) => {
  const countryName = country ? countryNames[country] || country : 'Выберите страну'

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onToggle}
      className={cn(
        'flex shrink-0 items-center gap-2 h-14 px-4 focus:z-10 transition-colors bg-[var(--color-bg-neutral-low)] text-[var(--color-text-default)]',
        !disabled &&
          'cursor-pointer hover:bg-[var(--color-bg-neutral-med)] focus:bg-[var(--color-bg-neutral-med)]',
        disabled && 'cursor-default',
        hasError && 'bg-[var(--color-bg-neutral-low)]'
      )}
      disabled={disabled}
      style={{
        border: hasError
          ? '1px solid var(--color-border-critical-default)'
          : '1px solid transparent',
        borderRadius: '8px',
        paddingLeft: '16px',
        paddingRight: '16px',
        height: '56px',
        marginRight: '8px',
      }}
    >
      {country && <FlagComponent country={country} countryName={countryName} />}
      {country && (
        <span
          style={{
            color: 'var(--color-text-default)',
            fontFamily: "'Inter Tight Regular'",
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
          }}
        >
          +{RPNInput.getCountryCallingCode(country)}
        </span>
      )}
      <div
        className={cn('w-4 h-4 flex items-center justify-center', disabled ? 'hidden' : '')}
        style={{
          backgroundColor: 'transparent',
          padding: '5.33px 3.33px',
        }}
      >
        <svg
          width="9.333232879638672"
          height="5.333232402801514"
          viewBox="0 0 14 8"
          fill="none"
          style={{
            color: 'var(--color-text-disabled)',
            opacity: 1,
            transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path
            d="M0.292893 6.29289C-0.0976311 6.68342 -0.0976311 7.31643 0.292893 7.70696C0.683418 8.09748 1.31643 8.09748 1.70696 7.70696L6.99992 2.41399L12.2929 7.70696C12.6834 8.09748 13.3164 8.09748 13.707 7.70696C14.0975 7.31643 14.0975 6.68342 13.707 6.29289L7.70696 0.292893C7.31643 -0.0976311 6.68342 -0.0976311 6.29289 0.292893L0.292893 6.29289Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </Button>
  )
}
