import * as RPNInput from 'react-phone-number-input'

import { CommandItem } from '@/components/ui/command'

import { FlagComponent } from '@/components/ui/phone-input/flag-component'

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry?: RPNInput.Country
  onChange: (country: RPNInput.Country) => void
  onSelectComplete: () => void
}

export const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
  onSelectComplete,
}: CountrySelectOptionProps) => {
  const handleSelect = () => {
    if (country) {
      onChange(country)
      onSelectComplete()
    }
  }

  if (!country) return null

  const isSelected = country === selectedCountry

  return (
    <CommandItem
      value={country}
      className="cursor-pointer gap-2 !data-[selected=true]:rounded-[4px] hover:![background-color:var(--color-bg-neutral-med)] focus:![background-color:var(--color-bg-neutral-med)] [&[data-selected='true']]:![background-color:var(--color-bg-neutral-med)] [&[data-selected='true']]:hover:![background-color:var(--color-bg-neutral-med)] [&[data-selected='true']]:focus:![background-color:var(--color-bg-neutral-med)]"
      onSelect={handleSelect}
      style={{
        color: 'var(--color-text-default)',
        ...(isSelected
          ? {
              backgroundColor: 'var(--color-bg-neutral-med)',
            }
          : {}),
      }}
      data-selected={isSelected ? 'true' : undefined}
    >
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm" style={{ color: 'var(--color-text-default)' }}>
        {countryName}
      </span>
      <span className="text-sm" style={{ color: 'var(--color-text-default)' }}>
        {`+${RPNInput.getCountryCallingCode(country)}`}
      </span>
    </CommandItem>
  )
}
