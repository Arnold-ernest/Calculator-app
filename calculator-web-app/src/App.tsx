/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as math from 'mathjs';
import { 
  Delete, 
  Divide, 
  Minus, 
  Plus, 
  X, 
  Equal, 
  RotateCcw,
  Percent,
  Calculator,
  Beaker,
  LineChart,
  Binary,
  ChevronRight,
  History,
  Settings,
  Info
} from 'lucide-react';

type Mode = 'basic' | 'scientific' | 'graphing' | 'programmer';

export default function App() {
  const [mode, setMode] = useState<Mode>('scientific');
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<{expr: string, res: string}[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Graphing State
  const [graphFunction, setGraphFunction] = useState('sin(x)');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Programmer State
  const [progBase, setProgBase] = useState<10 | 16 | 2 | 8>(10);

  const evaluate = useCallback(async () => {
    try {
      const result = math.evaluate(expression || display);
      const resStr = String(result);
      const newEntry = { expr: expression || display, res: resStr };
      
      setHistory(prev => [newEntry, ...prev].slice(0, 10));
      
      // Sync with backend
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEntry)
        });
      } catch (e) {
        console.error('Failed to sync history with backend');
      }

      setDisplay(resStr);
      setExpression('');
    } catch (error) {
      setDisplay('Error');
    }
  }, [display, expression]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/history');
        const data = await response.json();
        if (data.length > 0) {
          setHistory(data.map((item: any) => ({ expr: item.expr, res: item.res })));
        }
      } catch (e) {
        console.error('Failed to fetch history from backend');
      }
    };
    fetchHistory();
  }, []);

  const appendToDisplay = (val: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const clear = () => {
    setDisplay('0');
    setExpression('');
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  // --- Graphing Logic ---
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i <= height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Draw Axes
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Plot Function
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const scale = 40; // pixels per unit
    let first = true;

    try {
      const compiled = math.compile(graphFunction);
      for (let px = 0; px <= width; px++) {
        const x = (px - width / 2) / scale;
        const y = compiled.evaluate({ x });
        const py = height / 2 - y * scale;

        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    } catch (e) {
      // Invalid function
    }
  }, [graphFunction]);

  useEffect(() => {
    if (mode === 'graphing') {
      drawGraph();
    }
  }, [mode, drawGraph]);

  // --- Components ---

  const NavButton = ({ m, icon: Icon, label }: { m: Mode, icon: any, label: string }) => (
    <button
      onClick={() => setMode(m)}
      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${
        mode === m ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-800'
      }`}
    >
      <Icon size={20} />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );

  const CalcButton = ({ 
    children, 
    onClick, 
    variant = 'default',
    className = ''
  }: { 
    children: ReactNode, 
    onClick: () => void, 
    variant?: 'default' | 'op' | 'action' | 'equal' | 'sci',
    className?: string
  }) => {
    const variants = {
      default: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
      op: 'bg-zinc-700 text-indigo-400 hover:bg-zinc-600',
      action: 'bg-zinc-800 text-orange-400 hover:bg-zinc-700',
      equal: 'bg-indigo-600 text-white hover:bg-indigo-500',
      sci: 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 text-sm'
    };

    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`h-14 rounded-xl font-medium flex items-center justify-center transition-colors shadow-sm ${variants[variant]} ${className}`}
      >
        {children}
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-0 sm:p-4 selection:bg-indigo-500/30 overflow-hidden">
      <div className="w-full h-full sm:h-auto sm:max-w-lg bg-zinc-900 sm:rounded-[2.5rem] shadow-2xl border-0 sm:border sm:border-zinc-800/50 overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Navigation - Sidebar on Desktop, Bottom Bar on Mobile */}
        <div className="order-2 md:order-1 w-full md:w-20 bg-zinc-900/80 backdrop-blur-md border-t md:border-t-0 md:border-r border-zinc-800 p-2 sm:p-4 flex md:flex-col justify-around md:justify-start gap-2 sm:gap-4 z-40">
          <NavButton m="basic" icon={Calculator} label="Basic" />
          <NavButton m="scientific" icon={Beaker} label="Sci" />
          <NavButton m="graphing" icon={LineChart} label="Graph" />
          <NavButton m="programmer" icon={Binary} label="Prog" />
          <div className="mt-auto hidden md:flex flex-col gap-4">
            <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
              <History size={20} />
            </button>
            <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="order-1 md:order-2 flex-1 flex flex-col p-4 sm:p-6 h-full overflow-y-auto">
          
          {/* Header for Mobile */}
          <div className="flex md:hidden justify-between items-center mb-4">
            <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">OmniCalc Pro</h1>
            <div className="flex gap-2">
              <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                <History size={18} />
              </button>
            </div>
          </div>

          {/* Display Area */}
          <div className="mb-4 sm:mb-6 px-4 py-6 sm:py-8 bg-zinc-950/50 rounded-2xl sm:rounded-3xl border border-zinc-800/30 flex flex-col items-end justify-center min-h-[120px] sm:min-h-[140px] shrink-0">
            <AnimatePresence mode="wait">
              <motion.div 
                key={expression}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 0.5, y: 0 }}
                className="text-xs sm:text-sm font-mono text-zinc-400 mb-1 h-5"
              >
                {expression}
              </motion.div>
            </AnimatePresence>
            <motion.div 
              key={display}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl sm:text-5xl font-mono font-light tracking-tighter truncate w-full text-right"
            >
              {display}
            </motion.div>
          </div>

          {/* Mode Views */}
          <div className="flex-1 flex flex-col">
            {mode === 'scientific' && (
              <div className="flex flex-col h-full">
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-2">
                  <CalcButton variant="sci" onClick={() => appendToDisplay('sin(')}>sin</CalcButton>
                  <CalcButton variant="sci" onClick={() => appendToDisplay('cos(')}>cos</CalcButton>
                  <CalcButton variant="sci" onClick={() => appendToDisplay('tan(')}>tan</CalcButton>
                  <CalcButton variant="sci" onClick={() => appendToDisplay('pi')}>π</CalcButton>
                  <CalcButton variant="sci" onClick={() => appendToDisplay('e')}>e</CalcButton>
                  <CalcButton variant="sci" onClick={() => appendToDisplay('log(')}>log</CalcButton>
                  <CalcButton variant="sci" onClick={() => appendToDisplay('ln(')}>ln</CalcButton>
                  <CalcButton variant="sci" onClick={() => appendToDisplay('sqrt(')}>√</CalcButton>
                  <CalcButton variant="sci" onClick={() => appendToDisplay('^')}>^</CalcButton>
                  <CalcButton variant="sci" onClick={() => appendToDisplay('!')}>!</CalcButton>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 flex-1">
                  <CalcButton variant="action" onClick={clear}>AC</CalcButton>
                  <CalcButton variant="action" onClick={backspace}><Delete size={20} /></CalcButton>
                  <CalcButton variant="op" onClick={() => appendToDisplay('(')}>(</CalcButton>
                  <CalcButton variant="op" onClick={() => appendToDisplay(')')}>)</CalcButton>

                  <CalcButton onClick={() => appendToDisplay('7')}>7</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('8')}>8</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('9')}>9</CalcButton>
                  <CalcButton variant="op" onClick={() => appendToDisplay('/')}><Divide size={20} /></CalcButton>

                  <CalcButton onClick={() => appendToDisplay('4')}>4</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('5')}>5</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('6')}>6</CalcButton>
                  <CalcButton variant="op" onClick={() => appendToDisplay('*')}><X size={20} /></CalcButton>

                  <CalcButton onClick={() => appendToDisplay('1')}>1</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('2')}>2</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('3')}>3</CalcButton>
                  <CalcButton variant="op" onClick={() => appendToDisplay('-')}><Minus size={20} /></CalcButton>

                  <CalcButton onClick={() => appendToDisplay('0')}>0</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('.')}>.</CalcButton>
                  <CalcButton variant="equal" onClick={evaluate} className="col-span-2"><Equal size={24} /></CalcButton>
                </div>
              </div>
            )}

            {mode === 'basic' && (
              <div className="grid grid-cols-4 gap-2 sm:gap-3 h-full">
                <CalcButton variant="action" onClick={clear} className="col-span-2">CLEAR</CalcButton>
                <CalcButton variant="action" onClick={backspace}><Delete size={20} /></CalcButton>
                <CalcButton variant="op" onClick={() => appendToDisplay('/')}><Divide size={20} /></CalcButton>

                <CalcButton onClick={() => appendToDisplay('7')}>7</CalcButton>
                <CalcButton onClick={() => appendToDisplay('8')}>8</CalcButton>
                <CalcButton onClick={() => appendToDisplay('9')}>9</CalcButton>
                <CalcButton variant="op" onClick={() => appendToDisplay('*')}><X size={20} /></CalcButton>

                <CalcButton onClick={() => appendToDisplay('4')}>4</CalcButton>
                <CalcButton onClick={() => appendToDisplay('5')}>5</CalcButton>
                <CalcButton onClick={() => appendToDisplay('6')}>6</CalcButton>
                <CalcButton variant="op" onClick={() => appendToDisplay('-')}><Minus size={20} /></CalcButton>

                <CalcButton onClick={() => appendToDisplay('1')}>1</CalcButton>
                <CalcButton onClick={() => appendToDisplay('2')}>2</CalcButton>
                <CalcButton onClick={() => appendToDisplay('3')}>3</CalcButton>
                <CalcButton variant="op" onClick={() => appendToDisplay('+')}><Plus size={20} /></CalcButton>

                <CalcButton onClick={() => appendToDisplay('0')} className="col-span-2">0</CalcButton>
                <CalcButton onClick={() => appendToDisplay('.')}>.</CalcButton>
                <CalcButton variant="equal" onClick={evaluate}><Equal size={24} /></CalcButton>
              </div>
            )}

            {mode === 'graphing' && (
              <div className="flex flex-col gap-3 sm:gap-4 h-full">
                <div className="flex gap-2">
                  <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 flex items-center gap-2">
                    <span className="text-indigo-400 font-mono italic text-sm">f(x)=</span>
                    <input 
                      value={graphFunction}
                      onChange={(e) => setGraphFunction(e.target.value)}
                      className="bg-transparent outline-none w-full font-mono text-zinc-100 text-sm"
                      placeholder="sin(x)"
                    />
                  </div>
                  <button onClick={drawGraph} className="bg-indigo-600 p-2.5 sm:p-3 rounded-xl hover:bg-indigo-500 transition-colors">
                    <RotateCcw size={18} />
                  </button>
                </div>
                <div className="flex-1 bg-zinc-950 rounded-xl sm:rounded-2xl border border-zinc-800 overflow-hidden relative min-h-[200px]">
                  <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={300} 
                    className="w-full h-full cursor-crosshair"
                  />
                  <div className="absolute bottom-2 right-2 text-[8px] sm:text-[10px] font-mono text-zinc-600 bg-zinc-950/80 px-2 py-1 rounded">
                    GRID: 1 UNIT = 40PX
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <CalcButton variant="sci" onClick={() => setGraphFunction('sin(x)')}>sin(x)</CalcButton>
                  <CalcButton variant="sci" onClick={() => setGraphFunction('cos(x)')}>cos(x)</CalcButton>
                  <CalcButton variant="sci" onClick={() => setGraphFunction('x^2')}>x²</CalcButton>
                  <CalcButton variant="sci" onClick={() => setGraphFunction('abs(x)')}>|x|</CalcButton>
                  <CalcButton variant="sci" onClick={() => setGraphFunction('log(x)')}>log(x)</CalcButton>
                  <CalcButton variant="sci" onClick={() => setGraphFunction('tan(x)')}>tan(x)</CalcButton>
                </div>
              </div>
            )}

            {mode === 'programmer' && (
              <div className="flex flex-col gap-3 sm:gap-4 h-full">
                <div className="grid grid-cols-1 gap-1.5 sm:gap-2 bg-zinc-950 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-800">
                  <div className={`flex justify-between items-center p-1.5 sm:p-2 rounded-lg ${progBase === 16 ? 'bg-indigo-500/10 border border-indigo-500/30' : ''}`} onClick={() => setProgBase(16)}>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">HEX</span>
                    <span className="font-mono text-sm sm:text-base text-indigo-400">{parseInt(display || '0').toString(16).toUpperCase()}</span>
                  </div>
                  <div className={`flex justify-between items-center p-1.5 sm:p-2 rounded-lg ${progBase === 10 ? 'bg-indigo-500/10 border border-indigo-500/30' : ''}`} onClick={() => setProgBase(10)}>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">DEC</span>
                    <span className="font-mono text-sm sm:text-base text-zinc-100">{parseInt(display || '0').toString(10)}</span>
                  </div>
                  <div className={`flex justify-between items-center p-1.5 sm:p-2 rounded-lg ${progBase === 8 ? 'bg-indigo-500/10 border border-indigo-500/30' : ''}`} onClick={() => setProgBase(8)}>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">OCT</span>
                    <span className="font-mono text-sm sm:text-base text-zinc-100">{parseInt(display || '0').toString(8)}</span>
                  </div>
                  <div className={`flex justify-between items-center p-1.5 sm:p-2 rounded-lg ${progBase === 2 ? 'bg-indigo-500/10 border border-indigo-500/30' : ''}`} onClick={() => setProgBase(2)}>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">BIN</span>
                    <span className="font-mono text-[10px] sm:text-xs break-all text-right text-zinc-100">{parseInt(display || '0').toString(2).padStart(8, '0')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 flex-1">
                  <CalcButton variant="sci" onClick={() => appendToDisplay(' & ')}>AND</CalcButton>
                  <CalcButton variant="sci" onClick={() => appendToDisplay(' | ')}>OR</CalcButton>
                  <CalcButton variant="sci" onClick={() => appendToDisplay(' ^ ')}>XOR</CalcButton>
                  <CalcButton variant="sci" onClick={() => appendToDisplay(' ~ ')}>NOT</CalcButton>
                  
                  <CalcButton onClick={() => appendToDisplay('A')} className={progBase < 16 ? 'opacity-20 pointer-events-none' : ''}>A</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('B')} className={progBase < 16 ? 'opacity-20 pointer-events-none' : ''}>B</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('C')} className={progBase < 16 ? 'opacity-20 pointer-events-none' : ''}>C</CalcButton>
                  <CalcButton variant="op" onClick={() => appendToDisplay(' << ')}>LSH</CalcButton>

                  <CalcButton onClick={() => appendToDisplay('D')} className={progBase < 16 ? 'opacity-20 pointer-events-none' : ''}>D</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('E')} className={progBase < 16 ? 'opacity-20 pointer-events-none' : ''}>E</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('F')} className={progBase < 16 ? 'opacity-20 pointer-events-none' : ''}>F</CalcButton>
                  <CalcButton variant="op" onClick={() => appendToDisplay(' >> ')}>RSH</CalcButton>

                  <CalcButton onClick={() => appendToDisplay('7')}>7</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('8')}>8</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('9')}>9</CalcButton>
                  <CalcButton variant="action" onClick={clear}>AC</CalcButton>

                  <CalcButton onClick={() => appendToDisplay('4')}>4</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('5')}>5</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('6')}>6</CalcButton>
                  <CalcButton variant="action" onClick={backspace}><Delete size={20} /></CalcButton>

                  <CalcButton onClick={() => appendToDisplay('1')}>1</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('2')}>2</CalcButton>
                  <CalcButton onClick={() => appendToDisplay('3')}>3</CalcButton>
                  <CalcButton variant="equal" onClick={evaluate}><Equal size={24} /></CalcButton>
                </div>
              </div>
            )}
          </div>

          {/* History Overlay */}
          <AnimatePresence>
            {isHistoryOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsHistoryOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                />
                <motion.div
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 300 }}
                  className="absolute inset-y-0 right-0 w-full md:w-64 bg-zinc-900 border-l border-zinc-800 p-6 z-50 shadow-2xl flex flex-col"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">History</h3>
                    <button onClick={() => setIsHistoryOpen(false)} className="text-zinc-500 hover:text-white p-2">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {history.length === 0 ? (
                      <div className="text-center py-10 text-zinc-600 italic text-sm">No history yet</div>
                    ) : (
                      history.map((item, i) => (
                        <div key={i} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/50">
                          <div className="text-[10px] font-mono text-zinc-500 mb-1">{item.expr}</div>
                          <div className="text-lg font-mono text-indigo-400 text-right">{item.res}</div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Footer Info - Hidden on very small screens */}
      <div className="hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 items-center gap-4 text-zinc-600 text-[10px] font-mono tracking-widest uppercase">
        <div className="flex items-center gap-1">
          <Info size={12} />
          <span>OmniCalc Pro v2.0</span>
        </div>
        <span>&bull;</span>
        <span>Math.js Engine</span>
        <span>&bull;</span>
        <span>Vector Graphics</span>
      </div>
    </div>
  );

}
