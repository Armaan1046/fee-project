// ==========================================
// 1. GLOBAL VARIABLES & DOM ELEMENTS
// ==========================================
const API_URL = 'http://localhost:3000/passwords';

// Form Elements
const passwordForm = document.getElementById('password-form');
const websiteInput = document.getElementById('website');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const editIdInput = document.getElementById('edit-id');

// Buttons
const togglePasswordBtn = document.getElementById('toggle-password-btn');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Strength Indicator Elements
const strengthText = document.getElementById('strength-text');
const ruleLength = document.getElementById('rule-length');
const ruleUpper = document.getElementById('rule-upper');
const ruleLower = document.getElementById('rule-lower');
const ruleNumber = document.getElementById('rule-number');
const ruleSpecial = document.getElementById('rule-special');
const errorMessage = document.getElementById('error-message');

// Display Container
const passwordsContainer = document.getElementById('passwords-container');

// State
let isEditing = false;
let isPasswordStrong = false; // We only allow saving if this is true


// ==========================================
// 2. EVENT LISTENERS
// ==========================================

// Run this when the page loads
document.addEventListener('DOMContentLoaded', fetchPasswords);

// Listen for form submission
passwordForm.addEventListener('submit', handleFormSubmit);

// Listen for typing in the password field to check strength live
passwordInput.addEventListener('input', checkPasswordStrength);

// Toggle password visibility in the form
togglePasswordBtn.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePasswordBtn.textContent = '🙈 Hide';
    } else {
        passwordInput.type = 'password';
        togglePasswordBtn.textContent = '👁️ Show';
    }
});

// Cancel edit mode
cancelBtn.addEventListener('click', resetForm);

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('theme-toggle');

// Load theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggleBtn.textContent = '☀️ Light Mode';
}

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        themeToggleBtn.textContent = '🌙 Dark Mode';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '☀️ Light Mode';
        localStorage.setItem('theme', 'dark');
    }
});


// ==========================================
// 3. PASSWORD STRENGTH CHECKER LOGIC
// ==========================================
function checkPasswordStrength() {
    const pwd = passwordInput.value;
    
    // Regular Expressions to check specific patterns
    const hasLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[@$!%*?&]/.test(pwd);

    // Update the UI checklist visually (✅ or ❌)
    updateRuleUI(ruleLength, hasLength, "Minimum 8 characters");
    updateRuleUI(ruleUpper, hasUpper, "At least 1 uppercase letter");
    updateRuleUI(ruleLower, hasLower, "At least 1 lowercase letter");
    updateRuleUI(ruleNumber, hasNumber, "At least 1 number");
    updateRuleUI(ruleSpecial, hasSpecial, "At least 1 special character (@, $, !, %, *, ?, &)");

    // Calculate score (0 to 5)
    let score = 0;
    if (hasLength) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    // Determine Strength Level
    if (pwd.length === 0) {
        strengthText.textContent = "None";
        strengthText.style.color = "var(--text-muted)";
        isPasswordStrong = false;
    } else if (score <= 2) {
        strengthText.textContent = "Weak";
        strengthText.style.color = "var(--strength-weak)";
        isPasswordStrong = false;
    } else if (score >= 3 && score <= 4) {
        strengthText.textContent = "Medium";
        strengthText.style.color = "var(--strength-medium)";
        isPasswordStrong = false;
    } else if (score === 5) {
        strengthText.textContent = "Strong";
        strengthText.style.color = "var(--strength-strong)";
        isPasswordStrong = true;
    }

    // Enable or disable the save button based on strength
    saveBtn.disabled = !isPasswordStrong;
    
    // Hide error message if they start typing again
    errorMessage.classList.add('hidden');
}

// Helper to update the text and color of the rules
function updateRuleUI(element, isValid, text) {
    if (isValid) {
        element.innerHTML = `✅ ${text}`;
        element.classList.add('valid-rule');
    } else {
        element.innerHTML = `❌ ${text}`;
        element.classList.remove('valid-rule');
    }
}


// ==========================================
// 4. API CALLS (CRUD OPERATIONS)
// ==========================================

// READ: Fetch passwords from backend
async function fetchPasswords() {
    try {
        const response = await fetch(API_URL);
        const passwords = await response.json();
        renderPasswords(passwords);
    } catch (error) {
        console.error("Error fetching passwords:", error);
        passwordsContainer.innerHTML = '<p class="error-message">Failed to load passwords. Make sure the backend server is running!</p>';
    }
}

// CREATE / UPDATE: Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault(); // Prevent page reload

    if (!isPasswordStrong) {
        errorMessage.textContent = "Cannot save: Password is not strong enough!";
        errorMessage.classList.remove('hidden');
        return;
    }

    // Get values from form
    const payload = {
        website: websiteInput.value,
        username: usernameInput.value,
        password: passwordInput.value
    };

    try {
        if (isEditing) {
            // Update existing (PUT)
            const id = editIdInput.value;
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Create new (POST)
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        // Reset form and refresh list
        resetForm();
        fetchPasswords();

    } catch (error) {
        console.error("Error saving password:", error);
        errorMessage.textContent = "An error occurred while saving.";
        errorMessage.classList.remove('hidden');
    }
}

// DELETE: Remove a password
async function deletePassword(id) {
    // Optional confirmation
    if (!confirm("Are you sure you want to delete this password?")) return;

    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        fetchPasswords(); // Refresh list after deleting
    } catch (error) {
        console.error("Error deleting password:", error);
        alert("Failed to delete password.");
    }
}


// ==========================================
// 5. DOM MANIPULATION & RENDERING
// ==========================================

// Render the list of passwords to the screen
function renderPasswords(passwords) {
    // Clear current content
    passwordsContainer.innerHTML = '';

    // Handle empty state
    if (passwords.length === 0) {
        passwordsContainer.innerHTML = '<p class="empty-state">No passwords saved yet. Add a strong one above!</p>';
        return;
    }

    // Loop through each password and create a card for it
    passwords.forEach(entry => {
        // Create card div
        const card = document.createElement('div');
        card.className = 'password-card';

        // Set card HTML content
        // Notice how we use data attributes (data-pwd) to store the real password for showing/hiding
        card.innerHTML = `
            <div class="card-header">
                <h3>${entry.website}</h3>
            </div>
            <div class="card-body">
                <p><strong>Username:</strong> ${entry.username}</p>
                <p>
                    <strong>Password:</strong> 
                    <span class="hidden-password" id="display-pwd-${entry.id}">••••••••</span>
                </p>
            </div>
            <div class="card-actions">
                <button class="action-btn show-btn" onclick="toggleDisplayPassword('${entry.id}', '${entry.password}')">Show</button>
                <button class="action-btn edit-btn" onclick="editPassword('${entry.id}', '${entry.website}', '${entry.username}', '${entry.password}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deletePassword('${entry.id}')">Delete</button>
            </div>
        `;

        // Add card to container
        passwordsContainer.appendChild(card);
    });
}

// Toggle showing/hiding individual password in the list
// Note: We're keeping it simple by defining this in global scope so inline onclick works
window.toggleDisplayPassword = function(id, realPassword) {
    const pwdSpan = document.getElementById(`display-pwd-${id}`);
    const btn = pwdSpan.parentElement.parentElement.nextElementSibling.querySelector('.show-btn');
    
    if (pwdSpan.textContent === '••••••••') {
        pwdSpan.textContent = realPassword;
        pwdSpan.style.fontFamily = 'inherit'; // Remove monospace hiding style
        btn.textContent = 'Hide';
    } else {
        pwdSpan.textContent = '••••••••';
        pwdSpan.style.fontFamily = 'monospace';
        btn.textContent = 'Show';
    }
};

// Prepare the form for editing an existing password
window.editPassword = function(id, website, username, password) {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Populate form
    websiteInput.value = website;
    usernameInput.value = username;
    passwordInput.value = password;
    editIdInput.value = id;

    // Trigger strength check so the UI updates
    checkPasswordStrength();

    // Update State & UI
    isEditing = true;
    document.getElementById('form-title').textContent = "Edit Password";
    saveBtn.textContent = "Update Password";
    cancelBtn.classList.remove('hidden');
};

// Reset form to default "Add" state
function resetForm() {
    passwordForm.reset();
    isEditing = false;
    editIdInput.value = '';
    
    // Reset UI text
    document.getElementById('form-title').textContent = "Add New Password";
    saveBtn.textContent = "Save Password";
    cancelBtn.classList.add('hidden');
    
    // Reset password strength UI manually
    passwordInput.type = 'password';
    togglePasswordBtn.textContent = '👁️ Show';
    checkPasswordStrength(); // Will reset to None
}
