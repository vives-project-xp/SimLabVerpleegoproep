window.addEventListener("DOMContentLoaded", () => {

    // =========================
    // Version & Debug Info
    // =========================
    const SCRIPT_VERSION = "20260305-002";
    console.log("========================================");
    console.log(`🚀 SimLab Script v${SCRIPT_VERSION} geladen`);
    console.log("========================================");
    console.log("Browser:", navigator.userAgent);
    console.log("URL:", window.location.href);
    console.log("Timestamp:", new Date().toISOString());
    console.log("========================================");

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
    const COLLEAGUE_TOGGLE_KEY = "simlab_colleague_toggle_v1";

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
                lastSeenEventKey: null,
                lastEventTime: null
            };
        }
        try {
            const obj = JSON.parse(raw);
            return {
                stateIndex: Number.isInteger(obj.stateIndex) ? obj.stateIndex : 0,
                lastSeenEventKey: obj.lastSeenEventKey ?? null,
                lastEventTime: obj.lastEventTime ?? null
            };
        } catch {
            return {
                stateIndex: 0,
                lastSeenEventKey: null,
                lastEventTime: null
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

    // Functie om huidige entity states op te halen en initiele UI te bepalen
    async function fetchInitialState(token) {
        try {
            console.log(" Ophalen huidige entity states...");
            console.log("   Token beschikbaar:", !!token);
            console.log("   Fetching:", `/api/states/${WATCH_ENTITY_HELP}`);
            console.log("   Fetching:", `/api/states/${WATCH_ENTITY_COLLEAGUE}`);
            
            // Haal beide entities op
            const helpRes = await fetch(`/api/states/${WATCH_ENTITY_HELP}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const colleagueRes = await fetch(`/api/states/${WATCH_ENTITY_COLLEAGUE}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            console.log("   Help response status:", helpRes.status, helpRes.statusText);
            console.log("   Colleague response status:", colleagueRes.status, colleagueRes.statusText);

            if (!helpRes.ok || !colleagueRes.ok) {
                console.warn(" Kon entities niet ophalen, gebruik lokale state");
                setRoom1State(demo.stateIndex);
                updateCountersUI(demo.stateIndex);
                return;
            }

            const helpState = await helpRes.json();
            const colleagueState = await colleagueRes.json();

            console.log("   help state:", helpState.state);
            console.log("   help last_changed:", helpState.last_changed);
            console.log("   colleague state:", colleagueState.state);
            console.log("   colleague last_changed:", colleagueState.last_changed);

            // Bepaal welke entity het laatst is gewijzigd
            const helpTime = new Date(helpState.last_changed).getTime();
            const colleagueTime = new Date(colleagueState.last_changed).getTime();

            // Sla de laatste colleague value op voor toggle tracking
            const colleagueValue = colleagueState.state;
            localStorage.setItem(COLLEAGUE_TOGGLE_KEY, colleagueValue);

            if (helpTime > colleagueTime) {
                // Help is het laatst gewijzigd -> rood
                console.log("   ➡️ Help entity is nieuwer -> ROOD");
                demo.stateIndex = 2;
            } else if (colleagueTime > helpTime) {
                // Colleague is het laatst gewijzigd
                // Parse de value: als het een getal is, gebruik modulo 2 voor toggle
                // Anders zoek naar keywords als "present" of een teller
                let isPresent = false;
                
                if (colleagueValue.includes("present") || colleagueValue.includes("1")) {
                    isPresent = true;
                } else if (colleagueValue.includes("absent") || colleagueValue.includes("0")) {
                    isPresent = false;
                } else {
                    // Gebruik timestamp modulo 2
                    const numValue = parseFloat(colleagueValue) || 0;
                    const counter = Math.floor(numValue);
                    isPresent = (counter % 2) === 1; // Oneven = present
                }
                
                if (isPresent) {
                    console.log("   ➡️ Colleague aanwezig -> ORANJE");
                    demo.stateIndex = 1;
                } else {
                    console.log("   ➡️ Geen melding -> GROEN");
                    demo.stateIndex = 0;
                }
            } else {
                // Beide gelijk of onbekend -> default groen
                console.log("   ➡️ Geen recente updates -> GROEN");
                demo.stateIndex = 0;
            }

            // Update UI met de opgehaalde state
            setRoom1State(demo.stateIndex);
            updateCountersUI(demo.stateIndex);
            saveState(demo);
            
            console.log(`   ✅ Initiele status: ${STATES[demo.stateIndex].name}`);
        } catch (err) {
            console.warn("⚠️ Fout bij ophalen states:", err.message);
            // Fallback naar lokale state
            setRoom1State(demo.stateIndex);
            updateCountersUI(demo.stateIndex);
        }
    }

    async function connectWebSocket() {
        console.log("🔌 Starting WebSocket connection...");
        
        let token;
        try {
            token = getToken();
            console.log("✓ Token opgehaald:", token.substring(0, 20) + "...");
            console.log("   Token length:", token.length);
        } catch (err) {
            console.error("✗ Token error:", err.message);
            console.error("   Stack:", err.stack);
            showToast(`ERROR: ${err.message}`);
            setTimeout(() => connectWebSocket().catch(console.error), 5000);
            return;
        }

        const url = wsUrl();
        console.log("🌐 WebSocket URL:", url);
        
        try {
            console.log("   Creating WebSocket...");
            ws = new WebSocket(url);
            console.log("   WebSocket object created");
        } catch (err) {
            console.error("✗ WebSocket creation failed:", err);
            console.error("   Stack:", err.stack);
            showToast(`WebSocket error: ${err.message}`);
            return;
        }

        ws.onopen = () => {
            console.log("✓✓✓ WebSocket connected! ✓✓✓");
            showToast("✓ Verbonden met Home Assistant");
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            console.log("📨 Message received:", msg.type, msg);

            if (msg.type === "auth_required") {
                console.log("🔐 Authenticating...");
                ws.send(JSON.stringify({ type: "auth", access_token: token }));
                return;
            }

            if (msg.type === "auth_ok") {
                console.log("✓✓✓ Authenticated! ✓✓✓");
                
                // Haal eerst de huidige state op voordat we events gaan luisteren
                fetchInitialState(token).then(() => {
                    // Nu pas subscriben op events
                    sendWS({ type: "subscribe_events", event_type: "state_changed" });
                    console.log("✓ Geabonneerd op state_changed events");
                }).catch(err => {
                    console.error("❌ Fout bij initial state fetch:", err);
                    console.error("   Stack:", err.stack);
                    // Subscribe toch maar
                    sendWS({ type: "subscribe_events", event_type: "state_changed" });
                });
                
                return;
            }

            if (msg.type === "auth_invalid") {
                console.error("✗✗✗ Auth invalid - token is verkeerd! ✗✗✗");
                showToast("✗ Token is verkeerd of verlopen");
                return;
            }

            if (msg.type === "result") {
                console.log("📊 Result message:", msg);
                return;
            }

            if (msg.type === "event" && msg.event?.event_type === "state_changed") {
                const e = msg.event.data;
                const entityId = e.entity_id;
                
                // ⚡ LOG ALLES - zelfs gefilterde events
                console.log("========================================");
                console.log("⚡ STATE_CHANGED EVENT ONTVANGEN");
                console.log("   Entity ID:", entityId);
                console.log("   Full event data:", e);
                console.log("   Watching for HELP:", WATCH_ENTITY_HELP);
                console.log("   Watching for COLLEAGUE:", WATCH_ENTITY_COLLEAGUE);
                console.log("   Match HELP?", entityId === WATCH_ENTITY_HELP);
                console.log("   Match COLLEAGUE?", entityId === WATCH_ENTITY_COLLEAGUE);
                console.log("========================================");
                
                // Check welke knop gedrukt is (filter eerst)
                if (entityId !== WATCH_ENTITY_HELP && entityId !== WATCH_ENTITY_COLLEAGUE) {
                    console.log("❌ Entity gefilterd - niet relevant voor ons");
                    return;
                }

                const newValue = e.new_state?.state;
                const oldValue = e.old_state?.state;
                
                console.log(`🔔 Event ontvangen: ${entityId}`);
                console.log(`   Oude waarde: ${oldValue}`);
                console.log(`   Nieuwe waarde: ${newValue}`);
                console.log(`   Huidige status: ${STATES[demo.stateIndex].name}`);

                // Als de waarde niet veranderd is, negeer dan (maar wel loggen)
                if (oldValue === newValue) {
                    console.log("   ⚠️ Waarde onveranderd - event genegeerd");
                    return;
                }

                const eventKey = `${entityId}:${newValue}`;
                const now = Date.now();

                // Bescherming tegen dubbele events binnen 500ms
                if (demo.lastSeenEventKey === eventKey && demo.lastEventTime && (now - demo.lastEventTime) < 500) {
                    console.log("   ⚠️ Duplicate event binnen 500ms - genegeerd");
                    return;
                }
                
                demo.lastSeenEventKey = eventKey;
                demo.lastEventTime = now;

                // Bepaal de status op basis van welke entity veranderd is
                if (entityId === WATCH_ENTITY_HELP) {
                    // Korte klik → Altijd naar "Hulp gevraagd" (state 2)
                    console.log("   ➡️ Single click gedetecteerd → ROOD (hulp gevraagd)");
                    demo.stateIndex = 2;
                } else if (entityId === WATCH_ENTITY_COLLEAGUE) {
                    // Double click → Bepaal op basis van entity value (consistent over devices)
                    let isPresent = false;
                    
                    if (newValue.includes("present") || newValue.includes("1")) {
                        isPresent = true;
                    } else if (newValue.includes("absent") || newValue.includes("0")) {
                        isPresent = false;
                    } else {
                        // Gebruik timestamp modulo 2
                        const numValue = parseFloat(newValue) || 0;
                        const counter = Math.floor(numValue);
                        isPresent = (counter % 2) === 1; // Oneven = present
                    }
                    
                    // Sla laatste value op
                    localStorage.setItem(COLLEAGUE_TOGGLE_KEY, newValue);
                    
                    if (isPresent) {
                        console.log("   ➡️ Double click → ORANJE (collega aanwezig)");
                        demo.stateIndex = 1;
                    } else {
                        console.log("   ➡️ Double click → GROEN (geen melding)");
                        demo.stateIndex = 0;
                    }
                }

                // Update UI
                setRoom1State(demo.stateIndex);
                updateCountersUI(demo.stateIndex);

                // Toast
                showToast(STATES[demo.stateIndex].toast);

                // Save
                saveState(demo);
                
                console.log(`   ✅ Status bijgewerkt naar: ${STATES[demo.stateIndex].name}`);
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
    console.log("========================================");
    console.log("🔧 Starting connection sequence...");
    console.log("   window.HA_CONFIG:", window.HA_CONFIG);
    console.log("   localStorage.hassTokens:", !!localStorage.getItem("hassTokens"));
    console.log("   localStorage.ha_token:", !!localStorage.getItem("ha_token"));
    console.log("========================================");
    
    connectWebSocket().catch((e) => {
        console.error("💥 Fatal error:", e);
        console.error("   Stack:", e.stack);
        showToast(`ERROR: ${e.message}`);
    });

});