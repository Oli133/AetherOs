import React, { useState, useEffect } from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { sounds } from '../os/sound';

export default function CalculatorApp() {
  const [display, setDisplay] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<'standard' | 'scientific'>('standard');

  const handleDigit = (digit: string) => {
    sounds.playClick();
    setDisplay((prev) => (prev === '0' ? digit : prev + digit));
  };

  const handleOperator = (op: string) => {
    sounds.playClick();
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    sounds.playClick();
    try {
      const fullExpr = equation + display;
      // Sanitize expression
      const sanitized = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E');

      // Safe evaluate
      const res = new Function(`return (${sanitized})`)();
      const formatted = Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(8)).toString();

      setHistory((prev) => [`${fullExpr} = ${formatted}`, ...prev.slice(0, 10)]);
      setDisplay(formatted);
      setEquation('');
      sounds.playSuccess();
    } catch {
      setDisplay('Error');
      sounds.playBell();
    }
  };

  const clear = () => {
    sounds.playClick();
    setDisplay('0');
    setEquation('');
  };

  const backspace = () => {
    sounds.playClick();
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleScientific = (func: string) => {
    sounds.playClick();
    try {
      const val = parseFloat(display);
      let res = 0;
      switch (func) {
        case 'sin':
          res = Math.sin((val * Math.PI) / 180);
          break;
        case 'cos':
          res = Math.cos((val * Math.PI) / 180);
          break;
        case 'tan':
          res = Math.tan((val * Math.PI) / 180);
          break;
        case 'sqrt':
          res = Math.sqrt(val);
          break;
        case 'log':
          res = Math.log10(val);
          break;
        case 'sq':
          res = Math.pow(val, 2);
          break;
        case 'pi':
          res = Math.PI;
          break;
        default:
          return;
      }
      const formatted = parseFloat(res.toFixed(8)).toString();
      setHistory((prev) => [`${func}(${val}) = ${formatted}`, ...prev.slice(0, 10)]);
      setDisplay(formatted);
    } catch {
      setDisplay('Error');
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === '.') handleDigit('.');
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('-');
      else if (e.key === '*') handleOperator('×');
      else if (e.key === '/') handleOperator('÷');
      else if (e.key === 'Enter' || e.key === '=') calculate();
      else if (e.key === 'Backspace') backspace();
      else if (e.key === 'Escape') clear();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans p-3 text-xs select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setMode('standard')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              mode === 'standard' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setMode('scientific')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              mode === 'scientific' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Scientific
          </button>
        </div>

        <button
          onClick={clear}
          className="text-slate-400 hover:text-rose-400 p-1"
          title="Clear Calculator"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Screen display */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-3 text-right flex flex-col justify-end min-h-[64px]">
        <div className="text-[11px] text-slate-500 font-mono h-4 truncate">{equation}</div>
        <div className="text-2xl font-bold font-mono tracking-tight text-white truncate tabular-nums">
          {display}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {mode === 'scientific' && (
          <>
            <button
              onClick={() => handleScientific('sin')}
              className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg font-mono text-[11px] text-sky-400"
            >
              sin
            </button>
            <button
              onClick={() => handleScientific('cos')}
              className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg font-mono text-[11px] text-sky-400"
            >
              cos
            </button>
            <button
              onClick={() => handleScientific('tan')}
              className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg font-mono text-[11px] text-sky-400"
            >
              tan
            </button>
            <button
              onClick={() => handleScientific('sqrt')}
              className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg font-mono text-[11px] text-sky-400"
            >
              √x
            </button>
          </>
        )}

        <button onClick={clear} className="p-2.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-semibold rounded-lg">
          C
        </button>
        <button onClick={backspace} className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg flex items-center justify-center">
          <Delete className="w-4 h-4" />
        </button>
        <button onClick={() => handleOperator('%')} className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg">
          %
        </button>
        <button onClick={() => handleOperator('÷')} className="p-2.5 bg-sky-950/60 hover:bg-sky-900/60 text-sky-400 font-semibold rounded-lg">
          ÷
        </button>

        {['7', '8', '9'].map((n) => (
          <button key={n} onClick={() => handleDigit(n)} className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-medium rounded-lg text-sm">
            {n}
          </button>
        ))}
        <button onClick={() => handleOperator('×')} className="p-2.5 bg-sky-950/60 hover:bg-sky-900/60 text-sky-400 font-semibold rounded-lg">
          ×
        </button>

        {['4', '5', '6'].map((n) => (
          <button key={n} onClick={() => handleDigit(n)} className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-medium rounded-lg text-sm">
            {n}
          </button>
        ))}
        <button onClick={() => handleOperator('-')} className="p-2.5 bg-sky-950/60 hover:bg-sky-900/60 text-sky-400 font-semibold rounded-lg">
          -
        </button>

        {['1', '2', '3'].map((n) => (
          <button key={n} onClick={() => handleDigit(n)} className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-medium rounded-lg text-sm">
            {n}
          </button>
        ))}
        <button onClick={() => handleOperator('+')} className="p-2.5 bg-sky-950/60 hover:bg-sky-900/60 text-sky-400 font-semibold rounded-lg">
          +
        </button>

        <button onClick={() => handleDigit('0')} className="col-span-2 p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-medium rounded-lg text-sm">
          0
        </button>
        <button onClick={() => handleDigit('.')} className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-medium rounded-lg text-sm">
          .
        </button>
        <button onClick={calculate} className="p-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-sm shadow-sm">
          =
        </button>
      </div>

      {/* Mini history tape */}
      {history.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex justify-between">
          <span className="truncate max-w-[200px]">Last: {history[0]}</span>
          <span>{history.length} operations</span>
        </div>
      )}
    </div>
  );
}
