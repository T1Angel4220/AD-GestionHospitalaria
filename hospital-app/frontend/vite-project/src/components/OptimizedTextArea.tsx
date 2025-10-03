import React, { memo, useCallback } from 'react';

interface OptimizedTextAreaProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows: number;
  disabled?: boolean;
  className?: string;
}

export const OptimizedTextArea = memo<OptimizedTextAreaProps>(({
  id,
  value,
  onChange,
  placeholder,
  rows,
  disabled = false,
  className = ''
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <textarea
      id={id}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={className}
    />
  );
});

OptimizedTextArea.displayName = 'OptimizedTextArea';
