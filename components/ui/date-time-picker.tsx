"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: string; // ISO datetime string or ""
  onChange: (value: string) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// All 12 hour options for the grid
const HOURS_12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const now = new Date();

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);

  // Parse initial hour/minute/ampm from value
  const initHour24 = value ? new Date(value).getHours() : 9;
  const initIsPm = initHour24 >= 12;
  const initHour12 = initHour24 === 0 ? 12 : initHour24 > 12 ? initHour24 - 12 : initHour24;

  const [hour12, setHour12] = useState(initHour12);   // 1-12
  const [minute, setMinute] = useState(value ? new Date(value).getMinutes() : 0);
  const [isPm, setIsPm] = useState(initIsPm);
  const [showTime, setShowTime] = useState(false);

  // Convert 12h + AM/PM to 24h
  const hour24 = (): number => {
    if (isPm) return hour12 === 12 ? 12 : hour12 + 12;
    return hour12 === 12 ? 0 : hour12;
  };

  // Emit ISO string whenever any selection changes
  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      const h = hour24();
      d.setHours(h, minute, 0, 0);
      const pad = (n: number) => String(n).padStart(2, "0");
      const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(minute)}`;
      onChange(str);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, hour12, minute, isPm]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    setSelectedDate(d);
    setShowTime(true);
  };

  const isToday = (day: number) => {
    const t = new Date();
    return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === day;
  };
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth && selectedDate.getDate() === day;
  };
  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  // Display string with 12h format
  const displayValue = selectedDate
    ? `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()].slice(0, 3)} ${selectedDate.getFullYear()} at ${pad(hour12)}:${pad(minute)} ${isPm ? "PM" : "AM"}`
    : null;

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-gray-100">
        <button
          type="button"
          onClick={() => setShowTime(false)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-all",
            !showTime ? "bg-secondary text-white" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <Calendar className="w-3.5 h-3.5" /> Date
        </button>
        <button
          type="button"
          onClick={() => setShowTime(true)}
          disabled={!selectedDate}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-all",
            showTime ? "bg-secondary text-white" : "text-gray-400 hover:text-gray-600",
            !selectedDate && "opacity-40 cursor-not-allowed"
          )}
        >
          <Clock className="w-3.5 h-3.5" /> Time
        </button>
      </div>

      {/* Selected value banner */}
      {displayValue && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <p className="text-xs text-blue-700 font-bold text-center">{displayValue}</p>
        </div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {!showTime && (
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-bold text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const past = isPast(day);
              const selected = isSelected(day);
              const today = isToday(day);
              return (
                <button
                  type="button"
                  key={day}
                  disabled={past}
                  onClick={() => selectDay(day)}
                  className={cn(
                    "h-8 w-full rounded-lg text-xs font-medium transition-all",
                    selected && "bg-secondary text-white font-bold shadow-sm",
                    !selected && today && "border border-secondary text-secondary font-bold",
                    !selected && !today && !past && "hover:bg-gray-100 text-gray-800",
                    past && "text-gray-300 cursor-not-allowed"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TIME PICKER ── */}
      {showTime && selectedDate && (
        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-400 text-center font-medium">
            {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </p>

          {/* Time display — 12h format */}
          <div className="flex items-center justify-center gap-2">
            <div className="text-5xl font-mono font-bold text-secondary tracking-tight">
              {pad(hour12)}
            </div>
            <div className="text-4xl font-bold text-gray-300">:</div>
            <div className="text-5xl font-mono font-bold text-secondary tracking-tight">
              {pad(minute)}
            </div>
            <div className="text-lg font-bold text-gray-400 self-end pb-1 pl-1">
              {isPm ? "PM" : "AM"}
            </div>
          </div>

          {/* AM / PM toggle — fixed, both always clickable */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPm(false)}
              className={cn(
                "h-10 rounded-xl text-sm font-bold border-2 transition-all",
                !isPm
                  ? "bg-secondary text-white border-secondary shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
              )}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setIsPm(true)}
              className={cn(
                "h-10 rounded-xl text-sm font-bold border-2 transition-all",
                isPm
                  ? "bg-secondary text-white border-secondary shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
              )}
            >
              PM
            </button>
          </div>

          {/* Hour grid — all 12 hours clearly visible */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hour</div>
            <div className="grid grid-cols-6 gap-1.5">
              {HOURS_12.map(h => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHour12(h)}
                  className={cn(
                    "h-9 rounded-lg text-sm font-bold transition-all",
                    hour12 === h
                      ? "bg-secondary text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Minute grid */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Minute</div>
            <div className="grid grid-cols-6 gap-1.5">
              {MINUTES.map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMinute(m)}
                  className={cn(
                    "h-9 rounded-lg text-xs font-bold transition-all",
                    minute === m
                      ? "bg-secondary text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  :{pad(m)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
