import * as React from 'react'
import * as RPNInput from 'react-phone-number-input'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { allowCountries, countryNames, popularCountries } from '@/components/ui/utils'
import { useDeviceType } from '@/lib/hooks'

import { CountrySelectOption } from '@/components/ui/phone-input/country-select-option'
import type { CountryOption } from '@/components/ui/phone-input/types'

type CountryDropdownProps = {
  country?: RPNInput.Country
  options: CountryOption[]
  onChange: (country: RPNInput.Country) => void
  onClose: () => void
}

export const CountryDropdown = ({ country, options, onChange, onClose }: CountryDropdownProps) => {
  const { isMobile, isTablet } = useDeviceType()

  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const [searchValue, setSearchValue] = React.useState('')

  const countryList = options.filter(({ value }) => allowCountries.includes(value))

  const popularList = countryList.filter(({ value }) =>
    popularCountries.includes(value as RPNInput.Country)
  )

  const allCountriesList = React.useMemo(
    () =>
      [...countryList].sort((a, b) => {
        const nameA = countryNames[a.value] || a.value
        const nameB = countryNames[b.value] || b.value
        return nameA.localeCompare(nameB, 'ru')
      }),
    [countryList]
  )

  const filteredList = React.useMemo(() => {
    if (!searchValue.trim()) {
      return null
    }

    const searchLower = searchValue.toLowerCase().trim()

    return countryList.filter(({ value, label }) => {
      const countryName = countryNames[value] || label
      const callingCode = `+${RPNInput.getCountryCallingCode(value)}`

      return (
        countryName.toLowerCase().includes(searchLower) ||
        label.toLowerCase().includes(searchLower) ||
        callingCode.includes(searchLower) ||
        value.toLowerCase().includes(searchLower)
      )
    })
  }, [countryList, searchValue])

  return (
    <div
      className={`mt-2 rounded-[8px] border-none p-2 ${isTablet || isMobile ? 'w-[calc(100vw-40px)]' : 'w-[375px]'}`}
      style={{
        backgroundColor: 'var(--color-bg-neutral-low)',
        zIndex: 50,
      }}
    >
      <Command
        style={{
          backgroundColor: 'var(--color-bg-neutral-low)',
          color: 'var(--color-text-default)',
        }}
        shouldFilter={false}
      >
        <CommandInput
          value={searchValue}
          onValueChange={(value) => {
            setSearchValue(value)
            setTimeout(() => {
              if (scrollAreaRef.current) {
                const viewportElement = scrollAreaRef.current.querySelector(
                  '[data-radix-scroll-area-viewport]'
                )
                if (viewportElement) viewportElement.scrollTop = 0
              }
            }, 0)
          }}
          placeholder="Поиск"
          style={{ color: 'var(--color-text-default)' }}
        />
        <CommandList>
          <ScrollArea
            ref={scrollAreaRef}
            className="h-72 [&_[data-radix-scroll-area-scrollbar]]:hidden"
          >
            <CommandEmpty>Пусто :(</CommandEmpty>
            {filteredList ? (
              <CommandGroup>
                {filteredList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={country}
                      onChange={onChange}
                      onSelectComplete={onClose}
                    />
                  ) : null
                )}
              </CommandGroup>
            ) : (
              <>
                <CommandGroup heading="Популярное">
                  {popularList.map(({ value, label }) =>
                    value ? (
                      <CountrySelectOption
                        key={value}
                        country={value}
                        countryName={label}
                        selectedCountry={country}
                        onChange={onChange}
                        onSelectComplete={onClose}
                      />
                    ) : null
                  )}
                </CommandGroup>
                <CommandGroup heading="Все">
                  {allCountriesList.map(({ value, label }) =>
                    value ? (
                      <CountrySelectOption
                        key={value}
                        country={value}
                        countryName={label}
                        selectedCountry={country}
                        onChange={onChange}
                        onSelectComplete={onClose}
                      />
                    ) : null
                  )}
                </CommandGroup>
              </>
            )}
          </ScrollArea>
        </CommandList>
      </Command>
    </div>
  )
}
