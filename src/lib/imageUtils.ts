const MAX_WIDTH = 1200;
const QUALITY = 0.72;
const MAX_BYTES = 150_000;

export async function compressImage(file: File): Promise<{ base64: string; contentType: string }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, w, h);

            let quality = QUALITY;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);

            // reduce quality until under MAX_BYTES
            while (dataUrl.length * 0.75 > MAX_BYTES && quality > 0.3) {
                quality -= 0.05;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
            }

            const base64 = dataUrl.split(',')[1];
            resolve({ base64, contentType: 'image/jpeg' });
        };

        img.onerror = reject;
        img.src = url;
    });
}
