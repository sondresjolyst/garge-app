import { describe, it, expect } from 'vitest';
import { COMPANY, formatOrgNumber } from '@/lib/company';

describe('COMPANY', () => {
    it('carries the registered legal name and organisation number', () => {
        expect(COMPANY.legalName).toBe('Sjølyst Innovation AS');
        expect(COMPANY.orgNumber).toBe('938 517 789');
    });
});

describe('formatOrgNumber', () => {
    it('appends MVA when the business is VAT-registered', () => {
        expect(formatOrgNumber(COMPANY.orgNumber, true)).toBe('938 517 789 MVA');
    });

    it('leaves the number bare when it is not', () => {
        expect(formatOrgNumber(COMPANY.orgNumber, false)).toBe('938 517 789');
    });
});
