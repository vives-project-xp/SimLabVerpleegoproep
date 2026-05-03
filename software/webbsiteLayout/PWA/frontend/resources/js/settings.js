window.addEventListener("DOMContentLoaded", () => {
    const userInfo = document.getElementById("userInfo");
    const logoutBtn = document.getElementById("logoutBtn");
    const changeOwnPasswordBtn = document.getElementById("changeOwnPasswordBtn");
    const changeStudentPasswordBtn = document.getElementById("changeStudentPasswordBtn");
    const ownPasswordMsg = document.getElementById("ownPasswordMsg");
    const studentPasswordMsg = document.getElementById("studentPasswordMsg");

    function clearMessage(el) {
        if (!el) return;
        el.textContent = "";
        el.classList.remove("success", "error");
    }

    function setMessage(el, text, type) {
        if (!el) return;
        el.textContent = text;
        el.classList.remove("success", "error");
        el.classList.add(type);
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

            if (data.user.role !== "leerkracht") {
                window.location.href = "/";
                return null;
            }

            if (userInfo) {
                userInfo.textContent = `${data.user.username} (Leerkracht)`;
            }

            return data.user;
        } catch (err) {
            window.location.href = "/login.html";
            return null;
        }
    }

    async function changeOwnPassword() {
        clearMessage(ownPasswordMsg);

        const currentPassword = document.getElementById("currentPassword")?.value || "";
        const newPassword = document.getElementById("newPassword")?.value || "";
        const confirmPassword = document.getElementById("confirmPassword")?.value || "";

        try {
            const res = await fetch("/api/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Wachtwoord wijzigen mislukt");
            }

            setMessage(ownPasswordMsg, data.message || "Eigen wachtwoord gewijzigd", "success");

            document.getElementById("currentPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("confirmPassword").value = "";
        } catch (err) {
            setMessage(ownPasswordMsg, err.message || "Wachtwoord wijzigen mislukt", "error");
        }
    }

    async function changeStudentPassword() {
        clearMessage(studentPasswordMsg);

        const newPassword = document.getElementById("studentNewPassword")?.value || "";
        const confirmPassword = document.getElementById("studentConfirmPassword")?.value || "";

        try {
            const res = await fetch("/api/change-student-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    newPassword,
                    confirmPassword
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Wachtwoord leerling wijzigen mislukt");
            }

            setMessage(studentPasswordMsg, data.message || "Wachtwoord leerling gewijzigd", "success");

            document.getElementById("studentNewPassword").value = "";
            document.getElementById("studentConfirmPassword").value = "";
        } catch (err) {
            setMessage(studentPasswordMsg, err.message || "Wachtwoord leerling wijzigen mislukt", "error");
        }
    }

    if (changeOwnPasswordBtn) {
        changeOwnPasswordBtn.addEventListener("click", changeOwnPassword);
    }

    if (changeStudentPasswordBtn) {
        changeStudentPasswordBtn.addEventListener("click", changeStudentPassword);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await fetch("/api/logout", {
                    method: "POST"
                });
            } catch (err) {
                console.error("Fout bij uitloggen:", err);
            }

            window.location.href = "/login.html";
        });
    }

    fetchCurrentUser();
});
