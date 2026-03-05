window.addEventListener("DOMContentLoaded", () => {

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

    // --- Lokale state opslag (zodat refresh niet alles reset)
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
                lastSeenEventKey: null
            };
        }
        try {
            const obj = JSON.parse(raw);
            return {
                stateIndex: Number.isInteger(obj.stateIndex) ? obj.stateIndex : 0,
                lastSeenEventKey: obj.lastSeenEventKey ?? null
            };
        } catch {
            return {
                stateIndex: 0,
                lastSeenEventKey: null
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
    }

    function updateCountersUI(stateIndex) {
        // Tellers tonen hoeveel kamers in elke status zijn (nu alleen kamer 1)
        const helpCount = (stateIndex === 2) ? 1 : 0;      // Hulp gevraagd
        const colleagueCount = (stateIndex === 1) ? 1 : 0; // Collega aanwezig
        const lowBatCount = 0; // Voor later
        
        if (countHelp) countHelp.textContent = String(helpCount);
        if (countColleague) countColleague.textContent = String(colleagueCount);
        if (countLowBat) countLowBat.textContent = String(lowBatCount);
    }

    // --- Home Assistant Auth helpers
    function getToken() {
        // Optioneel: server-side injectie
        const injectedToken = window.HA_CONFIG?.token;
        if (injectedToken) {
            return injectedToken.trim();
        }

        // Home Assistant sessie token uit localStorage (indien de pagina binnen HA draait)
        const hassTokensRaw = localStorage.getItem("hassTokens");
        if (hassTokensRaw) {
            try {
                const hassTokens = JSON.parse(hassTokensRaw);
                if (hassTokens?.access_token) {
                    return hassTokens.access_token.trim();
                }
            } catch {
                // Valt terug op ha_token als hassTokens geen geldige JSON bevat.
            }
        }

        // Standaard: token uit localStorage
        const token = localStorage.getItem("ha_token");
        if (!token) {
            throw new Error("Home Assistant token niet gevonden. Gebruik window.HA_CONFIG.token of localStorage 'hassTokens'/'ha_token'.");
        }
        return token.trim();
    }

    function wsUrl() {
        // Optioneel: custom Home Assistant URL via window.HA_CONFIG.url
        if (window.HA_CONFIG?.url) {
            const baseUrl = window.HA_CONFIG.url;
            return baseUrl.replace(/^http/, "ws") + "/api/websocket";
        }

        // Anders: current host
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
    updateCountersUI(demo.stateIndex);

    async function connectWebSocket() {
        let token;
        try {
            token = getToken();
            console.log("✓ Token opgehaald:", token.substring(0, 20) + "...");
        } catch (err) {
            console.error("✗ Token error:", err.message);
            showToast(`ERROR: ${err.message}`);
            setTimeout(() => connectWebSocket().catch(console.error), 5000);
            return;
        }

        const url = wsUrl();
        console.log("Connecting to:", url);
        
        try {
            ws = new WebSocket(url);
        } catch (err) {
            console.error("WebSocket creation failed:", err);
            showToast(`WebSocket error: ${err.message}`);
            return;
        }

        ws.onopen = () => {
            console.log("✓ WebSocket connected!");
            showToast("✓ Verbonden met Home Assistant");
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            console.log("Message received:", msg.type);

            if (msg.type === "auth_required") {
                console.log("Authenticating...");
                ws.send(JSON.stringify({ type: "auth", access_token: token }));
                return;
            }

            if (msg.type === "auth_ok") {
                console.log("✓ Authenticated!");
                sendWS({ type: "subscribe_events", event_type: "state_changed" });
                return;
            }

            if (msg.type === "auth_invalid") {
                console.error("✗ Auth invalid - token is verkeerd!");
                showToast("✗ Token is verkeerd of verlopen");
                return;
            }

            if (msg.type === "event" && msg.event?.event_type === "state_changed") {
                const e = msg.event.data;
                const entityId = e.entity_id;
                console.log("State changed:", entityId, "=", e.new_state?.state);
                
                // Check welke knop gedrukt is
                if (entityId !== WATCH_ENTITY_HELP && entityId !== WATCH_ENTITY_COLLEAGUE) return;

                const newValue = e.new_state?.state;
                const eventKey = `${entityId}:${newValue}`;

                // Extra bescherming: sommige systemen sturen soms dubbele events
                if (demo.lastSeenEventKey === eventKey) return;
                demo.lastSeenEventKey = eventKey;

                // Bepaal de status op basis van welke entity veranderd is
                if (entityId === WATCH_ENTITY_HELP) {
                    // Korte klik → Altijd naar "Hulp gevraagd" (state 2)
                    demo.stateIndex = 2;
                } else if (entityId === WATCH_ENTITY_COLLEAGUE) {
                    // Lange klik → Toggle tussen "Collega aanwezig" (1) en "Geen melding" (0)
                    if (demo.stateIndex === 1) {
                        demo.stateIndex = 0; // Van collega → geen melding
                    } else {
                        demo.stateIndex = 1; // Van elke andere status → collega aanwezig
                    }
                }

                // Update UI
                setRoom1State(demo.stateIndex);
                updateCountersUI(demo.stateIndex);

                // Toast
                showToast(STATES[demo.stateIndex].toast);

                // Save
                saveState(demo);
            }
        };

        ws.onerror = (err) => {
            console.error("✗ WebSocket error:", err);
            showToast("✗ Verbindingsfout");
        };

        ws.onclose = () => {
            console.warn("WebSocket closed, reconnecting in 3s...");
            showToast("Verbinding verbroken, opnieuw verbinden...");
            setTimeout(() => {
                connectWebSocket().catch(console.error);
            }, 3000);
        };
    }

    // Debug info at startup
    console.log("Page loaded, checking config...");
    console.log("window.HA_CONFIG:", window.HA_CONFIG);
    
    connectWebSocket().catch((e) => {
        console.error("Fatal error:", e);
        showToast(`ERROR: ${e.message}`);
    });

});