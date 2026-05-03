window.addEventListener("DOMContentLoaded", () => {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMsg");

    const countHelp = document.getElementById("countHelp");
    const countColleague = document.getElementById("countColleague");
    const countLowBat = document.getElementById("countLowBat");

    const userInfo = document.getElementById("userInfo");
    const logoutBtn = document.getElementById("logoutBtn");
    const settingsLink = document.getElementById("settingsLink");

    const previousBeds = {};

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function showToast(message) {
        if (!toast || !toastMsg) return;

        toastMsg.textContent = message;
        toast.classList.remove("show");
        void toast.offsetWidth;
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    function getBedConfig(status) {
        switch (status) {
            case "call":
                return { className: "alert", icon: "fa-circle-xmark", label: "Hulp gevraagd" };
            case "present":
                return { className: "busy", icon: "fa-user", label: "Collega aanwezig" };
            case "extra":
                return { className: "extra", icon: "fa-handshake-angle", label: "Extra hulp nodig" };
            case "idle":
            default:
                return { className: "free", icon: "fa-circle-check", label: "Geen melding" };
        }
    }

    function updateBed(bedId, status) {
        const el = document.getElementById(bedId);
        if (!el) return;

        const cfg = getBedConfig(status);

        el.classList.remove("free", "busy", "alert", "extra");
        el.classList.add(cfg.className);

        const bedLabelEl = el.querySelector(".bed-label");
        const bedStatusEl = el.querySelector(".bed-status");

        const bedParts = bedId.split("_");
        const bedNumber = bedParts[1];

        if (bedLabelEl) {
            bedLabelEl.textContent = `Bed ${bedNumber}`;
        }

        if (bedStatusEl) {
            bedStatusEl.innerHTML = `
                <i class="fa-solid ${cfg.icon}"></i>
                <span>${cfg.label}</span>
            `;
        }
    }

    function updateCounters(counts) {
        if (countHelp) countHelp.textContent = String(counts.help ?? 0);
        if (countColleague) countColleague.textContent = String(counts.colleague ?? 0);
        if (countLowBat) countLowBat.textContent = String(counts.lowBat ?? 0);
    }

    function maybeNotify(beds) {
        for (const bedId of Object.keys(beds)) {
            const current = beds[bedId];
            const previous = previousBeds[bedId];

            if (previous !== undefined && previous !== current) {
                const cfg = getBedConfig(current);
                showToast(`${bedId.replace("_", " - Bed ")}: ${cfg.label}`);
                break;
            }
        }

        for (const bedId of Object.keys(beds)) {
            previousBeds[bedId] = beds[bedId];
        }
    }

    async function unsubscribeFromPush() {
        if (!("serviceWorker" in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                return;
            }

            await fetch("/api/push/unsubscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint
                }),
                keepalive: true
            });

            await subscription.unsubscribe();
        } catch (err) {
            console.error("unsubscribe fout", err);
        }
    }

    async function fetchCurrentUser() {
        try {
            const res = await fetch("/api/me", { cache: "no-store" });

            if (!res.ok) {
                window.location.href = "/login.html";
                return null;
            }

            const data = await res.json();

            if (!data.success || !data.user) {
                window.location.href = "/login.html";
                return null;
            }

            if (userInfo) {
                const roleLabel = data.user.role === "leerkracht" ? "Leerkracht" : "Leerling";
                userInfo.textContent = `${data.user.username} (${roleLabel})`;
            }

            if (settingsLink && data.user.role === "leerkracht") {
                settingsLink.classList.remove("hidden");
            }

            return data.user;
        } catch (err) {
            window.location.href = "/login.html";
            return null;
        }
    }

    async function fetchState() {
        try {
            const res = await fetch("/api/state", { cache: "no-store" });

            if (res.status === 401) {
                window.location.href = "/login.html";
                return;
            }

            const data = await res.json();
            const beds = data.beds || {};
            const counts = data.counts || { help: 0, colleague: 0, lowBat: 0 };

            for (const bedId of Object.keys(beds)) {
                updateBed(bedId, beds[bedId]);
            }

            updateCounters(counts);
            maybeNotify(beds);
        } catch (err) {
            console.error(err);
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            logoutBtn.disabled = true;

            try {
                await unsubscribeFromPush();
                await delay(1000);

                await fetch("/api/logout", {
                    method: "POST",
                    keepalive: true
                });

                await delay(500);
            } catch (err) {
                console.error(err);
            }

            window.location.href = "/login.html";
        });
    }

    async function init() {
        const user = await fetchCurrentUser();
        if (!user) return;

        await fetchState();
        setInterval(fetchState, 1200);
    }

    init();
});
