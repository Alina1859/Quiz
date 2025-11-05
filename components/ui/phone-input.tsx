import * as React from "react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { parsePhoneNumber, isValidPhoneNumber } from "react-phone-number-input";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Мапа названий стран на русском языке
const countryNames: Record<string, string> = {
  RU: "Россия",
  BY: "Беларусь",
  UA: "Украина",
  KZ: "Казахстан",
  UZ: "Узбекистан",
  AM: "Армения",
  AZ: "Азербайджан",
  GE: "Грузия",
  MD: "Молдова",
  KG: "Киргизия",
  TJ: "Таджикистан",
  TM: "Туркменистан",
  GB: "Великобритания",
  DE: "Германия",
  FR: "Франция",
  IT: "Италия",
  ES: "Испания",
  NL: "Нидерланды",
  BE: "Бельгия",
  PL: "Польша",
  PT: "Португалия",
  GR: "Греция",
  CZ: "Чехия",
  AT: "Австрия",
  CH: "Швейцария",
  SE: "Швеция",
  NO: "Норвегия",
  DK: "Дания",
  FI: "Финляндия",
  IE: "Ирландия",
  HU: "Венгрия",
  RO: "Румыния",
  BG: "Болгария",
  HR: "Хорватия",
  SK: "Словакия",
  SI: "Словения",
  LT: "Литва",
  LV: "Латвия",
  EE: "Эстония",
  CY: "Кипр",
  MT: "Мальта",
  LU: "Люксембург",
  IS: "Исландия",
  RS: "Сербия",
  ME: "Черногория",
  MK: "Северная Македония",
  AL: "Албания",
  BA: "Босния и Герцеговина",
  XK: "Косово",
  US: "США",
  CA: "Канада",
  CN: "Китай",
  JP: "Япония",
  IN: "Индия",
  AU: "Австралия",
  BR: "Бразилия",
  MX: "Мексика",
  KR: "Южная Корея",
  TR: "Турция",
  IL: "Израиль",
  AE: "ОАЭ",
  SA: "Саудовская Аравия",
  ZA: "ЮАР",
  EG: "Египет",
  TH: "Таиланд",
  ID: "Индонезия",
  PH: "Филиппины",
  VN: "Вьетнам",
  SG: "Сингапур",
};

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> & {
  onChange?: (value: RPNInput.Value) => void;
  value?: RPNInput.Value;
  defaultCountry?: RPNInput.Country;
};

const PhoneInput = React.forwardRef<HTMLDivElement, PhoneInputProps>(
  ({ className, onChange, value, defaultCountry = "RU", placeholder, ...props }, ref) => {
    const [selectedCountry, setSelectedCountry] = React.useState<RPNInput.Country | undefined>(
      defaultCountry
    );
    const [phoneNumber, setPhoneNumber] = React.useState<string>("");
    const [isValid, setIsValid] = React.useState<boolean>(true);
    const [isDropdownOpen, setIsDropdownOpen] = React.useState<boolean>(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false);
        }
      };

      if (isDropdownOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isDropdownOpen]);

    // Initialize from value prop
    React.useEffect(() => {
      if (value) {
        try {
          const parsed = parsePhoneNumber(value as string);
          if (parsed) {
            setSelectedCountry(parsed.country);
            setPhoneNumber(parsed.nationalNumber);
          }
        } catch {
          // If parsing fails, try to extract country and number
          const match = (value as string).match(/^\+(\d+)(.*)$/);
          if (match) {
            // Try to find country by calling code
            const callingCode = match[1];
            const number = match[2];
            // This is a simplified approach - in production you might want to use a mapping
            setPhoneNumber(number);
          }
        }
      } else {
        setPhoneNumber("");
        // Устанавливаем Россию по умолчанию, если нет value
        if (!selectedCountry) {
          setSelectedCountry(defaultCountry);
        }
      }
    }, [value, defaultCountry, selectedCountry]);

    // Validate phone number when country or number changes
    React.useEffect(() => {
      if (selectedCountry && phoneNumber) {
        const fullNumber = `+${RPNInput.getCountryCallingCode(selectedCountry)}${phoneNumber}`;
        const valid = isValidPhoneNumber(fullNumber);
        setIsValid(valid);
        onChange?.(valid ? (fullNumber as RPNInput.Value) : ("" as RPNInput.Value));
      } else if (phoneNumber) {
        // If no country selected but number entered, mark as invalid
        setIsValid(false);
        onChange?.("" as RPNInput.Value);
      } else {
        setIsValid(true);
        onChange?.("" as RPNInput.Value);
      }
    }, [selectedCountry, phoneNumber, onChange]);

    const handleCountryChange = (country: RPNInput.Country) => {
      setSelectedCountry(country);
      setIsDropdownOpen(false);
      // Focus on number input after country selection
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    };

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value.replace(/\D/g, ""); // Only digits
      setPhoneNumber(input);
    };

    // Get country options
    const countryOptions = React.useMemo(() => {
      const countries = RPNInput.getCountries();
      return countries
        .map((country) => ({
          value: country,
          label: countryNames[country] || country,
        }))
        .filter(({ value }) => allowCountries.includes(value));
    }, []);

    return (
      <div ref={(node) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        containerRef.current = node;
      }} className={cn("flex flex-col relative", className)}>
        <div className="flex">
          <CountrySelectButton
            country={selectedCountry}
            options={countryOptions}
            onChange={handleCountryChange}
            isOpen={isDropdownOpen}
            onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
            hasError={!isValid && !!phoneNumber}
          />
          <Input
            {...props}
            ref={inputRef}
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            placeholder={placeholder}
            style={{ 
              backgroundColor: "var(--color-bg-neutral-low)",
              opacity: "none",
              color: "var(--color-text-default)",
              fontFamily: "'Inter Tight', sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "24px",
              height: "56px",
              border: (!isValid && phoneNumber) ? "1px solid var(--color-border-critical-default)" : "none",
              borderRadius: "8px",
              transition: "all 0.2s ease"
            }}
            className={cn(
              (!isValid && phoneNumber) ? "" : "border-l-0",
              "hover:[background-color:var(--color-bg-neutral-med)] hover:border-none",
              "focus:[background-color:var(--color-bg-neutral-low)] focus:[border:1px_solid_var(--color-border-neutral-high)]",
              "focus-visible:[background-color:var(--color-bg-neutral-low)] focus-visible:[border:1px_solid_var(--color-border-neutral-high)]",
              className
            )}
          />
        </div>
        {isDropdownOpen && (
          <CountryDropdown
            country={selectedCountry}
            options={countryOptions}
            onChange={handleCountryChange}
            onClose={() => setIsDropdownOpen(false)}
            hasError={!isValid && !!phoneNumber}
          />
        )}
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";

type CountryEntry = { label: string; value: RPNInput.Country };

const allowCountries = [
  "RU",
  "BY",
  "UA",
  "KZ",
  "UZ",
  "AM",
  "AZ",
  "GE",
  "MD",
  "KG",
  "TJ",
  "TM",
  "GB",
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "BE",
  "PL",
  "PT",
  "GR",
  "CZ",
  "AT",
  "CH",
  "SE",
  "NO",
  "DK",
  "FI",
  "IE",
  "HU",
  "RO",
  "BG",
  "HR",
  "SK",
  "SI",
  "LT",
  "LV",
  "EE",
  "CY",
  "MT",
  "LU",
  "IS",
  "RS",
  "ME",
  "MK",
  "AL",
  "BA",
  "XK",
  "US",
  "CA",
  "CN",
  "JP",
  "IN",
  "AU",
  "BR",
  "MX",
  "KR",
  "TR",
  "IL",
  "AE",
  "SA",
  "ZA",
  "EG",
  "TH",
  "ID",
  "PH",
  "VN",
  "SG"
] as RPNInput.Country[];

type CountrySelectButtonProps = {
  country?: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  hasError?: boolean;
};

const CountrySelectButton = ({
  country,
  options,
  onChange,
  isOpen,
  onToggle,
  disabled,
  hasError = false,
}: CountrySelectButtonProps) => {
  const countryName = country 
    ? countryNames[country] || country 
    : "Выберите страну";

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onToggle}
      className="flex gap-2 border-r-0 focus:z-10"
      style={{ 
        backgroundColor: "var(--color-bg-neutral-low)",
        height: "56px",
        border: hasError ? "1px solid var(--color-border-critical-default)" : "none",
        borderRadius: "8px",
        marginRight: "8px",
        padding: "0 16px"
      }}
      disabled={disabled}
    >
      {country && (
        <FlagComponent
          country={country}
          countryName={countryName}
        />
      )}
      {country && (
        <span 
          style={{ 
            color: "var(--color-text-default)",
            fontFamily: "'Inter Tight', sans-serif",
            fontWeight: 400,
            fontSize: "16px",
            lineHeight: "24px"
          }}
        >
          +{RPNInput.getCountryCallingCode(country)}
        </span>
      )}
      <div 
        className={cn(
          "w-4 h-4 flex items-center justify-center",
          disabled ? "hidden" : ""
        )}
        style={{ 
          backgroundColor: "var(--color-bg-neutral-low)",
          padding: "5.33px 3.33px"
        }}
      >
        <svg 
          width="9.333232879638672" 
          height="5.333232402801514" 
          viewBox="0 0 14 8" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ 
            color: "var(--color-text-disabled)",
            opacity: 1,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease"
          }}
        >
          <path 
            d="M0.292893 6.29289C-0.0976311 6.68342 -0.0976311 7.31643 0.292893 7.70696C0.683418 8.09748 1.31643 8.09748 1.70696 7.70696L6.99992 2.41399L12.2929 7.70696C12.6834 8.09748 13.3164 8.09748 13.707 7.70696C14.0975 7.31643 14.0975 6.68342 13.707 6.29289L7.70696 0.292893C7.31643 -0.0976311 6.68342 -0.0976311 6.29289 0.292893L0.292893 6.29289Z" 
            fill="currentColor"
          />
        </svg>
      </div>
    </Button>
  );
};

type CountryDropdownProps = {
  country?: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
  onClose: () => void;
  hasError?: boolean;
};

const CountryDropdown = ({
  country,
  options,
  onChange,
  onClose,
  hasError = false,
}: CountryDropdownProps) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = React.useState("");

  // Популярные страны
  const popularCountries = ['RU', 'AE', 'KZ', 'UA', 'AM'] as RPNInput.Country[];

  const countryList = options.filter(({ value }) => 
    allowCountries.includes(value as RPNInput.Country)
  );

  // Разделяем на популярные и все остальные
  const popularList = countryList.filter(({ value }) => 
    popularCountries.includes(value as RPNInput.Country)
  );

  const allCountriesList = [...countryList].sort((a, b) => {
      const nameA = countryNames[a.value] || a.value;
      const nameB = countryNames[b.value] || b.value;
      return nameA.localeCompare(nameB, 'ru');
    });

  // Если есть поиск, показываем отфильтрованные результаты
  const filteredList = searchValue && searchValue.trim() 
    ? countryList.filter(({ value, label }) => {
        const searchLower = searchValue.toLowerCase().trim();
        const countryName = countryNames[value] || label;
        const callingCode = `+${RPNInput.getCountryCallingCode(value)}`;
        
        return (
          countryName.toLowerCase().includes(searchLower) ||
          label.toLowerCase().includes(searchLower) ||
          callingCode.includes(searchLower) ||
          value.toLowerCase().includes(searchLower)
        );
      })
    : null;

  return (
    <div 
      className="w-full mt-2 rounded-[8px] border-none p-2"
      style={{ 
        backgroundColor: "var(--color-bg-neutral-low)",
        zIndex: 50
      }}
    >
      <Command 
        style={{ backgroundColor: "var(--color-bg-neutral-low)", color: "var(--color-text-default)" }}
        shouldFilter={false}
      >
        <CommandInput
          value={searchValue}
          onValueChange={(value) => {
            setSearchValue(value);
            setTimeout(() => {
              if (scrollAreaRef.current) {
                const viewportElement = scrollAreaRef.current.querySelector(
                  "[data-radix-scroll-area-viewport]",
                );
                if (viewportElement) {
                  viewportElement.scrollTop = 0;
                }
              }
            }, 0);
          }}
          placeholder="Поиск"
          style={{ color: "var(--color-text-default)" }}
        />
        <CommandList>
          <ScrollArea ref={scrollAreaRef} className="h-72 [&_[data-radix-scroll-area-scrollbar]]:hidden">
            <CommandEmpty style={{ color: "var(--color-text-default)" }}>Страна не найдена.</CommandEmpty>
            {filteredList ? (
              // Режим поиска - показываем все результаты
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
                  ) : null,
                )}
              </CommandGroup>
            ) : (
              // Обычный режим - показываем группы
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
                    ) : null,
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
                    ) : null,
                  )}
                </CommandGroup>
              </>
            )}
          </ScrollArea>
        </CommandList>
      </Command>
    </div>
  );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry?: RPNInput.Country;
  onChange: (country: RPNInput.Country) => void;
  onSelectComplete: () => void;
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
  onSelectComplete,
}: CountrySelectOptionProps) => {
  const itemRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!itemRef.current) return;

    const element = itemRef.current;
    const isSelected = country === selectedCountry;

    // Устанавливаем для выбранной страны
    if (isSelected) {
      element.setAttribute('data-selected', 'true');
      element.setAttribute('aria-selected', 'true');
    }

    // MutationObserver для отслеживания изменений data-selected
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-selected') {
          // Если Command установил data-selected, но это не выбранная страна - убираем
          if (!isSelected && element.hasAttribute('data-selected')) {
            element.removeAttribute('data-selected');
            element.setAttribute('aria-selected', 'false');
          }
          // Если выбранная страна, но data-selected убран - возвращаем
          else if (isSelected && !element.hasAttribute('data-selected')) {
            element.setAttribute('data-selected', 'true');
            element.setAttribute('aria-selected', 'true');
          }
        }
      });
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-selected']
    });

    return () => {
      observer.disconnect();
    };
  }, [country, selectedCountry]);

  const handleSelect = () => {
    if (country) {
      onChange(country);
      onSelectComplete();
    }
  };

  if (!country) return null;

  const isSelected = country === selectedCountry;

  return (
    <CommandItem 
      ref={itemRef}
      value={country}
      className="gap-2 !data-[selected=true]:rounded-[4px] hover:![background-color:var(--color-bg-neutral-med)] focus:![background-color:var(--color-bg-neutral-med)] [&[data-selected='true']]:![background-color:var(--color-bg-neutral-med)] [&[data-selected='true']]:hover:![background-color:var(--color-bg-neutral-med)] [&[data-selected='true']]:focus:![background-color:var(--color-bg-neutral-med)]" 
      onSelect={handleSelect}
      style={{ 
        color: "var(--color-text-default)",
        ...(isSelected ? {
          backgroundColor: "var(--color-bg-neutral-med)",
        } : {})
      }}
      data-selected={isSelected ? "true" : undefined}
    >
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm" style={{ color: "var(--color-text-default)" }}>{countryName}</span>
      <span className="text-sm" style={{ color: "var(--color-text-default)" }}>{`+${RPNInput.getCountryCallingCode(country)}`}</span>
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-[1px] bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { PhoneInput };