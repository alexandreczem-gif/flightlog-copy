import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function HospitalCombobox({ value, onChange, placeholder, disabled, cityFilter }) {
  const [hospitals, setHospitals] = useState([]);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const data = await base44.entities.Hospital.list(null, 20000);
        setHospitals(data);
      } catch (error) {
        console.error("Erro ao carregar hospitais:", error);
      }
    };
    loadHospitals();
  }, []);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    let filtered = hospitals;
    
    // Filter by city first if provided
    if (cityFilter) {
      filtered = filtered.filter(h => h.municipality === cityFilter);
    }

    // Then filter by search term
    if (searchTerm) {
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredHospitals(filtered.slice(0, 10));
  }, [searchTerm, hospitals, cityFilter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (hospital) => {
    setSearchTerm(hospital.name);
    onChange(hospital.name);
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setShowSuggestions(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => filteredHospitals.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder || "Digite o nome do hospital..."}
        disabled={disabled}
        className={disabled ? "bg-slate-100 cursor-not-allowed" : ""}
      />
      {showSuggestions && filteredHospitals.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredHospitals.map((hospital) => (
            <div
              key={hospital.id}
              onClick={() => handleSelect(hospital)}
              className="px-3 py-2 cursor-pointer hover:bg-slate-100 border-b border-slate-100 last:border-0"
            >
              <div className="font-medium text-sm">{hospital.name}</div>
              <div className="text-xs text-slate-500">
                {hospital.municipality}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}