// lib/notificationManager.ts
let notificationSent = false;

export function hasNotificationBeenSent(): boolean {
    return notificationSent;
}

export function setNotificationSent(status: boolean): void {
    notificationSent = status;
}
