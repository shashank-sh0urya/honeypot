(function () {
    function logXssTrap(type, data = {}) {
        fetch("https://3.7.71.39/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event: type,
                details: data,
                userAgent: navigator.userAgent,
                href: window.location.href,
                timestamp: new Date().toISOString()
            })
        }).catch(console.error);
    }

    // Reflective XSS form
    const xssForm = document.createElement('form');
    xssForm.method = 'GET';
    xssForm.action = '/search';
    xssForm.innerHTML = `
        <input name="q" placeholder="Search here...">
        <button type="submit">Search</button>
    `;
    document.body.appendChild(xssForm);

    // Reflected input handler
    const params = new URLSearchParams(location.search);
    if (params.has('q')) {
        const payload = params.get('q');
        document.body.insertAdjacentHTML('beforeend', `<div id="search-result">Results for: ${payload}</div>`);
        if (/<|script|alert|onerror|onload|img|svg/i.test(payload)) {
            logXssTrap("reflected_xss", { payload });
        }
    }

    // DOM-based XSS trap via comment form
    const commentDiv = document.createElement('div');
    commentDiv.id = 'comments';
    commentDiv.innerHTML = `
        <h3>Leave a Comment</h3>
        <form id="comment-form">
            <textarea name="comment" placeholder="Write your comment..."></textarea>
            <button type="submit">Post</button>
        </form>
        <div id="comments-box"></div>
    `;
    document.body.appendChild(commentDiv);

    document.querySelector('#comment-form')?.addEventListener('submit', function (e) {
        e.preventDefault();
        const comment = e.target.comment.value;
        document.querySelector('#comments-box').innerHTML += `<p>${comment}</p>`;

        if (/<|script|alert|onerror|onload|img|svg/i.test(comment)) {
            logXssTrap("dom_xss", { comment });
        }
    });

    // Advanced XSS lure using JS sink
    const advInput = document.createElement('input');
    advInput.placeholder = "Enter username";
    advInput.id = "trap-advanced-xss";
    document.body.appendChild(advInput);

    advInput.addEventListener('blur', () => {
        const val = advInput.value;
        const fakeDiv = document.createElement('div');
        fakeDiv.innerHTML = `Hello, ${val}`;
        document.body.appendChild(fakeDiv);

        if (/<|script|onerror|onload|iframe|alert|img|src|svg/i.test(val)) {
            logXssTrap("advanced_dom_xss", { val });
        }
    });

    // Custom sink function — JS-based injection bait
    window.trapXssSink = function (html) {
        document.body.innerHTML += html;
        if (/<script|onerror|onload|iframe|img|src|alert/i.test(html)) {
            logXssTrap("js_function_xss", { html });
        }
    };

    console.log("XSS Honeypot traps are active.");
})();
