/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Delete, 
  Divide, 
  Minus, 
  Plus, 
  X, 
  Equal, 
  RotateCcw,
  Percent
} from 'lucide-react';

type Operator = '+' | '-' | '*' | '/' | null;

export default function App() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const calculate = useCallback((first: number, second: number, op: Operator): number => {
    switch (op) {
      case '+': return first + second;
      case '-': return first - second;
      case '*': return first * second;
      case '/': return second !== 0 ? first / second : 0;
      default: return second;
    }
  }, []);

  const handleNumber = (num: string) => {
    if (display === '0' || shouldResetDisplay) {
      setDisplay(num);
      setShouldResetDisplay(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (nextOperator: Operator) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(display);
    } else if (operator) {
      const result = calculate(parseFloat(previousValue), inputValue, operator);
      setDisplay(String(result));
      setPreviousValue(String(result));
    }

    setShouldResetDisplay(true);
    setOperator(nextOperator);
  };

  const handleEqual = () => {
    if (!operator || previousValue === null) return;

    const current = parseFloat(display);
    const previous = parseFloat(previousValue);
    const result = calculate(previous, current, operator);

    const calculationString = `${previous} ${operator} ${current} = ${result}`;
    setHistory(prev => [calculationString, ...prev].slice(0, 5));

    setDisplay(String(result));
    setPreviousValue(null);
    setOperator(null);
    setShouldResetDisplay(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setShouldResetDisplay(false);
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleDecimal = () => {
    if (shouldResetDisplay) {
      setDisplay('0.');
      setShouldResetDisplay(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handlePercent = () => {
    const current = parseFloat(display);
    setDisplay(String(current / 100));
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key } = event;
    if (/[0-9]/.test(key)) handleNumber(key);
    if (key === '.') handleDecimal();
    if (key === '+') handleOperator('+');
    if (key === '-') handleOperator('-');
    if (key === '*') handleOperator('*');
    if (key === '/') handleOperator('/');
    if (key === 'Enter' || key === '=') handleEqual();
    if (key === 'Escape') handleClear();
    if (key === 'Backspace') handleDelete();
  }, [display, operator, previousValue, shouldResetDisplay, calculate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const Button = ({ 
    children, 
    onClick, 
    className = '', 
    variant = 'default' 
  }: { 
    children: ReactNode; 
    onClick: () => void; 
    className?: string;
    variant?: 'default' | 'operator' | 'action' | 'equal';
  }) => {
    const variants = {
      default: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
      operator: 'bg-orange-500 hover:bg-orange-400 text-white',
      action: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100',
      equal: 'bg-indigo-600 hover:bg-indigo-500 text-white col-span-1',
    };

    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className={`h-16 md:h-20 rounded-2xl text-xl font-medium transition-colors flex items-center justify-center shadow-lg ${variants[variant]} ${className}`}
      >
        {children}
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-md">
        {/* History Preview */}
        <div className="mb-4 px-4 h-20 flex flex-col justify-end items-end overflow-hidden">
          <AnimatePresence mode="popLayout">
            {history.map((item, i) => (
              <motion.div
                key={item + i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.4 - (i * 0.08), y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="text-zinc-400 text-sm font-mono"
              >
                {item}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Calculator Body */}
        <div className="bg-zinc-900 p-6 rounded-[2.5rem] shadow-2xl border border-zinc-800/50 backdrop-blur-xl">
          {/* Display */}
          <div className="mb-8 px-4 py-8 bg-zinc-950/50 rounded-3xl border border-zinc-800/30 flex flex-col items-end justify-center overflow-hidden">
            <div className="text-zinc-500 text-sm font-mono mb-1 h-5">
              {previousValue} {operator}
            </div>
            <motion.div 
              key={display}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl md:text-6xl font-mono font-light text-white tracking-tighter truncate w-full text-right"
            >
              {display}
            </motion.div>
          </div>

          {/* Buttons Grid */}
          <div className="grid grid-cols-4 gap-3 md:gap-4">
            <Button onClick={handleClear} variant="action">
              <RotateCcw size={24} />
            </Button>
            <Button onClick={handleDelete} variant="action">
              <Delete size={24} />
            </Button>
            <Button onClick={handlePercent} variant="action">
              <Percent size={24} />
            </Button>
            <Button onClick={() => handleOperator('/')} variant="operator">
              <Divide size={24} />
            </Button>

            <Button onClick={() => handleNumber('7')}>7</Button>
            <Button onClick={() => handleNumber('8')}>8</Button>
            <Button onClick={() => handleNumber('9')}>9</Button>
            <Button onClick={() => handleOperator('*')} variant="operator">
              <X size={24} />
            </Button>

            <Button onClick={() => handleNumber('4')}>4</Button>
            <Button onClick={() => handleNumber('5')}>5</Button>
            <Button onClick={() => handleNumber('6')}>6</Button>
            <Button onClick={() => handleOperator('-')} variant="operator">
              <Minus size={24} />
            </Button>

            <Button onClick={() => handleNumber('1')}>1</Button>
            <Button onClick={() => handleNumber('2')}>2</Button>
            <Button onClick={() => handleNumber('3')}>3</Button>
            <Button onClick={() => handleOperator('+')} variant="operator">
              <Plus size={24} />
            </Button>

            <Button onClick={() => handleNumber('0')} className="col-span-1">0</Button>
            <Button onClick={handleDecimal}>.</Button>
            <Button onClick={handleEqual} variant="equal" className="col-span-2 bg-indigo-600 hover:bg-indigo-500">
              <Equal size={28} />
            </Button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-zinc-600 text-xs font-mono tracking-widest uppercase">
            Precision Engineering &bull; v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
