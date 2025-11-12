import * as React from 'react'
import * as RPNInput from 'react-phone-number-input'
import { parsePhoneNumber } from 'react-phone-number-input'
import { IMaskInput } from 'react-imask'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { allowCountries, countryNames } from '@/components/ui/utils'
import { cn } from '@/lib/utils'

import { CountryDropdown } from '@/components/ui/phone-input/country-dropdown'
import { CountrySelectButton } from '@/components/ui/phone-input/country-select-button'
import type { CountryOption, PhoneInputProps } from '@/components/ui/phone-input/types'

const sanitizeDigits = (value: string) => value.replace(/\D/g, '')

const buildPhoneValue = (country: RPNInput.Country, digits: string): string => {
  if (!digits) {
    return ''
  }

  const callingCode = RPNInput.getCountryCallingCode(country)
  return `+${callingCode}${digits}`
}

const parsePhoneValue = (
  value: string | undefined,
  fallbackCountry: RPNInput.Country
): { country?: RPNInput.Country; nationalNumber: string } => {
  if (!value) {
    return { country: undefined, nationalNumber: '' }
  }

  const stringValue = String(value)

  try {
    const parsed = parsePhoneNumber(stringValue)
    if (parsed) {
      return {
        country: parsed.country ?? fallbackCountry,
        nationalNumber: parsed.nationalNumber ?? '',
      }
    }
  } catch {
    // ignore parse errors and continue with lightweight parsing
  }

  const digits = sanitizeDigits(stringValue)
  const matchedCountry = RPNInput.getCountries().find((country) => {
    const callingCode = RPNInput.getCountryCallingCode(country)
    return stringValue.startsWith(`+${callingCode}`)
  })

  if (!matchedCountry) {
    return { country: undefined, nationalNumber: digits }
  }

  const callingCode = RPNInput.getCountryCallingCode(matchedCountry)
  const nationalNumber = digits.slice(callingCode.length)

  return {
    country: matchedCountry,
    nationalNumber,
  }
}

const COUNTRY_MASKS: Partial<Record<RPNInput.Country, string>> = {
  RU: '000 000-00-00',
  KZ: '000 000-00-00',
  BY: '000 00-00-00',
}

const FALLBACK_MASK = '000 000 000 000 000'

export const PhoneInput = React.forwardRef<HTMLDivElement, PhoneInputProps>(
  (
    {
      className,
      onChange,
      value,
      defaultCountry = 'RU',
      placeholder,
      hasError: externalHasError,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState<string>(() =>
      value !== undefined ? String(value) : ''
    )
    const [manualCountry, setManualCountry] = React.useState<RPNInput.Country>(() => {
      const parsed = parsePhoneValue(value ? String(value) : undefined, defaultCountry)
      return parsed.country ?? defaultCountry
    })
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const currentValue = value !== undefined ? String(value) : internalValue

    const activeCountry = manualCountry ?? defaultCountry
    const phoneNumber = React.useMemo(() => {
      if (!currentValue) {
        return ''
      }

      const digits = sanitizeDigits(currentValue)
      if (!digits) {
        return ''
      }

      const callingCode = RPNInput.getCountryCallingCode(activeCountry)
      if (currentValue.startsWith(`+${callingCode}`)) {
        return digits.slice(callingCode.length)
      }

      if (!currentValue.startsWith('+')) {
        return digits
      }

      const parsed = parsePhoneValue(currentValue, activeCountry)
      return parsed.nationalNumber
    }, [currentValue, activeCountry])
    const hasDigits = phoneNumber.length > 0
    const mask = React.useMemo(() => COUNTRY_MASKS[activeCountry] ?? FALLBACK_MASK, [activeCountry])
    const [isFocused, setIsFocused] = React.useState(false)

    const countryOptions = React.useMemo<CountryOption[]>((): CountryOption[] => {
      const countries = RPNInput.getCountries()
      return countries
        .map((country) => ({
          value: country,
          label: countryNames[country] || country,
        }))
        .filter(({ value }) => allowCountries.includes(value))
    }, [])

    const commitValue = React.useCallback(
      (nextValue: string) => {
        if (value === undefined) {
          setInternalValue(nextValue)
        }
        const normalized = nextValue === '' ? ('' as RPNInput.Value) : (nextValue as RPNInput.Value)
        onChange?.(normalized)
      },
      [onChange, value]
    )

    const closeDropdownAndFocus = React.useCallback(() => {
      setIsDropdownOpen(false)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }, [])

    const handleCountryChange = (country: RPNInput.Country) => {
      setManualCountry(country)
      const nextValue = hasDigits ? buildPhoneValue(country, phoneNumber) : ''
      commitValue(nextValue)
      closeDropdownAndFocus()
    }

    const {
      onBlur: onBlurProp,
      onFocus: onFocusProp,
      style: inputStyle,
      className: inputClassName,
      ...restProps
    } = props as typeof props & {
      className?: string
      onFocus?: React.FocusEventHandler<HTMLInputElement>
    }

    const handleBlur = React.useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false)
        onBlurProp?.(event)
      },
      [onBlurProp]
    )
    const handleFocus = React.useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true)
        onFocusProp?.(event)
      },
      [onFocusProp]
    )

    return (
      <div
        ref={(node) => {
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        className={cn('flex flex-col relative', className)}
        style={{
          position: 'relative',
        }}
      >
        <Popover open={isDropdownOpen} onOpenChange={() => setIsDropdownOpen(!isDropdownOpen)}>
          <div className="flex w-full">
            <PopoverTrigger asChild>
              <div>
                <CountrySelectButton
                  country={activeCountry}
                  isOpen={isDropdownOpen}
                  onToggle={() => {}}
                  hasError={externalHasError}
                />
              </div>
            </PopoverTrigger>
            <IMaskInput
              {...restProps}
              mask={mask}
              className={cn('flex h-14 w-full rounded-md px-4 py-3 text-base', inputClassName)}
              value={phoneNumber}
              unmask
              onAccept={(value) => {
                const digits = sanitizeDigits(String(value))
                if (!digits) {
                  setManualCountry(activeCountry)
                }
                const nextValue = digits ? buildPhoneValue(activeCountry, digits) : ''
                commitValue(nextValue)
              }}
              onBlur={handleBlur}
              onFocus={handleFocus}
              overwrite
              inputRef={(node) => {
                inputRef.current = node
              }}
              type="tel"
              placeholder={placeholder}
              style={{
                backgroundColor: 'var(--color-bg-neutral-low)',
                opacity: 'none',
                color: 'var(--color-text-default)',
                fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '24px',
                height: '56px',
                outline: 'none',
                boxShadow: 'none',
                border: externalHasError
                  ? '1px solid var(--color-border-critical-default)'
                  : isFocused
                    ? '1px solid var(--color-border-neutral-high)'
                    : '1px solid transparent',
                outlineColor: 'transparent',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                ...(inputStyle ?? {}),
              }}
            />
          </div>
          <PopoverContent
            className="p-0 mt-2 rounded-[12px] border-none max-w-[375px]"
            side="bottom"
            align="start"
            asChild
          >
            <div>
              <CountryDropdown
                country={activeCountry}
                options={countryOptions}
                onChange={handleCountryChange}
                onClose={() => setIsDropdownOpen(false)}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)

PhoneInput.displayName = 'PhoneInput'
