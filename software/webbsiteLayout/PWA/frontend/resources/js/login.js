window.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const errorBox = document.getElementById("loginError");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (errorBox) {
            errorBox.textContent = "";
        }

        const username = document.getElementById("username")?.value?.trim() || "";
        const password = document.getElementById("password")?.value || "";

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Login mislukt");
            }

            window.location.href = "/";
        } catch (err) {
            if (errorBox) {
                errorBox.textContent = err.message || "Login mislukt";
            }
        }
    });
});
