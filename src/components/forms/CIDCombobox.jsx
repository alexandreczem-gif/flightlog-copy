import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function CIDCombobox({ value, onChange, placeholder = "Digite para buscar...", disabled = false }) {
  const [cids, setCids] = useState([]);
  const [filteredCids, setFilteredCids] = useState([]);
  const [inputValue, setInputValue] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    loadCids();
  }, []);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCids = async () => {
    try {
      const data = await base44.entities.CID.list('subcategoria', 20000);
      setCids(data);
    } catch (error) {
      console.error('Erro ao carregar CIDs:', error);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);

    if (val.trim().length >= 2) {
      const term = val.toLowerCase();
      const filtered = cids.filter(
        (cid) =>
          cid.descricao.toLowerCase().includes(term) ||
          cid.subcategoria.toLowerCase().includes(term)
      );
      setFilteredCids(filtered.slice(0, 20));
      setShowSuggestions(true);
    } else {
      setFilteredCids([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (cid) => {
    const displayValue = `${cid.subcategoria} - ${cid.descricao}`;
    setInputValue(displayValue);
    onChange(displayValue);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          if (inputValue.trim().length >= 2 && filteredCids.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
      />
      {showSuggestions && filteredCids.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredCids.map((cid) => (
            <div
              key={cid.id}
              onClick={() => handleSelect(cid)}
              className="p-3 hover:bg-slate-100 cursor-pointer border-b last:border-b-0"
            >
              <div className="font-semibold text-sm text-slate-900">{cid.subcategoria}</div>
              <div className="text-xs text-slate-600">{cid.descricao}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}