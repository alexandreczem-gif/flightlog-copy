import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function CIDCombobox({ value, onChange, disabled = false }) {
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [cids, setCids] = useState([]);
    const [filteredCids, setFilteredCids] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const loadCids = async () => {
            try {
                const data = await base44.entities.CID.list('descricao', 20000);
                setCids(data);
            } catch (error) {
                console.error("Erro ao carregar CIDs:", error);
            }
        };
        loadCids();
    }, []);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        if (searchTerm && searchTerm.length >= 2) {
            const filtered = cids.filter(cid =>
                cid.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cid.categoria.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 10);
            setFilteredCids(filtered);
        } else {
            setFilteredCids([]);
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

    const handleSelect = (cid) => {
        const fullText = `${cid.categoria} - ${cid.descricao}`;
        setSearchTerm(fullText);
        onChange(fullText);
        setShowSuggestions(false);
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        onChange(newValue);
        setShowSuggestions(true);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <Input
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                disabled={disabled}
                placeholder="Digite para buscar CID..."
                className={disabled ? 'bg-slate-100' : ''}
            />
            {showSuggestions && filteredCids.length > 0 && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCids.map((cid) => (
                        <div
                            key={cid.id}
                            onClick={() => handleSelect(cid)}
                            className="px-4 py-2 hover:bg-slate-100 cursor-pointer border-b last:border-b-0"
                        >
                            <div className="font-semibold text-sm text-slate-900">{cid.categoria}</div>
                            <div className="text-xs text-slate-600">{cid.descricao}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}