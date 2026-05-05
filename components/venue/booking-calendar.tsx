"use client"

import { useState } from "react"
import { DayPicker, DateRange } from "react-day-picker"
import { startOfDay, eachDayOfInterval, isSameDay, isAfter, isBefore } from "date-fns"
import { fr } from "date-fns/locale"
import "react-day-picker/style.css"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface BookingCalendarProps {
  reservations: { start_date: string; end_date: string; status: string }[]
  selectedRange?: DateRange
  onSelectRange?: (range: DateRange | undefined) => void
  mode?: "single" | "range"
  selectedDate?: Date
  onSelectDate?: (date: Date | undefined) => void
  className?: string
  ownerMode?: boolean
}

export function BookingCalendar({
  reservations,
  selectedRange,
  onSelectRange,
  mode = "range",
  selectedDate,
  onSelectDate,
  className,
  ownerMode = false,
}: BookingCalendarProps) {
  const [month, setMonth] = useState<Date>(new Date())
  const today = startOfDay(new Date())

  // Build arrays for modifiers
  const bookedDates: Date[] = []
  const pendingDates: Date[] = []
  const blockedDates: Date[] = []

  reservations.forEach((res) => {
    try {
      const start = new Date(res.start_date + "T00:00:00")
      const end = new Date(res.end_date + "T00:00:00")
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return

      const dates = eachDayOfInterval({ start, end })
      if (res.status === "CONFIRMED" || res.status === "COMPLETED") {
        bookedDates.push(...dates)
      } else if (res.status === "BLOCKED") {
        blockedDates.push(...dates)
      } else if (res.status === "PENDING") {
        pendingDates.push(...dates)
      }
    } catch {
      // skip invalid date ranges
    }
  })

  // All truly unavailable dates: booked + blocked
  const unavailableDates = [...bookedDates, ...blockedDates]

  // Past dates matcher
  const pastDatesMatcher = { before: today }

  // Disabled = past + booked + blocked (but in ownerMode, blocked dates remain clickable)
  const disabledDates = ownerMode
    ? [pastDatesMatcher, ...bookedDates] as any[]
    : [pastDatesMatcher, ...unavailableDates] as any[]

  // Range selection with overlap protection
  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) {
      onSelectRange?.(range)
      return
    }

    const rangeStart = startOfDay(range.from)
    const rangeEnd = startOfDay(range.to)

    const hasConflict = [...unavailableDates, ...pendingDates].some(
      (d) => {
        const day = startOfDay(d)
        return (isAfter(day, rangeStart) || isSameDay(day, rangeStart)) &&
               (isBefore(day, rangeEnd) || isSameDay(day, rangeEnd))
      }
    )

    if (hasConflict) {
      onSelectRange?.({ from: range.from, to: undefined })
      return
    }

    onSelectRange?.(range)
  }

  const chevronComponent = {
    Chevron: (props: { orientation?: string }) => {
      if (props.orientation === "left") {
        return <ChevronLeft className="w-4 h-4" />
      }
      return <ChevronRight className="w-4 h-4" />
    },
  }

  // Determine theme based on ownerMode and className
  const isDarkTheme = ownerMode || className?.includes("bg-transparent") || className?.includes("text-bone")

  // CSS for react-day-picker v9 — uses rdp-* class names
  const calendarCSS = `
    .saha-calendar .rdp-root {
      --rdp-accent-color: #A87C3E;
      --rdp-accent-background-color: rgba(168, 124, 62, 0.2);
      --rdp-day_button-border-radius: 6px;
      --rdp-selected-font: bold;
      font-family: inherit;
      ${isDarkTheme ? `
        --rdp-day-color: #f3eed9;
        --rdp-day_button-background-color: transparent;
        color: #f3eed9;
      ` : ''}
    }
    .saha-calendar .rdp-month_caption {
      ${isDarkTheme ? 'color: #f3eed9;' : 'color: #0E0C09;'}
      font-weight: 600;
      font-size: 15px;
    }
    .saha-calendar .rdp-weekday {
      ${isDarkTheme ? 'color: #a39b8c;' : 'color: #6b6560;'}
      font-size: 12px;
      font-weight: 500;
    }
    .saha-calendar .rdp-day button {
      border: 1px solid transparent;
      font-size: 14px;
      border-radius: 6px;
      ${isDarkTheme ? 'color: #f3eed9;' : ''}
    }
    .saha-calendar .rdp-day button:hover:not([disabled]) {
      background-color: rgba(168, 124, 62, 0.15) !important;
      border-color: #A87C3E !important;
    }
    .saha-calendar .rdp-disabled button {
      text-decoration: none;
      opacity: 0.25 !important;
      cursor: not-allowed !important;
    }
    .saha-calendar .rdp-today button {
      border: 1px solid rgba(168, 124, 62, 0.4) !important;
      font-weight: 600;
    }
    /* Custom modifier styles — v9 applies classes to the <td> */
    .saha-calendar .rdp-day.day-booked button {
      background-color: #3E2723 !important;
      color: white !important;
      text-decoration: line-through;
      opacity: 1 !important;
      cursor: not-allowed !important;
    }
    .saha-calendar .rdp-day.day-blocked button {
      background-color: #8B2E20 !important;
      color: white !important;
      opacity: 1 !important;
      cursor: ${ownerMode ? 'pointer' : 'not-allowed'} !important;
    }
    .saha-calendar .rdp-day.day-pending button {
      background-color: rgba(212, 175, 55, 0.2) !important;
      border-color: rgba(212, 175, 55, 0.4) !important;
    }
    .saha-calendar .rdp-months {
      justify-content: center;
    }
    .saha-calendar .rdp-nav button {
      ${isDarkTheme ? 'color: #a87c3e; border-color: rgba(168,124,62,0.2);' : ''}
    }
    .saha-calendar .rdp-nav button:hover {
      ${isDarkTheme ? 'background-color: rgba(168,124,62,0.1);' : ''}
    }
    .saha-calendar .rdp-range_start button,
    .saha-calendar .rdp-range_end button,
    .saha-calendar .rdp-selected button {
      background-color: #A87C3E !important;
      color: #f3eed9 !important;
      font-weight: 600;
    }
    .saha-calendar .rdp-range_middle button {
      background-color: rgba(168, 124, 62, 0.2) !important;
      color: ${isDarkTheme ? '#f3eed9' : '#0E0C09'} !important;
    }
  `

  const defaultContainerClass = isDarkTheme
    ? "rounded-xl p-4"
    : "bg-white border border-parchment rounded-xl p-6 shadow-sm"

  return (
    <div className={`saha-calendar ${className || defaultContainerClass}`}>
      <style>{calendarCSS}</style>
      <div className="flex justify-center">
        {mode === "range" ? (
          <DayPicker
            mode="range"
            locale={fr}
            month={month}
            onMonthChange={setMonth}
            disabled={disabledDates}
            startMonth={new Date()}
            selected={selectedRange}
            onSelect={handleRangeSelect}
            modifiers={{
              booked: bookedDates,
              pending: pendingDates,
              blocked: blockedDates,
            }}
            modifiersClassNames={{
              booked: "day-booked",
              pending: "day-pending",
              blocked: "day-blocked",
            }}
            components={chevronComponent}
            className="font-sans"
          />
        ) : (
          <DayPicker
            mode="single"
            locale={fr}
            month={month}
            onMonthChange={setMonth}
            disabled={disabledDates}
            startMonth={new Date()}
            selected={selectedDate}
            onSelect={onSelectDate}
            modifiers={{
              booked: bookedDates,
              pending: pendingDates,
              blocked: blockedDates,
            }}
            modifiersClassNames={{
              booked: "day-booked",
              pending: "day-pending",
              blocked: "day-blocked",
            }}
            components={chevronComponent}
            className="font-sans"
          />
        )}
      </div>

      <div
        className="flex flex-wrap gap-4 mt-4 pt-4 text-xs font-sans justify-center"
        style={{
          borderTop: isDarkTheme
            ? "1px solid rgba(168,124,62,0.15)"
            : "1px solid rgba(14,12,9,0.08)",
          color: isDarkTheme ? "var(--stone)" : "#6b6560",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: isDarkTheme ? "rgba(255,255,255,0.08)" : "white",
              border: isDarkTheme ? "1px solid rgba(168,124,62,0.2)" : "1px solid #e8dfd0",
            }}
          ></span>
          Disponible
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(212, 175, 55, 0.2)" }}></span>
          En attente
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#3E2723" }}></span>
          Réservé
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#8B2E20" }}></span>
          Bloqué
        </div>
      </div>
    </div>
  )
}
