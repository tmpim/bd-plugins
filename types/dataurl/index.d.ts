declare module "dataurl" {
    interface ConvertOptions {
        data: any;
        mimetype: string;
        charset?: string;
        encoded?: string; /// Whether to base64 encode the data. Defaults to true
    }

    function convert(options: ConvertOptions): string;
}
