export interface CapturePayload {
    text: string;
    is_code: boolean;
    source_app: string | null;
    timestamp: string;
    platform: string;
}
