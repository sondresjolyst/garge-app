'use client'

import React from 'react'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import { nb } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('nb', nb)

interface DatePickerProps {
    id?: string
    value: string        // YYYY-MM-DD
    onChange: (value: string) => void
    className?: string
}

export default function DatePicker({ id, value, onChange, className }: DatePickerProps) {
    const selected = value ? new Date(value) : null

    const handleChange = (date: Date | null) => {
        if (date) {
            // Keep internal state as YYYY-MM-DD string (same as native input)
            const yyyy = date.getFullYear()
            const mm = String(date.getMonth() + 1).padStart(2, '0')
            const dd = String(date.getDate()).padStart(2, '0')
            onChange(`${yyyy}-${mm}-${dd}`)
        }
    }

    return (
        <ReactDatePicker
            id={id}
            locale="nb"
            dateFormat="dd.MM.yyyy"
            selected={selected}
            onChange={handleChange}
            wrapperClassName="w-full"
            className={className}
            popperPlacement="bottom-start"
            popperProps={{ strategy: 'fixed' }}
        />
    )
}
