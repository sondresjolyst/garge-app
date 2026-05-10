export interface UserDTO {
    id?: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    emailConfirmed: boolean;
    priceZone: string;
    pushNotificationsEnabled: boolean;
    offlineAlertThresholdHours: number;
}