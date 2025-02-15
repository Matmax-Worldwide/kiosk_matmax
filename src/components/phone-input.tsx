"use client";
import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, ArrowLeft } from 'lucide-react';
import * as Flags from 'country-flag-icons/react/3x2';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  format: string;
}

const countries: Country[] = [
  // Peru first as default
  { code: 'PE', name: 'Peru', dialCode: '+51', format: '... ... ...' },
  
  // Rest of South America
  { code: 'AR', name: 'Argentina', dialCode: '+54', format: '(...) ....-....' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', format: '... ... ...' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', format: '(...) .....-....' },
  { code: 'CL', name: 'Chile', dialCode: '+56', format: '(...) ....-....' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', format: '... ... ....' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', format: '.. ...-....' },
  { code: 'GY', name: 'Guyana', dialCode: '+592', format: '... ....' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', format: '(...) ...-...' },
  { code: 'SR', name: 'Suriname', dialCode: '+597', format: '...-....' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', format: '.... ....' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', format: '(...) ...-....' },

  // North America
  { code: 'US', name: 'United States', dialCode: '+1', format: '(...) ...-....' },
  { code: 'CA', name: 'Canada', dialCode: '+1', format: '(...) ...-....' },

  // Central America & Caribbean
  { code: 'MX', name: 'Mexico', dialCode: '+52', format: '(...) ...-....' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', format: '....-....' },
  { code: 'CU', name: 'Cuba', dialCode: '+53', format: '... ....' },
  { code: 'DO', name: 'Dominican Republic', dialCode: '+1', format: '(...) ...-....' },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', format: '....-....' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', format: '....-....' },
  { code: 'HT', name: 'Haiti', dialCode: '+509', format: '....-....' },
  { code: 'HN', name: 'Honduras', dialCode: '+504', format: '....-....' },
  { code: 'JM', name: 'Jamaica', dialCode: '+1', format: '(...) ...-....' },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', format: '....-....' },
  { code: 'PA', name: 'Panama', dialCode: '+507', format: '....-....' },
  { code: 'PR', name: 'Puerto Rico', dialCode: '+1', format: '(...) ...-....' },
  { code: 'TT', name: 'Trinidad and Tobago', dialCode: '+1', format: '(...) ...-....' },

  // Europe
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', format: '.... ......' },
  { code: 'DE', name: 'Germany', dialCode: '+49', format: '.... ........' },
  { code: 'FR', name: 'France', dialCode: '+33', format: '. .. .. .. ..' },
  { code: 'IT', name: 'Italy', dialCode: '+39', format: '... ... ....' },
  { code: 'ES', name: 'Spain', dialCode: '+34', format: '... ... ...' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', format: '... ... ...' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', format: '.. ........' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', format: '... .. .. ..' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', format: '.. ... .. ..' },
  { code: 'AT', name: 'Austria', dialCode: '+43', format: '... ......' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', format: '....-......' },
  { code: 'NO', name: 'Norway', dialCode: '+47', format: '... .. ...' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', format: '.. .. .. ..' },
  { code: 'FI', name: 'Finland', dialCode: '+358', format: '.. ... .. ..' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', format: '.. .......' },
  { code: 'PL', name: 'Poland', dialCode: '+48', format: '... ... ...' },
  { code: 'RO', name: 'Romania', dialCode: '+40', format: '... ... ...' },
  { code: 'GR', name: 'Greece', dialCode: '+30', format: '... ......' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', format: '... ... ...' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', format: '.. ... ...' },
  { code: 'SK', name: 'Slovakia', dialCode: '+421', format: '... ... ...' },

  // Asia
  { code: 'CN', name: 'China', dialCode: '+86', format: '... .... ....' },
  { code: 'JP', name: 'Japan', dialCode: '+81', format: '... ... ....' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', format: '... .... ....' },
  { code: 'IN', name: 'India', dialCode: '+91', format: '..... .....' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', format: '... .... ....' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', format: '.. .... ....' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', format: '.... ....' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', format: '.. ... ....' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', format: '... ... ...' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', format: '... ... ....' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', format: '.... ....' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', format: '... ... ...' },
  { code: 'IL', name: 'Israel', dialCode: '+972', format: '... ... ....' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', format: '.. ... ....' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', format: '.. ... ....' },

  // Oceania
  { code: 'AU', name: 'Australia', dialCode: '+61', format: '... ... ...' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', format: '.. ... ....' },
  { code: 'FJ', name: 'Fiji', dialCode: '+679', format: '... ....' },
  { code: 'PG', name: 'Papua New Guinea', dialCode: '+675', format: '... ....' },

  // Africa
  { code: 'ZA', name: 'South Africa', dialCode: '+27', format: '.. ... ....' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', format: '... ... ....' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', format: '... ......' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', format: '... ... ....' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', format: '... ......' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', format: '.. ... ....' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', format: '.. ... ....' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', format: '... ... ...' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', format: '... ......' },
  { code: 'CI', name: 'Ivory Coast', dialCode: '+225', format: '.. .. .. ..' },
  { code: 'CM', name: 'Cameroon', dialCode: '+237', format: '.... ....' },
  { code: 'SN', name: 'Senegal', dialCode: '+221', format: '.. ... .. ..' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', format: '.. .......' },
  { code: 'AO', name: 'Angola', dialCode: '+244', format: '... ... ...' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', format: '... ... ...' },
  { code: 'MW', name: 'Malawi', dialCode: '+265', format: '... ... ...' },
  { code: 'NA', name: 'Namibia', dialCode: '+264', format: '.. ... ....' },
  { code: 'BW', name: 'Botswana', dialCode: '+267', format: '.. ... ...' },
  { code: 'LS', name: 'Lesotho', dialCode: '+266', format: '.... ....' },
  { code: 'MU', name: 'Mauritius', dialCode: '+230', format: '.... ....' },
  { code: 'SC', name: 'Seychelles', dialCode: '+248', format: '.. .. ..' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', format: '.. ... ...' },
  { code: 'LY', name: 'Libya', dialCode: '+218', format: '.. .......' },
  { code: 'GM', name: 'Gambia', dialCode: '+220', format: '... ....' },
  { code: 'SL', name: 'Sierra Leone', dialCode: '+232', format: '.. ......' },
  { code: 'LR', name: 'Liberia', dialCode: '+231', format: '... ... ...' },
  { code: 'BJ', name: 'Benin', dialCode: '+229', format: '.. .. .. ..' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', format: '.. .. .. ..' },
  { code: 'ML', name: 'Mali', dialCode: '+223', format: '.. .. .. ..' },
  { code: 'MR', name: 'Mauritania', dialCode: '+222', format: '.. .. .. ..' },
  { code: 'NE', name: 'Niger', dialCode: '+227', format: '.. .. .. ..' },
  { code: 'TD', name: 'Chad', dialCode: '+235', format: '.. .. .. ..' },
  { code: 'CF', name: 'Central African Republic', dialCode: '+236', format: '.. .. .. ..' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', format: '.. .. .. ..' },
  { code: 'CG', name: 'Congo', dialCode: '+242', format: '.. .. .. ..' },
  { code: 'CD', name: 'DR Congo', dialCode: '+243', format: '... ... ...' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', format: '.. ... ...' },
  { code: 'MG', name: 'Madagascar', dialCode: '+261', format: '.. .. ... ..' },
  { code: 'SO', name: 'Somalia', dialCode: '+252', format: '.. .......' },
  { code: 'SD', name: 'Sudan', dialCode: '+249', format: '.. ... ....' },
  { code: 'SS', name: 'South Sudan', dialCode: '+211', format: '.. ... ....' },
  { code: 'BI', name: 'Burundi', dialCode: '+257', format: '.. .. .. ..' },
  { code: 'DJ', name: 'Djibouti', dialCode: '+253', format: '.. .. .. ..' },
  { code: 'ER', name: 'Eritrea', dialCode: '+291', format: '.. ... ...' },
  { code: 'SZ', name: 'Eswatini', dialCode: '+268', format: '.... ....' },
  { code: 'TG', name: 'Togo', dialCode: '+228', format: '.. .. .. ..' }
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = '912 345 678',
  error,
  className = '',
  disabled = false,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localValue, setLocalValue] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const countryListRef = React.useRef<HTMLDivElement>(null);

  // Group countries by first letter
  const groupedCountries = React.useMemo(() => {
    const filtered = searchTerm
      ? countries.filter(country =>
          country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          country.dialCode.includes(searchTerm)
        )
      : countries;

    return filtered.reduce((acc, country) => {
      const firstLetter = country.name[0].toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(country);
      return acc;
    }, {} as Record<string, Country[]>);
  }, [searchTerm]);

  const alphabet = React.useMemo(() => 
    Object.keys(groupedCountries).sort()
  , [groupedCountries]);

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`country-group-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Extract number without dial code if value changes externally
    if (value && value !== localValue) {
      const country = countries.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setLocalValue(value.slice(country.dialCode.length).trim());
      } else {
        setLocalValue(value);
      }
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatPhoneNumber = (input: string, format: string) => {
    let result = '';
    let inputIndex = 0;

    for (let i = 0; i < format.length && inputIndex < input.length; i++) {
      if (format[i] === '.') {
        result += input[inputIndex] || '';
        inputIndex++;
      } else {
        result += format[i];
      }
    }

    return result.trim();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    const formattedNumber = formatPhoneNumber(input, selectedCountry.format);
    setLocalValue(formattedNumber);
    onChange(selectedCountry.dialCode + ' ' + formattedNumber);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    onChange(country.dialCode + ' ' + localValue);
  };

  const getFlagComponent = (countryCode: string) => {
    const FlagComponent = (Flags as Record<string, React.ComponentType<{ title?: string; className?: string }>>)[countryCode];
    return FlagComponent ? <FlagComponent title={countryCode} className="w-6 h-4" /> : null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div
          className={`
            flex items-center border-2 rounded-xl bg-white
            ${error ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
        >
          <button
            type="button"
            className="flex items-center justify-center h-14 px-4 border-r border-gray-200"
            onClick={(e) => {
              e.preventDefault();
              if (!disabled) {
                setIsOpen(!isOpen);
              }
            }}
            disabled={disabled}
          >
            <span className="mr-2">
              {getFlagComponent(selectedCountry.code)}
            </span>
            <span className="text-sm text-gray-600">{selectedCountry.dialCode}</span>
            <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
          </button>
          <input
            type="tel"
            value={localValue}
            onChange={handleInputChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 h-14 px-4 text-lg bg-transparent focus:outline-none disabled:cursor-not-allowed"
          />
        </div>

        {isOpen && !disabled && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b bg-gradient-to-r from-green-600 to-teal-600 text-white">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-semibold">Select your country</h2>
                <button
                  onClick={() => setIsSearchVisible(!isSearchVisible)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>

              {/* Search Input - Only shown when search is active */}
              {isSearchVisible && (
                <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search country or code..."
                      className="w-full p-4 pl-12 text-lg border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 bg-gray-50"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-1 overflow-hidden">
                {/* Countries List */}
                <div className="flex-1 overflow-y-auto scrollbar-hide" ref={countryListRef}>
                  {alphabet.map(letter => (
                    <div key={letter} id={`country-group-${letter}`}>
                      <div className="sticky top-0 px-6 py-2 bg-gray-50 font-semibold text-lg text-gray-600 border-b border-gray-100">
                        {letter}
                      </div>
                      {groupedCountries[letter].map((country) => (
                        <button
                          key={country.code}
                          className="w-full px-6 py-4 text-left hover:bg-gray-50 flex items-center space-x-4 border-b border-gray-100"
                          onClick={() => handleCountrySelect(country)}
                        >
                          <span className="text-2xl flex-shrink-0" role="img" aria-label={country.name}>
                            {getFlagComponent(country.code)}
                          </span>
                          <span className="flex-1 text-lg">{country.name}</span>
                          <span className="text-gray-500 text-lg">{country.dialCode}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Alphabet Navigation */}
                <div className="flex flex-col justify-center px-2 py-4 bg-gray-50">
                  {alphabet.map(letter => (
                    <button
                      key={letter}
                      onClick={() => scrollToLetter(letter)}
                      className="p-1 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
} 