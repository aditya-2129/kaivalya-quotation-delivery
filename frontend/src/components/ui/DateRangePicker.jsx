import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval, 
  isWithinInterval,
  isBefore,
  isAfter,
  startOfToday,
  subDays,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subWeeks,
  subYears
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { THEME } from '@/constants/ui';

const PRESETS = [
  { label: 'This week', getRange: () => ({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: 'This month', getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: 'This quarter', getRange: () => ({ start: startOfQuarter(new Date()), end: endOfQuarter(new Date()) }) },
  { 
    label: 'Financial Year (India)', 
    getRange: () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const isPostApril = now.getMonth() >= 3; // April is month 3
      const startYear = isPostApril ? currentYear : currentYear - 1;
      return { start: new Date(startYear, 3, 1), end: new Date(startYear + 1, 2, 31, 23, 59, 59) };
    } 
  },
  { label: 'This year', getRange: () => ({ start: startOfYear(new Date()), end: endOfYear(new Date()) }) },
  { label: 'Last week', getRange: () => ({ start: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), end: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }) }) },
  { label: 'Last month', getRange: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Last quarter', getRange: () => ({ start: startOfQuarter(subMonths(new Date(), 3)), end: endOfQuarter(subMonths(new Date(), 3)) }) },
  { label: 'Last year', getRange: () => ({ start: startOfYear(subYears(new Date(), 1)), end: endOfYear(subYears(new Date(), 1)) }) },
  { label: 'Last 30 days', getRange: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: 'Last 90 days', getRange: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
  { label: 'Last 365 days', getRange: () => ({ start: subDays(new Date(), 365), end: new Date() }) },
  { label: 'All time', getRange: () => ({ start: new Date(2020, 0, 1), end: new Date() }) },
];

export default function DateRangePicker({ value, onChange, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(value?.start || new Date()));
  const [selection, setSelection] = useState({ 
    start: value?.start || null, 
    end: value?.end || null,
    hover: null 
  });

  const nextMonth = addMonths(currentMonth, 1);

  const handleDayClick = (day) => {
    if (!selection.start || (selection.start && selection.end)) {
      setSelection({ start: day, end: null, hover: null });
    } else {
      if (isBefore(day, selection.start)) {
        setSelection({ start: day, end: selection.start, hover: null });
      } else {
        setSelection({ ...selection, end: day, hover: null });
      }
    }
  };

  const handlePresetClick = (preset) => {
    const range = preset.getRange();
    setSelection({ start: range.start, end: range.end, hover: null });
    setCurrentMonth(startOfMonth(range.start));
  };

  const isSelected = (day) => {
    if (selection.start && isSameDay(day, selection.start)) return true;
    if (selection.end && isSameDay(day, selection.end)) return true;
    return false;
  };

  const isInRange = (day) => {
    if (selection.start && selection.end) {
      return isWithinInterval(day, { start: selection.start, end: selection.end });
    }
    if (selection.start && selection.hover) {
      const start = isBefore(selection.hover, selection.start) ? selection.hover : selection.start;
      const end = isBefore(selection.hover, selection.start) ? selection.start : selection.hover;
      return isWithinInterval(day, { start, end });
    }
    return false;
  };

  const renderCalendar = (month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-[12px] font-black text-zinc-900 uppercase tracking-widest">
            {format(month, 'MMMM yyyy')}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-px">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
            <div key={d} className="h-7 w-7 flex items-center justify-center text-[9px] font-bold text-zinc-400 uppercase">
              {d}
            </div>
          ))}
          {days.map((day, idx) => {
            const sameMonth = isSameMonth(day, monthStart);
            const selected = isSelected(day);
            const inRange = isInRange(day);
            const isToday = isSameDay(day, startOfToday());

            return (
              <div 
                key={idx}
                onClick={() => sameMonth && handleDayClick(day)}
                onMouseEnter={() => sameMonth && selection.start && !selection.end && setSelection(s => ({ ...s, hover: day }))}
                className={`
                  relative h-8 w-9 flex items-center justify-center text-[11px] cursor-pointer transition-all
                  ${!sameMonth ? 'text-zinc-200 cursor-default pointer-events-none' : 'text-zinc-600 hover:bg-zinc-100'}
                  ${selected ? 'bg-brand-primary text-white font-black z-10 rounded-md' : ''}
                  ${inRange && !selected ? 'bg-brand-primary/10 text-brand-primary' : ''}
                  ${isToday && !selected ? 'text-brand-primary font-black underline underline-offset-4 decoration-2' : ''}
                `}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-[760px] bg-white rounded-[20px] shadow-2xl overflow-hidden border border-zinc-200 animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex h-[400px]">
          {/* Sidebar Presets */}
          <div className="w-[180px] border-r border-zinc-100 overflow-y-auto bg-zinc-50/50 p-3 flex flex-col gap-0.5">
            <h3 className="px-2 mb-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Date Range</h3>
            {PRESETS.map(p => {
              const range = p.getRange();
              const active = selection.start && selection.end && 
                             isSameDay(range.start, selection.start) && 
                             isSameDay(range.end, selection.end);
              return (
                <button
                  key={p.label}
                  onClick={() => handlePresetClick(p)}
                  className={`
                    w-full flex flex-col px-2 py-2 rounded-lg text-left transition-all
                    ${active ? 'bg-white shadow-sm border border-brand-primary/20' : 'hover:bg-zinc-100/80'}
                  `}
                >
                  <span className={`text-[12px] font-bold ${active ? 'text-brand-primary' : 'text-zinc-600'}`}>{p.label}</span>
                  <span className="text-[9px] text-zinc-400 font-medium whitespace-nowrap">
                    {format(range.start, 'd MMM')} - {format(range.end, 'd MMM, yy')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Calendars */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-900 tracking-tight leading-none">Manual Interface</h2>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Selection Bounds</p>
                  </div>
               </div>
               <div className="flex items-center gap-1.5">
                 <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-400 transition">
                   <ChevronLeft className="h-4 w-4" />
                 </button>
                 <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-400 transition">
                   <ChevronRight className="h-4 w-4" />
                 </button>
               </div>
            </div>

            <div className="flex gap-8 justify-center">
              {renderCalendar(currentMonth)}
              {renderCalendar(nextMonth)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 border-t border-zinc-100 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 px-2">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Active Range</span>
                <span className="text-[13px] font-bold text-zinc-950">
                  {selection.start ? format(selection.start, 'MMM d, yyyy') : 'No start date'} 
                  {selection.end && ` — ${format(selection.end, 'MMM d, yyyy')}`}
                </span>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-4 h-9 rounded-lg text-[11px] font-black text-zinc-500 hover:bg-zinc-200/50 transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              disabled={!selection.start || !selection.end}
              onClick={() => onChange({ start: selection.start, end: selection.end })}
              className="px-6 h-9 rounded-lg bg-brand-primary text-white text-[11px] font-black shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all uppercase tracking-widest"
            >
              Apply Bounds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
