# phase1_dynamic_honeypot/main.py

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from traps import trap_inspector
import uvicorn

app = FastAPI()

@app.middleware("http")
async def deception_middleware(request: Request, call_next):
    is_malicious, trap_response = await trap_inspector(request)
    if is_malicious:
        return JSONResponse(content=trap_response, status_code=200)
    return await call_next(request)

@app.get("/api/data")
async def get_data():
    return {"message": "Safe content for valid users."}

@app.post("/api/login")
async def login(request: Request):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    # Dummy check for broken auth demo
    if username == "admin" and password == "admin123":
        return {"token": "fake-jwt-token-for-admin"}
    return {"token": "fake-jwt-token"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# phase1_dynamic_honeypot/traps.py

import re
from fastapi import Request
import httpx
import os

SQLI_PATTERN = re.compile(r"('|--|;|\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)", re.IGNORECASE)
XSS_PATTERN = re.compile(r"<script|onerror=|alert\(", re.IGNORECASE)
CMD_INJECT_PATTERN = re.compile(r"(;|&&|\|\||wget|curl|nc|bash)", re.IGNORECASE)
CVE_PAYLOAD_PATTERN = re.compile(r"\$\{jndi:|\bbase64\b|\.class\b", re.IGNORECASE)
SSRF_PATTERN = re.compile(r"(localhost|127\.0\.0\.1|169\.254\.169\.254)", re.IGNORECASE)
LFI_PATTERN = re.compile(r"\.\.\/|etc\/passwd", re.IGNORECASE)

TRAP_SERVER = os.getenv("TRAP_SERVER", "https://honeypot.yourdomain.com/log")
TRAP_API_KEY = os.getenv("TRAP_API_KEY", "test-api-key")

async def trap_inspector(request: Request):
    try:
        body = await request.body()
        query_params = request.query_params._dict
        headers = dict(request.headers)
        full_content = str(body) + str(query_params) + str(headers)

        traps_triggered = []
        trap_type = None

        if SQLI_PATTERN.search(full_content):
            trap_type = "SQL Injection"
            traps_triggered.append("SQLi")
        if XSS_PATTERN.search(full_content):
            trap_type = "Cross-Site Scripting"
            traps_triggered.append("XSS")
        if CMD_INJECT_PATTERN.search(full_content):
            trap_type = "Command Injection"
            traps_triggered.append("CMD")
        if CVE_PAYLOAD_PATTERN.search(full_content):
            trap_type = "CVE Exploit Attempt"
            traps_triggered.append("CVE")
        if SSRF_PATTERN.search(full_content):
            trap_type = "SSRF"
            traps_triggered.append("SSRF")
        if LFI_PATTERN.search(full_content):
            trap_type = "LFI/RFI"
            traps_triggered.append("LFI")

        # Broken Auth simulation
        if 'Authorization' in headers and 'admin' in headers['Authorization']:
            trap_type = "Broken Auth"
            traps_triggered.append("BrokenAuth")

        if traps_triggered:
            await report_to_server(request, trap_type, full_content)
            return True, {"trap": trap_type, "status": "captured"}

        return False, None
    except Exception as e:
        return False, None

async def report_to_server(request: Request, trap_type: str, content: str):
    async with httpx.AsyncClient() as client:
        await client.post(TRAP_SERVER, json={
            "trap_type": trap_type,
            "content": content,
            "client_ip": request.client.host,
            "path": request.url.path,
            "headers": dict(request.headers)
        }, headers={"Authorization": f"Bearer {TRAP_API_KEY}"})
