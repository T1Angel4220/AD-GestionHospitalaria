import React, { useState } from 'react';
import { useValidation } from '../hooks/useValidation';

export const SpaceTest = () => {
  const { sanitizeText, sanitizeName } = useValidation();
  const [textInput, setTextInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const handleTextChange = (value: string) => {
    const sanitized = sanitizeText(value);
    setTextInput(sanitized);
  };

  const handleNameChange = (value: string) => {
    const sanitized = sanitizeName(value);
    setNameInput(sanitized);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-bold mb-4">Prueba de Espacios</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Texto Libre (motivo, diagnóstico, tratamiento):
          </label>
          <textarea
            value={textInput}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Prueba escribir con espacios al inicio y final..."
            className="w-full p-2 border rounded"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Valor actual: "{textInput}" (longitud: {textInput.length})
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Nombre (nombres, apellidos):
          </label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Prueba escribir con espacios al inicio y final..."
            className="w-full p-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Valor actual: "{nameInput}" (longitud: {nameInput.length})
          </p>
        </div>
      </div>
    </div>
  );
};
