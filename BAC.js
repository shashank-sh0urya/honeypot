(function() {
    // Utility to log suspicious activity
    function report(action, data = {}) {
        fetch("https://3.7.71.39/bac-track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action,
                ...data,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            })
        }).catch(console.error);
    }

    // 1. Inject hidden decoy admin link
    const baitLink = document.createElement('a');
    baitLink.href = "/admin-dashboard-fake";
    baitLink.textContent = "Admin Dashboard";
    baitLink.style.display = "none";
    document.body.appendChild(baitLink);

    document.addEventListener('click', function(e) {
        if (e.target && e.target.href && e.target.href.includes('/admin-dashboard-fake')) {
            report("trap_link_clicked", { url: e.target.href });
            e.preventDefault();
            window.location.href = "https://3.7.71.39/fakeadmin";
        }
    }, true);

    // 2. Add fake hidden form trap fields
    const trapForm = document.createElement('form');
    trapForm.innerHTML = `
        <input type="hidden" name="__hp_role_bait" value="user">
        <input type="hidden" name="__hp_user_id" value="12345">
    `;
    trapForm.style.display = "none";
    document.body.appendChild(trapForm);

    // 3. Detect bait field tampering
    document.addEventListener('submit', function(event) {
        const formData = new FormData(event.target);
        const trapRole = formData.get('__hp_role_bait');
        const trapUser = formData.get('__hp_user_id');

        if (trapRole && trapRole !== 'user') {
            report("role_escalation_trap", { modifiedRole: trapRole });
            event.preventDefault();
        }

        if (trapUser && trapUser !== '12345') {
            report("idor_userid_modified", { modifiedUserId: trapUser });
            event.preventDefault();
        }
    }, true);

    // 4. Monitor localStorage bait
    const baitRoleKey = "__hp_user_role";
    localStorage.setItem(baitRoleKey, "user");
    setInterval(() => {
        const currentRole = localStorage.getItem(baitRoleKey);
        if (currentRole && currentRole !== "user") {
            report("localStorage_modified", { newValue: currentRole });
        }
    }, 2000);

    // 5. Monitor fetch() to fake admin APIs
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === "string" ? input : input.url;
        if (url.includes("/api/admin-fake") || url.includes("/api/delete-fake")) {
            report("fake_admin_api_call", { url });
        }
        return originalFetch(input, init);
    };

})();
