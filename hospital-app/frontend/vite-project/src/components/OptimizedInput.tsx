import React, { memo, useCallback } from 'react';

interface OptimizedInputProps {
  id: string;
  type: string;
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const OptimizedInput = memo<OptimizedInputProps>(({
  id,
  type,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  required = false,
  disabled = false,
  className = ''
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      onChange(parseInt(e.target.value) || 0);
    } else {
      onChange(e.target.value);
    }
  }, [onChange, type]);

  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      required={required}
      disabled={disabled}
      className={className}
    />
  );
});

OptimizedInput.displayName = 'OptimizedInput';
