const enablePushBtn = document.getElementById("enablePushBtn");

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        console.warn("Service workers niet ondersteund");
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service worker geregistreerd");
        return registration;
    } catch (error) {
        console.error("Service worker fout:", error);
        return null;
    }
}

async function subscribeToPush() {
    if (!("Notification" in window) || !("PushManager" in window)) {
        alert("Push notificaties worden niet ondersteund op dit toestel/browser.");
        return;
    }

    try {
        const meResponse = await fetch("/api/me", { cache: "no-store" });

        if (!meResponse.ok) {
            alert("Je bent niet ingelogd.");
            return;
        }

        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            alert("Notificaties zijn niet toegestaan.");
            return;
        }

        const keyResponse = await fetch("/api/push/public-key");

        if (!keyResponse.ok) {
            alert("Public key ophalen mislukt.");
            return;
        }

        const keyData = await keyResponse.json();
        const publicKey = keyData.publicKey;
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
        }

        const subscribeResponse = await fetch("/api/push/subscribe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(subscription)
        });

        if (!subscribeResponse.ok) {
            alert("Subscription opslaan mislukt.");
            return;
        }

        alert("Meldingen zijn ingeschakeld.");
        enablePushBtn.textContent = "Meldingen actief";
        enablePushBtn.disabled = true;
    } catch (err) {
        console.error("Push error:", err);
        alert("Er is een fout opgetreden bij het inschakelen van meldingen.");
    }
}

window.addEventListener("load", async () => {
    await registerServiceWorker();

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            enablePushBtn.textContent = "Meldingen actief";
            enablePushBtn.disabled = true;
        } else {
            enablePushBtn.textContent = "Meldingen inschakelen";
            enablePushBtn.disabled = false;
        }
    } catch (err) {
        console.error("Push check fout:", err);
        enablePushBtn.textContent = "Meldingen inschakelen";
        enablePushBtn.disabled = false;
    }
});

if (enablePushBtn) {
    enablePushBtn.addEventListener("click", async () => {
        await subscribeToPush();
    });
}
