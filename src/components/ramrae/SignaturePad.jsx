import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';

export default function SignaturePad({ open, onOpenChange, onSave, title = "Assinatura" }) {
  const sigCanvas = useRef(null);

  const handleClear = () => {
    sigCanvas.current.clear();
  };

  const handleSave = () => {
    if (sigCanvas.current.isEmpty()) {
      alert('Por favor, assine antes de salvar.');
      return;
    }
    const dataURL = sigCanvas.current.toDataURL('image/png');
    onSave(dataURL);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="border-2 border-slate-300 rounded-lg bg-white">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              width: 600,
              height: 200,
              className: 'signature-canvas w-full'
            }}
            backgroundColor="white"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClear}>
            <Eraser className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button onClick={handleSave} className="bg-red-700 hover:bg-red-800">
            <Check className="w-4 h-4 mr-2" />
            Confirmar Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}