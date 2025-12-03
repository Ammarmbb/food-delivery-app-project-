// Toggle Admin Panel
const adminBtn = document.getElementById("admincollapsable");
const adminPanel = document.getElementById("loginadmin");
adminBtn.addEventListener("click", () => {
    adminPanel.classList.toggle("open");
});

// Toggle Delivery Panel
const deliveryBtn = document.getElementById("deliverycollapsable");
const deliveryPanel = document.getElementById("login-delivery");
deliveryBtn.addEventListener("click", () => {
    deliveryPanel.classList.toggle("open");
});

// Clear errors on input for admin form
const adminEmailInput = document.getElementById("adminemail");
const adminPassInput = document.getElementById("adminpass");

if (adminEmailInput) {
    adminEmailInput.addEventListener('input', function() {
        const errorEl = document.getElementById("aemailerror");
        errorEl.textContent = "";
        errorEl.classList.remove('has-content');
    });
}

if (adminPassInput) {
    adminPassInput.addEventListener('input', function() {
        const errorEl = document.getElementById("apasserror");
        errorEl.textContent = "";
        errorEl.classList.remove('has-content');
    });
}

// Admin Form Validation
document.getElementById("adminsubmit").addEventListener("click", function() {
    const email = document.getElementById("adminemail").value;
    const password = document.getElementById("adminpass").value;
    const emailError = document.getElementById("aemailerror");
    const passError = document.getElementById("apasserror");

    emailError.textContent = "";
    passError.textContent = "";
    let hasError = false;

    if (!email.includes("@") || !email.includes(".com")) {
        emailError.textContent = "Invalid email";
        emailError.classList.add('has-content');
        hasError = true;
    }

    if (password.length < 1) {
        passError.textContent = "Password Invalid";
        passError.classList.add('has-content');
        hasError = true;
    }

    if (hasError) return;

    fetch('/adminlogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === "Login successful!" || data.success) {
            if (data.admin_id) {
                localStorage.setItem('adminId', data.admin_id);
            }
            window.location.href = "adminpage.html";
        } else {
            alert(data.message || "Invalid credentials");
        }
    })
    .catch(err => {
        console.error('Login error:', err);
        alert("Login failed. Please try again.");
    });
});

// Clear errors on input for delivery form
const deliveryEmailInput = document.getElementById("deliveryemail");
const deliveryPassInput = document.getElementById("deliverypass");

if (deliveryEmailInput) {
    deliveryEmailInput.addEventListener('input', function() {
        const errorEl = document.getElementById("demailerror");
        errorEl.textContent = "";
        errorEl.classList.remove('has-content');
    });
}

if (deliveryPassInput) {
    deliveryPassInput.addEventListener('input', function() {
        const errorEl = document.getElementById("dpasserror");
        errorEl.textContent = "";
        errorEl.classList.remove('has-content');
    });
}

// Delivery Form Validation
document.getElementById("deliverysubmit").addEventListener("click", function() {
    const email = document.getElementById("deliveryemail").value;
    const password = document.getElementById("deliverypass").value;
    const emailError = document.getElementById("demailerror");
    const passError = document.getElementById("dpasserror");

    emailError.textContent = "";
    passError.textContent = "";
    let hasError = false;

    if (!email.includes("@") || !email.includes(".com")) {
        emailError.textContent = "Invalid email";
        emailError.classList.add('has-content');
        hasError = true;
    }

    if (password.length < 4) {
        passError.textContent = "Password must be at least 4 characters";
        passError.classList.add('has-content');
        hasError = true;
    }

    if (hasError) return;

    fetch('/deliverylogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === "Login successful!" || data.success) {
            if (data.delivery_id) {
                localStorage.setItem('deliveryId', data.delivery_id);
            }
            window.location.href = "delivery.html";
        } else {
            alert(data.message || "Invalid credentials");
        }
    })
    .catch(err => {
        console.error('Login error:', err);
        alert("Login failed. Please try again.");
    });
});
