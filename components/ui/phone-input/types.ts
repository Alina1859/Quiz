import type { ComponentProps } from 'react'
import * as RPNInput from 'react-phone-number-input'

export type PhoneInputProps = Omit<ComponentProps<'input'>, 'onChange' | 'value' | 'ref'> & {
  onChange?: (value: RPNInput.Value) => void
  value?: RPNInput.Value
  defaultCountry?: RPNInput.Country
  hasError?: boolean
}

export type CountryOption = { label: string; value: RPNInput.Country }

