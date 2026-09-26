export interface UserDTO {
    id?: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    emailConfirmed: boolean;
    priceZone: string;
    pushNotificationsEnabled: boolean;
    emailNotificationsEnabled: boolean;
    offlineAlertThresholdHours: number;
    features: string[];
}