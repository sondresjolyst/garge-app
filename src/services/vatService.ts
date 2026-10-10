import axiosInstance from '@/services/axiosInstance';
import { formatApiError } from '@/lib/errorMessages';

export interface VatOwedSale {
    invoiceId: number;
    issuedAt: string;
    amountInOre: number;
    vatInOre: number;
    supplementNumber: string | null;
    supplementIssuedAt: string | null;
}

export interface VatThreshold {
    turnoverInOre: number;
    otherTurnoverInOre: number;
    thresholdInOre: number;
    vatEnabled: boolean;
    crossingInvoiceId: number | null;
    crossedAt: string | null;
    owedVatInOre: number;
    owed: VatOwedSale[];
}

async function download(path: string, fileName: string, failure: string): Promise<void> {
    try {
        const res = await axiosInstance.get(path, { responseType: 'blob' });
        const url = URL.createObjectURL(res.data as Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (error: unknown) {
        throw new Error(formatApiError(error, failure));
    }
}

const VatService = {
    async getThreshold(): Promise<VatThreshold> {
        try {
            return (await axiosInstance.get<VatThreshold>('/admin/vat/threshold')).data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to load the VAT threshold'));
        }
    },

    async setOtherTurnover(otherTurnoverInOre: number): Promise<void> {
        try {
            await axiosInstance.put('/admin/vat/other-turnover', { otherTurnoverInOre });
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to save other turnover'));
        }
    },

    async makeSupplements(): Promise<number> {
        try {
            return (await axiosInstance.post<{ made: number }>('/admin/vat/supplements')).data.made;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to make VAT supplements'));
        }
    },

    downloadSupplement(invoiceId: number, supplementNumber: string): Promise<void> {
        return download(`/admin/vat/supplements/${invoiceId}`, `${supplementNumber}.pdf`, 'Failed to download the VAT supplement');
    },

    downloadOwedCsv(): Promise<void> {
        return download('/admin/vat/owed.csv', 'vat-owed.csv', 'Failed to download the CSV');
    },
};

export default VatService;
