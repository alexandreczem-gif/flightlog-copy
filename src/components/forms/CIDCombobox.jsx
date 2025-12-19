import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function CIDCombobox({ value, onChange, disabled, className }) {
    const [cids, setCids] = useState([]);
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [filteredCids, setFilteredCids] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const loadCids = async () => {
            try {
                const data = await base44.entities.CID.list('categoria', 1000);
                setCids(data);
            } catch (error) {
                console.error('Erro ao carregar CIDs:', error);
            }
        };
        loadCids();
    }, []);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        if (searchTerm.length >= 2) {
            const filtered = cids.filter(cid => 
                cid.categoria.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCids(filtered.slice(0, 10));
            setShowSuggestions(filtered.length > 0);
        } else {
            setFilteredCids([]);
            setShowSuggestions(false);
        }
    }, [searchTerm, cids]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (categoria) => {
        setSearchTerm(categoria);
        onChange(categoria);
        setShowSuggestions(false);
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        onChange(newValue);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <Input
                value={searchTerm}
                onChange={handleInputChange}
                disabled={disabled}
                placeholder="Digite para buscar CID..."
                className={className}
            />
            {showSuggestions && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCids.map((cid, idx) => (
                        <div
                            key={cid.id || idx}
                            onClick={() => handleSelect(cid.categoria)}
                            className="px-3 py-2 cursor-pointer hover:bg-slate-100 text-sm"
                        >
                            {cid.categoria}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}