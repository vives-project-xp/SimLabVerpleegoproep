window.addEventListener("DOMContentLoaded", () => {

    // =========================
    // Version & Debug Info
    // =========================
    const SCRIPT_VERSION = "20260312-001";
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

    function applyState(index, showNotification = false) {
        demo.stateIndex = index;
        setRoom1State(demo.stateIndex);
        updateCountersUI(demo.stateIndex);
        saveState(demo);

        if (showNotification) {
            showToast(STATES[demo.stateIndex].toast);
        }
    }

    function parseExplicitColleagueState(value) {
        if (typeof value !== "string") {
            return null;
        }

        const normalized = value.toLowerCase();
        if (normalized.includes("present") || normalized === "on" || normalized === "true") {
            return true;
        }

        if (normalized.includes("absent") || normalized === "off" || normalized === "false") {
            return false;
        }

        return null;
    }

    function toggleColleaguePresence() {
        demo.stateIndex = (demo.stateIndex === 1) ? 0 : 1;
    }

    // --- Home Assistant Auth helpers
    function parseStoredJson(storage, key) {
        const raw = storage.getItem(key);
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    function buildAuthContext(data, source) {
        if (!data?.accessToken) {
            return null;
        }

        return {
            accessToken: data.accessToken.trim(),
            refreshToken: data.refreshToken?.trim() || null,
            expires: Number(data.expires) || null,
            hassUrl: data.hassUrl?.trim() || location.origin,
            clientId: data.clientId?.trim() || `${location.origin}/`,
            source
        };
    }

    function getAuthContext() {
        const injectedConfig = window.HA_CONFIG;
        if (injectedConfig?.token) {
            return buildAuthContext({
                accessToken: injectedConfig.token,
                refreshToken: injectedConfig.refresh_token,
                expires: injectedConfig.expires,
                hassUrl: injectedConfig.url,
                clientId: injectedConfig.clientId
            }, "window.HA_CONFIG");
        }

        const localSession = parseStoredJson(localStorage, "hassTokens");
        if (localSession?.access_token) {
            return buildAuthContext({
                accessToken: localSession.access_token,
                refreshToken: localSession.refresh_token,
                expires: localSession.expires,
                hassUrl: localSession.hassUrl,
                clientId: localSession.clientId
            }, "localStorage.hassTokens");
        }

        const sessionSession = parseStoredJson(sessionStorage, "hassTokens");
        if (sessionSession?.access_token) {
            return buildAuthContext({
                accessToken: sessionSession.access_token,
                refreshToken: sessionSession.refresh_token,
                expires: sessionSession.expires,
                hassUrl: sessionSession.hassUrl,
                clientId: sessionSession.clientId
            }, "sessionStorage.hassTokens");
        }

        const token = localStorage.getItem("ha_token");
        if (token?.trim()) {
            return buildAuthContext({
                accessToken: token,
                hassUrl: window.HA_CONFIG?.url || location.origin,
                clientId: `${location.origin}/`
            }, "localStorage.ha_token");
        }

        throw new Error("Home Assistant token niet gevonden. Gebruik hassTokens uit de browserconsole of localStorage 'ha_token'.");
    }

    function isAccessTokenExpired(auth) {
        if (!auth?.expires) {
            return false;
        }

        return Date.now() >= (auth.expires - 60 * 1000);
    }

    function saveSessionTokens(auth, expiresInSeconds) {
        if (!auth?.refreshToken) {
            return;
        }

        const storedSession = {
            access_token: auth.accessToken,
            token_type: "Bearer",
            expires_in: expiresInSeconds,
            hassUrl: auth.hassUrl,
            clientId: auth.clientId,
            expires: auth.expires,
            refresh_token: auth.refreshToken
        };

        if (auth.source === "localStorage.hassTokens") {
            localStorage.setItem("hassTokens", JSON.stringify(storedSession));
        }

        if (auth.source === "sessionStorage.hassTokens") {
            sessionStorage.setItem("hassTokens", JSON.stringify(storedSession));
        }
    }

    async function refreshAccessToken(auth) {
        if (!auth?.refreshToken) {
            throw new Error("Geen refresh token beschikbaar.");
        }

        const tokenEndpoint = `${auth.hassUrl.replace(/\/$/, "")}/auth/token`;
        const body = new URLSearchParams({
            grant_type: "refresh_token",
            client_id: auth.clientId,
            refresh_token: auth.refreshToken
        });

        const response = await fetch(tokenEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body
        });

        if (!response.ok) {
            throw new Error(`Token refresh mislukt (${response.status} ${response.statusText})`);
        }

        const refreshed = await response.json();
        const expiresInSeconds = Number(refreshed.expires_in) || 1800;
        const nextAuth = {
            ...auth,
            accessToken: refreshed.access_token.trim(),
            refreshToken: refreshed.refresh_token?.trim() || auth.refreshToken,
            expires: Date.now() + (expiresInSeconds * 1000),
            source: auth.source
        };

        saveSessionTokens(nextAuth, expiresInSeconds);
        return nextAuth;
    }

    async function getValidAuthContext() {
        let auth = currentAuth || getAuthContext();

        if (isAccessTokenExpired(auth) && auth.refreshToken) {
            console.log("🔄 Access token verlopen, vernieuwen via refresh token...");
            auth = await refreshAccessToken(auth);
        }

        return auth;
    }

    function wsUrl(auth) {
        const configuredUrl = auth?.hassUrl || window.HA_CONFIG?.url;

        if (configuredUrl) {
            const baseUrl = configuredUrl;
            return baseUrl.replace(/^http/, "ws") + "/api/websocket";
        }

        // Anders: current host
        const proto = location.protocol === "https:" ? "wss" : "ws";
        return `${proto}://${location.host}/api/websocket`;
    }

    let ws = null;
    let msgId = 1;
    let reconnectEnabled = true;
    let suppressNextReconnect = false;
    let currentAuth = null;

    function sendWS(obj) {
        obj.id = msgId++;
        ws.send(JSON.stringify(obj));
        return obj.id;
    }

    function scheduleReconnect(delayMs = 3000) {
        if (!reconnectEnabled) {
            return;
        }

        setTimeout(() => {
            connectWebSocket().catch(console.error);
        }, delayMs);
    }

    function closeSocketWithoutReconnect() {
        if (!ws) {
            return;
        }

        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            suppressNextReconnect = true;
            ws.close();
        }
    }

    // --- MAIN demo logic on event
    let demo = loadState();
    applyState(demo.stateIndex);

    // Functie om huidige entity states op te halen en initiele UI te bepalen
    async function fetchInitialState(token) {
        try {
            console.log("📥 Ophalen huidige entity states...");
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
                console.warn("⚠️ Kon entities niet ophalen, gebruik lokale state");
                applyState(demo.stateIndex);
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
                const explicitState = parseExplicitColleagueState(colleagueValue);

                if (explicitState === true) {
                    console.log("   ➡️ Colleague aanwezig -> ORANJE");
                    demo.stateIndex = 1;
                } else if (explicitState === false) {
                    console.log("   ➡️ Geen melding -> GROEN");
                    demo.stateIndex = 0;
                } else {
                    // Voor numerieke/timestamp waarden: gebruik vorige lokale status als basis.
                    toggleColleaguePresence();
                    console.log("   ➡️ Colleague event zonder expliciete status -> TOGGLE");
                }
            } else {
                // Beide gelijk of onbekend -> default groen
                console.log("   ➡️ Geen recente updates -> GROEN");
                demo.stateIndex = 0;
            }

            // Update UI met de opgehaalde state
            applyState(demo.stateIndex);
            
            console.log(`   ✅ Initiele status: ${STATES[demo.stateIndex].name}`);
        } catch (err) {
            console.warn("⚠️ Fout bij ophalen states:", err.message);
            // Fallback naar lokale state
            applyState(demo.stateIndex);
        }
    }

    async function connectWebSocket() {
        console.log("🔌 Starting WebSocket connection...");
        
        let auth;
        try {
            reconnectEnabled = true;
            auth = await getValidAuthContext();
            currentAuth = auth;
            console.log("✓ Token opgehaald uit:", auth.source);
            console.log("   Token prefix:", auth.accessToken.substring(0, 20) + "...");
            console.log("   Token length:", auth.accessToken.length);
        } catch (err) {
            reconnectEnabled = false;
            console.warn("ℹ️ Home Assistant niet beschikbaar, demo mode actief:", err.message);
            showToast("Demo mode actief.");
            return;
        }

        const url = wsUrl(auth);
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
                ws.send(JSON.stringify({ type: "auth", access_token: auth.accessToken }));
                return;
            }

            if (msg.type === "auth_ok") {
                console.log("✓✓✓ Authenticated! ✓✓✓");
                
                // Haal eerst de huidige state op voordat we events gaan luisteren
                fetchInitialState(auth.accessToken).then(() => {
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
                if (currentAuth?.refreshToken) {
                    console.warn("🔄 Access token geweigerd, probeer refresh token...");
                    showToast("HA token verlopen, vernieuwen...");
                    refreshAccessToken(currentAuth).then((refreshedAuth) => {
                        currentAuth = refreshedAuth;
                        closeSocketWithoutReconnect();
                        connectWebSocket().catch(console.error);
                    }).catch((refreshError) => {
                        reconnectEnabled = false;
                        console.error("✗ Token refresh mislukt:", refreshError.message);
                        showToast("✗ HA login mislukt, demo mode actief");
                        closeSocketWithoutReconnect();
                    });
                    return;
                }

                reconnectEnabled = false;
                showToast("✗ Token is verkeerd of verlopen");
                closeSocketWithoutReconnect();
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
                    // Double click: expliciete values respecteren, anders toggle per event.
                    const explicitState = parseExplicitColleagueState(newValue);
                    
                    // Sla laatste value op
                    localStorage.setItem(COLLEAGUE_TOGGLE_KEY, newValue);
                    
                    if (explicitState === true) {
                        console.log("   ➡️ Double click → ORANJE (collega aanwezig)");
                        demo.stateIndex = 1;
                    } else if (explicitState === false) {
                        console.log("   ➡️ Double click → GROEN (geen melding)");
                        demo.stateIndex = 0;
                    } else {
                        toggleColleaguePresence();
                        console.log("   ➡️ Double click timestamp-event → TOGGLE");
                    }
                }

                // Update UI
                applyState(demo.stateIndex, true);
                
                console.log(`   ✅ Status bijgewerkt naar: ${STATES[demo.stateIndex].name}`);
            }
        };

        ws.onerror = (err) => {
            console.error("✗ WebSocket error:", err);
            showToast("✗ Verbindingsfout");
        };

        ws.onclose = () => {
            if (suppressNextReconnect) {
                suppressNextReconnect = false;
                return;
            }

            if (!reconnectEnabled) {
                console.warn("WebSocket closed, reconnect uitgeschakeld.");
                return;
            }

            console.warn("WebSocket closed, reconnecting in 3s...");
            showToast("Verbinding verbroken, opnieuw verbinden...");
            scheduleReconnect(3000);
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