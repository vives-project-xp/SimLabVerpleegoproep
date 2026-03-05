window.addEventListener("DOMContentLoaded", () => {

    // =========================
    // Status Toggle Functionaliteit
    // =========================
    const statusToggleBtn = document.getElementById("statusToggleBtn");
    const statusText = document.getElementById("statusText");
    const TOGGLE_STORAGE_KEY = "simlab_status_toggle";

    // Load saved toggle state
    function loadToggleState() {
        const saved = localStorage.getItem(TOGGLE_STORAGE_KEY);
        return saved === "busy";
    }

    // Save toggle state
    function saveToggleState(isBusy) {
        localStorage.setItem(TOGGLE_STORAGE_KEY, isBusy ? "busy" : "ready");
    }

    // Reset naar "Geen melding" status
    function resetToNormal() {
        const room1Card = document.getElementById("room1Card");
        const room1Status = document.getElementById("room1Status");
        const room1StateLabel = document.getElementById("room1StateLabel");
        
        // Reset naar groen
        room1Card.classList.remove("busy", "alert");
        room1Card.classList.add("free");
        room1Status.innerHTML = `<i class="fa-solid fa-circle-check" style="color: rgb(6, 158, 16);"></i> Geen melding`;
        if (room1StateLabel) room1StateLabel.textContent = "Geen melding";
        
        statusToggleBtn.textContent = "Reset naar Geen Melding";
        statusText.textContent = "Klik om terug te zetten naar normale status";
    }

    // Initialize - altijd starten met normale status
    resetToNormal();

    // Website button - reset altijd terug naar "Geen melding"
    if (statusToggleBtn) {
        statusToggleBtn.addEventListener("click", () => {
            resetToNormal();
            // Update demo state ook naar 0
            if (typeof demo !== 'undefined') {
                demo.stateIndex = 0;
                saveState(demo);
            }
            showToast("Status gereset naar: Geen melding");
        });
    }

    // =========================
    // Home Assistant Integratie
    // =========================

    // Home Assistant entities die veranderen bij knopdruk (via automation)
    const WATCH_ENTITY_HELP = "input_text.last_button_press";        // Korte klik
    const WATCH_ENTITY_COLLEAGUE = "input_text.colleague_present";   // Lange klik

    // UI elements
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMsg");

    const countHelp = document.getElementById("countHelp");
    const countColleague = document.getElementById("countColleague");
    const countLowBat = document.getElementById("countLowBat");

    const room1Card = document.getElementById("room1Card");
    const room1Status = document.getElementById("room1Status");
    const room1StateLabel = document.getElementById("room1StateLabel");

    // --- Demo state opslag (zodat refresh niet alles reset)
    const STORAGE_KEY = "simlab_demo_state_v1";

    // States: 0=geen, 1=collega, 2=hulp
    const STATES = [
        {
            name: "Geen melding",
            cardClass: "free",
            html: `<i class="fa-solid fa-circle-check" style="color: rgb(6, 158, 16);"></i> Geen melding`,
            toast: "Kamer 01: Geen melding"
        },
        {
            name: "Collega aanwezig",
            cardClass: "busy",
            html: `<i class="fa-solid fa-user" style="color: rgb(237, 136, 12);"></i> Collega aanwezig`,
            toast: "Kamer 01: Collega aanwezig"
        },
        {
            name: "Hulp gevraagd",
            cardClass: "alert",
            html: `<i class="fa-solid fa-circle-xmark" style="color: rgb(213, 13, 13);"></i> Hulp gevraagd`,
            toast: "Kamer 01: Hulp gevraagd!"
        }
    ];

    function loadState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {
                stateIndex: 0,
                helpCount: 0,
                colleagueCount: 0,
                lowBatCount: 0,
                lastSeenValue: null
            };
        }
        try {
            const obj = JSON.parse(raw);
            return {
                stateIndex: Number.isInteger(obj.stateIndex) ? obj.stateIndex : 0,
                helpCount: Number.isInteger(obj.helpCount) ? obj.helpCount : 0,
                colleagueCount: Number.isInteger(obj.colleagueCount) ? obj.colleagueCount : 0,
                lowBatCount: Number.isInteger(obj.lowBatCount) ? obj.lowBatCount : 0,
                lastSeenValue: obj.lastSeenValue ?? null
            };
        } catch {
            return {
                stateIndex: 0,
                helpCount: 0,
                colleagueCount: 0,
                lowBatCount: 0,
                lastSeenValue: null
            };
        }
    }

    function saveState(s) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }

    function showToast(message) {
        if (!toast || !toastMsg) return;
        toastMsg.textContent = message;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3500);
    }

    function setRoom1State(index) {
        const st = STATES[index];

        // card class switch: remove old & add new
        room1Card.classList.remove("free", "busy", "alert");
        room1Card.classList.add(st.cardClass);

        // status line
        room1Status.innerHTML = st.html;

        // small label
        if (room1StateLabel) room1StateLabel.textContent = st.name;
    }

    function updateCountersUI(s) {
        if (countHelp) countHelp.textContent = String(s.helpCount);
        if (countColleague) countColleague.textContent = String(s.colleagueCount);
        if (countLowBat) countLowBat.textContent = String(s.lowBatCount);
    }

    // --- Home Assistant Auth helpers
    function getTokens() {
        const raw = localStorage.getItem("hassTokens");
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    }

    async function getAccessToken() {
        const tokens = getTokens();
        if (!tokens || !tokens.refresh_token) {
            throw new Error("Geen refresh_token gevonden. Log in op Home Assistant in dezelfde browser.");
        }

        const form = new URLSearchParams();
        form.set("grant_type", "refresh_token");
        form.set("client_id", tokens.clientId || location.origin);
        form.set("refresh_token", tokens.refresh_token);

        const res = await fetch("/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: form.toString()
        });

        const text = await res.text();
        if (!res.ok) throw new Error(`Token refresh failed (${res.status}): ${text}`);

        const data = JSON.parse(text);
        if (!data.access_token) throw new Error("Geen access_token in response.");
        return data.access_token;
    }

    function wsUrl() {
        const proto = location.protocol === "https:" ? "wss" : "ws";
        return `${proto}://${location.host}/api/websocket`;
    }

    let ws = null;
    let msgId = 1;

    function sendWS(obj) {
        obj.id = msgId++;
        ws.send(JSON.stringify(obj));
        return obj.id;
    }

    // --- MAIN demo logic on event
    let demo = loadState();

    // Init UI on load
    setRoom1State(demo.stateIndex);
    updateCountersUI(demo);

    async function connectWebSocket() {
        const token = await getAccessToken();
        ws = new WebSocket(wsUrl());

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === "auth_required") {
                ws.send(JSON.stringify({ type: "auth", access_token: token }));
                return;
            }

            if (msg.type === "auth_ok") {
                sendWS({ type: "subscribe_events", event_type: "state_changed" });
                return;
            }

            if (msg.type === "event" && msg.event?.event_type === "state_changed") {
                const e = msg.event.data;
                const entityId = e.entity_id;
                
                // Check welke knop gedrukt is
                if (entityId !== WATCH_ENTITY_HELP && entityId !== WATCH_ENTITY_COLLEAGUE) return;

                const newValue = e.new_state?.state;

                // Extra bescherming: sommige systemen sturen soms dubbele events
                if (demo.lastSeenValue === newValue) return;
                demo.lastSeenValue = newValue;

                // Bepaal de status op basis van welke entity veranderd is
                if (entityId === WATCH_ENTITY_HELP) {
                    // Korte klik → Hulp gevraagd (state 2)
                    demo.stateIndex = 2;
                    demo.helpCount += 1;
                } else if (entityId === WATCH_ENTITY_COLLEAGUE) {
                    // Lange klik → Collega aanwezig (state 1)
                    demo.stateIndex = 1;
                    demo.colleagueCount += 1;
                }

                // Update UI
                setRoom1State(demo.stateIndex);
                updateCountersUI(demo);

                // Toast
                showToast(STATES[demo.stateIndex].toast);

                // Save
                saveState(demo);
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket error", err);
        };

        ws.onclose = () => {
            console.warn("WebSocket closed, retry in 3s...");
            setTimeout(() => {
                connectWebSocket().catch(console.error);
            }, 3000);
        };
    }

    connectWebSocket().catch((e) => {
        console.error(e);
        showToast(`ERROR: ${e.message}`);
    });

});