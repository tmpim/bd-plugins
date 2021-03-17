export function convertToDataURL({
    data,
    mimeType,
}: { data: Buffer; mimeType: string }): string {
    const header = "data:" + mimeType + ";base64,";
    return header + data.toString("base64");
}
