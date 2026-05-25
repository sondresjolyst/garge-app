import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React, { useState } from 'react'
import AutomationRuleForm from '@/app/(protected)/automations/AutomationRuleForm'
import type { CreateAutomationRuleDto } from '@/dto/Automation/CreateAutomationRuleDto'
import type { Switch } from '@/services/switchService'
import type { Sensor } from '@/services/sensorService'

const sortedSwitches = [
    { id: 10, name: 'Garage socket', customName: 'Garage socket', type: 'relay' },
] as unknown as Switch[]

const sortedSensors = [
    { id: 20, name: 'volt-1', defaultName: 'Battery voltage', customName: null, type: 'voltage' },
] as unknown as Sensor[]

const sensors = sortedSensors

const emptyRule = (): CreateAutomationRuleDto => ({
    targetType: '',
    targetId: 0,
    sensorType: '',
    sensorId: 0,
    condition: '<',
    threshold: 0,
    action: 'off',
    isEnabled: true,
})

/**
 * Wraps the form so its `value` is real React state, mirroring how the
 * automations page drives it: every onChange replaces the whole DTO and the
 * latest snapshot is captured for assertions after submit.
 */
const Harness: React.FC<{
    initial: CreateAutomationRuleDto
    mode: 'create' | 'edit'
    onSubmitCapture: (v: CreateAutomationRuleDto) => void
    onDelete?: () => void
}> = ({ initial, mode, onSubmitCapture, onDelete }) => {
    const [value, setValue] = useState<CreateAutomationRuleDto>(initial)
    return (
        <AutomationRuleForm
            value={value}
            onChange={setValue}
            onSubmit={e => { e.preventDefault(); onSubmitCapture(value) }}
            onCancel={() => {}}
            submitting={false}
            mode={mode}
            sortedSwitches={sortedSwitches}
            sortedSensors={sortedSensors}
            sensors={sensors}
            latestValueMap={{ 20: 12.6 }}
            defaultPriceArea="NO1"
            priceFormKey={mode}
            onDelete={onDelete}
        />
    )
}

describe('AutomationRuleForm — create', () => {
    it('renders create-mode labels and the empty option placeholders', () => {
        render(<Harness initial={emptyRule()} mode="create" onSubmitCapture={() => {}} />)
        expect(screen.getByRole('button', { name: 'Create Rule' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Select a socket' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Select a sensor' })).toBeInTheDocument()
        // No delete button in create mode.
        expect(screen.queryByRole('button', { name: /Delete Rule/ })).not.toBeInTheDocument()
    })

    it('captures the filled condition, threshold, target and sensor on submit', () => {
        const onSubmit = vi.fn()
        render(<Harness initial={emptyRule()} mode="create" onSubmitCapture={onSubmit} />)

        // Pick target socket — also sets targetType from the matched switch.
        fireEvent.change(screen.getByDisplayValue('Select a socket'), { target: { value: '10' } })
        // Pick trigger sensor — also sets sensorType from the matched sensor.
        fireEvent.change(screen.getByDisplayValue('Select a sensor'), { target: { value: '20' } })
        // Condition: greater than or equal.
        fireEvent.change(screen.getByDisplayValue('Less than'), { target: { value: '>=' } })
        // Threshold.
        const threshold = screen.getByPlaceholderText('0')
        fireEvent.change(threshold, { target: { value: '12.8' } })

        fireEvent.click(screen.getByRole('button', { name: 'Create Rule' }))

        expect(onSubmit).toHaveBeenCalledTimes(1)
        expect(onSubmit.mock.calls[0][0]).toMatchObject({
            targetId: 10,
            targetType: 'relay',
            sensorId: 20,
            sensorType: 'voltage',
            condition: '>=',
            threshold: 12.8,
            action: 'off',
        })
    })

    it('shows the threshold unit from the chosen sensor type', () => {
        render(<Harness initial={emptyRule()} mode="create" onSubmitCapture={() => {}} />)
        fireEvent.change(screen.getByDisplayValue('Select a sensor'), { target: { value: '20' } })
        // voltage → unit V appears in the threshold label.
        expect(screen.getByText(/Threshold \(V\)/)).toBeInTheDocument()
    })

    it('renders the auto-off timer block only for the "on" action and emits a default duration', () => {
        const onSubmit = vi.fn()
        render(<Harness initial={emptyRule()} mode="create" onSubmitCapture={onSubmit} />)

        // No timer block while action is "off".
        expect(screen.queryByText('Auto-off timer')).not.toBeInTheDocument()

        // Switch action to "on" — the timer block appears.
        fireEvent.change(screen.getByDisplayValue('Turn Off'), { target: { value: 'on' } })
        expect(screen.getByText('Auto-off timer')).toBeInTheDocument()

        // Enable the timer toggle → default 2 hours, then bump it.
        fireEvent.click(screen.getByRole('switch', { name: 'Enable auto-off timer' }))
        const duration = screen.getByDisplayValue('2')
        fireEvent.change(duration, { target: { value: '5' } })

        fireEvent.click(screen.getByRole('button', { name: 'Create Rule' }))
        expect(onSubmit.mock.calls[0][0]).toMatchObject({ action: 'on', timerDurationHours: 5 })
    })

    it('captures the electricity price sub-form when enabled', () => {
        const onSubmit = vi.fn()
        render(<Harness initial={emptyRule()} mode="create" onSubmitCapture={onSubmit} />)

        // Price fields hidden until the toggle is on.
        expect(screen.queryByText('Price (kr/kWh)')).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('switch', { name: 'Enable electricity price condition' }))
        const priceLabel = screen.getByText('Price (kr/kWh)')
        expect(priceLabel).toBeInTheDocument()

        // Set the price threshold — scope to the input next to the "Price (kr/kWh)"
        // label, since the sensor threshold field also has a placeholder of "0".
        const priceInput = priceLabel.parentElement!.querySelector('input') as HTMLInputElement
        fireEvent.change(priceInput, { target: { value: '1.5' } })
        // Choose OR as the combine operator.
        fireEvent.change(screen.getByDisplayValue('AND (both must be true)'), { target: { value: 'OR' } })

        fireEvent.click(screen.getByRole('button', { name: 'Create Rule' }))
        expect(onSubmit.mock.calls[0][0]).toMatchObject({
            electricityPriceCondition: '<',
            electricityPriceThreshold: 1.5,
            electricityPriceArea: 'NO1',
            electricityPriceOperator: 'OR',
        })
    })

    it('shows a "would trigger now" preview based on the latest reading', () => {
        // current 12.6 < threshold 13 → would trigger.
        const initial = { ...emptyRule(), sensorId: 20, sensorType: 'voltage', condition: '<', threshold: 13 }
        render(<Harness initial={initial} mode="create" onSubmitCapture={() => {}} />)
        expect(screen.getByText(/Would trigger now/)).toBeInTheDocument()
    })
})

describe('AutomationRuleForm — edit', () => {
    const existingRule: CreateAutomationRuleDto = {
        targetType: 'relay',
        targetId: 10,
        sensorType: 'voltage',
        sensorId: 20,
        condition: '>',
        threshold: 14.4,
        action: 'on',
        isEnabled: true,
        timerDurationHours: 3,
        electricityPriceCondition: '<',
        electricityPriceThreshold: 0.8,
        electricityPriceArea: 'NO2',
        electricityPriceOperator: 'AND',
    }

    it('pre-fills every field from the existing rule value', () => {
        render(<Harness initial={existingRule} mode="edit" onSubmitCapture={() => {}} onDelete={() => {}} />)

        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Delete Rule/ })).toBeInTheDocument()

        // Selects reflect the existing values.
        expect((screen.getByDisplayValue('Garage socket') as HTMLSelectElement).value).toBe('10')
        expect((screen.getByDisplayValue('Battery voltage') as HTMLSelectElement).value).toBe('20')
        expect((screen.getByDisplayValue('Greater than') as HTMLSelectElement).value).toBe('>')
        expect(screen.getByDisplayValue('14.4')).toBeInTheDocument()
        expect((screen.getByDisplayValue('Turn On') as HTMLSelectElement).value).toBe('on')

        // Timer pre-filled and enabled.
        expect(screen.getByText('Auto-off timer')).toBeInTheDocument()
        expect(screen.getByDisplayValue('3')).toBeInTheDocument()

        // Price sub-form pre-filled and enabled.
        expect(screen.getByText('Price (kr/kWh)')).toBeInTheDocument()
        expect(screen.getByDisplayValue('0.8')).toBeInTheDocument()
        expect((screen.getByDisplayValue('NO2') as HTMLSelectElement).value).toBe('NO2')
    })

    it('emits the edited values on save', () => {
        const onSubmit = vi.fn()
        render(<Harness initial={existingRule} mode="edit" onSubmitCapture={onSubmit} onDelete={() => {}} />)

        // Change condition and threshold.
        fireEvent.change(screen.getByDisplayValue('Greater than'), { target: { value: '<=' } })
        fireEvent.change(screen.getByDisplayValue('14.4'), { target: { value: '15.0' } })

        fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

        expect(onSubmit).toHaveBeenCalledTimes(1)
        expect(onSubmit.mock.calls[0][0]).toMatchObject({
            targetId: 10,
            sensorId: 20,
            condition: '<=',
            threshold: 15,
            action: 'on',
            timerDurationHours: 3,
            electricityPriceThreshold: 0.8,
            electricityPriceOperator: 'AND',
        })
    })

    it('invokes onDelete when the delete button is clicked', () => {
        const onDelete = vi.fn()
        render(<Harness initial={existingRule} mode="edit" onSubmitCapture={() => {}} onDelete={onDelete} />)
        fireEvent.click(screen.getByRole('button', { name: /Delete Rule/ }))
        expect(onDelete).toHaveBeenCalledOnce()
    })
})
