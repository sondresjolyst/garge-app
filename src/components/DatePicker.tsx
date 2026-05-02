'use client'

import React from 'react'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import { nb } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('nb', nb)

interface DatePickerProps {
    id?: string
    value: string        // YYYY-MM-DD or YYYY-MM-DDTHH:MM when showTime=true
    onChange: (value: string) => void
    className?: string
    showTime?: boolean
}

export default function DatePicker({ id, value, onChange, className, showTime = false }: DatePickerProps) {
    const selected = value ? new Date(value) : null

    const handleChange = (date: Date | null) => {
        if (!date) return
        const pad = (n: number) => String(n).padStart(2, '0')
        const yyyy = date.getFullYear()
        const mm = pad(date.getMonth() + 1)
        const dd = pad(date.getDate())
        if (showTime) {
            onChange(`${yyyy}-${mm}-${dd}T${pad(date.getHours())}:${pad(date.getMinutes())}`)
        } else {
            onChange(`${yyyy}-${mm}-${dd}`)
        }
    }

    return (
        <ReactDatePicker
            id={id}
            locale="nb"
            dateFormat={showTime ? 'dd.MM.yyyy HH:mm' : 'dd.MM.yyyy'}
            timeFormat="HH:mm"
            showTimeSelect={showTime}
            timeIntervals={15}
            selected={selected}
            onChange={handleChange}
            wrapperClassName="w-full"
            className={className}
            popperPlacement="bottom-start"
            popperProps={{ strategy: 'fixed' }}
        />
    )
}
