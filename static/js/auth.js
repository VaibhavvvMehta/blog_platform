onst loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        fetch("/api/token/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: email,   // DRF expects "username"
                password: password
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Invalid credentials");
            }
            return response.json();
        })
        .then(data => {
            // Store token
            localStorage.setItem("token", data.token);

            // Redirect to dashboard
            window.location.href = "/dashboard/";
        })
        .catch(error => {
            alert("Login failed. Please check your credentials.");
            console.error(error);
        });
    });
}



// ---- LOGOUT ----
function logout() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/login/";
        return;
    }

    fetch("/api/users/logout/", {
        method: "POST",
        headers: {
            "Authorization": "Token " + token
        }
    })
    .finally(() => {
        // Clear token whether API succeeds or not
        localStorage.removeItem("token");
        window.location.href = "/login/";
    });
}



// ---- AUTH GUARD ----
// Call this on protected pages
// function requireAuth() {
//     const token = localStorage.getItem("token");

//     if (!token) {
//         window.location.href = "/login/";
//     }
// }