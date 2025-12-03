document.getElementById("signupbutton").addEventListener('click', function() {
    const name = document.getElementById("sname").value;
    const email = document.getElementById("Signupemail").value;
    const password = document.getElementById("Signuppassword").value;
    const confirmedPassword = document.getElementById("cpassword").value;

    const nameError = document.getElementById("name-error");
    const emailError = document.getElementById("Semail-error");
    const passError = document.getElementById("Spass-error");
    const cpassError = document.getElementById("cpass-error");

    nameError.textContent = '';
    emailError.textContent = '';
    passError.textContent = '';
    cpassError.textContent = '';
    let hasError = false;

    if (name.length === 0) { 
        nameError.textContent = "Name required"; 
        hasError = true; 
    }
    if (!email.includes("@") || !email.includes(".com")) { 
        emailError.textContent = "Invalid email"; 
        hasError = true; 
    }
    if (password.length < 8) { 
        passError.textContent = "Password must be at least 8 characters"; 
        hasError = true; 
    }
    if (confirmedPassword !== password) { 
        cpassError.textContent = "Passwords do not match"; 
        hasError = true; 
    }

    if (hasError) return;

    fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
        if (data.message === "User registered successfully!" || data.success) {
            if (data.user_id) {
                localStorage.setItem('userId', data.user_id);
                localStorage.setItem('user_id', data.user_id);
            }
            window.location.href = "mainpage.html"; 
        } else {
            alert(data.message || "Registration failed");
        }
    })
    .catch(function(err) {
        console.error('Signup error:', err);
        alert("Registration failed. Please try again.");
    });
});
