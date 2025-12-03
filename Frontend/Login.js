document.getElementById("loginbutton").addEventListener('click', function() {
    const email = document.getElementById("loginemail").value;
    const password = document.getElementById("loginpassword").value;

    const lemail = document.getElementById("lemail-error");
    const lpass = document.getElementById("lpass-error");
    lemail.textContent = '';
    lpass.textContent = '';
    let hasError = false;

    if (!email.includes("@") || !email.includes(".com")) { 
        lemail.textContent = "Invalid email"; 
        hasError = true; 
    }
    if (password.length < 8) { 
        lpass.textContent = "Password must be at least 8 characters"; 
        hasError = true; 
    }

    if (hasError) return;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
        if (data.message === "Login successful!" || data.success) {
            if (data.user_id) {
                localStorage.setItem('userId', data.user_id);
                localStorage.setItem('user_id', data.user_id);
            }
            window.location.href = "mainpage.html";
        } else {
            alert(data.message || "Invalid credentials");
        }
    })
    .catch(function(err) {
        console.error('Login error:', err);
        alert("Login failed. Please try again.");
    });
});
