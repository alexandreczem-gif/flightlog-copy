import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function MunicipalityCombobox({ value, onChange, placeholder, disabled }) {
  const [cities, setCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const data = await base44.entities.City.list(null, 20000);
        setCities(data);
      } catch (error) {
        console.error("Erro ao carregar cidades:", error);
      }
    };
    loadCities();
  }, []);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    if (searchTerm.length >= 1) {
      const filtered = cities.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setFilteredCities(filtered.slice(0, 10));
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredCities([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, cities]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city) => {
    setSearchTerm(city.name);
    onChange(city.name);
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => searchTerm.length >= 1 && setShowSuggestions(true)}
        placeholder={placeholder || "Digite o município..."}
        disabled={disabled}
        className={disabled ? "bg-slate-100 cursor-not-allowed" : ""}
      />
      {showSuggestions && filteredCities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredCities.map((city) => (
            <div
              key={city.id}
              onClick={() => handleSelect(city)}
              className="px-3 py-2 cursor-pointer hover:bg-slate-100 border-b border-slate-100 last:border-0"
            >
              <div className="font-medium text-sm">{city.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}