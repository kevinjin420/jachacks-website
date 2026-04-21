"""
Production server: serves React frontend + proxies API to Jac backend.
Run: python3 serve.py
Requires: pip3 install aiohttp
"""
import asyncio
import aiohttp
from aiohttp import web
import os

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend", "dist")
JAC_API = "http://localhost:8001"

async def proxy_handler(request: web.Request) -> web.StreamResponse:
    """Proxy /walker/*, /user/*, /admin/* to Jac backend."""
    url = f"{JAC_API}{request.path}"
    async with aiohttp.ClientSession() as session:
        try:
            async with session.request(
                method=request.method,
                url=url,
                headers={k: v for k, v in request.headers.items() if k.lower() not in ('host',)},
                data=await request.read(),
            ) as resp:
                response = web.StreamResponse(status=resp.status, headers={
                    k: v for k, v in resp.headers.items()
                    if k.lower() not in ('transfer-encoding', 'content-encoding')
                })
                response.content_type = resp.content_type
                await response.prepare(request)
                async for chunk in resp.content.iter_any():
                    await response.write(chunk)
                await response.write_eof()
                return response
        except Exception as e:
            return web.json_response({"error": str(e)}, status=502)

async def spa_handler(request: web.Request) -> web.Response:
    """Serve React SPA - try static file first, fallback to index.html."""
    path = request.path.lstrip("/")
    filepath = os.path.join(FRONTEND_DIR, path)

    if path and os.path.isfile(filepath):
        return web.FileResponse(filepath)

    # SPA fallback
    return web.FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

def create_app() -> web.Application:
    app = web.Application()

    # API proxy routes
    for prefix in ["/walker", "/user", "/admin", "/health"]:
        app.router.add_route("*", prefix + "/{path:.*}", proxy_handler)
        app.router.add_route("*", prefix, proxy_handler)

    # Static assets
    if os.path.isdir(os.path.join(FRONTEND_DIR, "assets")):
        app.router.add_static("/assets", os.path.join(FRONTEND_DIR, "assets"))

    # SPA catch-all (must be last)
    app.router.add_route("*", "/{path:.*}", spa_handler)

    return app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"\n  JacHacks Judging Platform")
    print(f"  Frontend: {FRONTEND_DIR}")
    print(f"  API proxy: {JAC_API}")
    print(f"  Serving on: http://0.0.0.0:{port}\n")
    web.run_app(create_app(), host="0.0.0.0", port=port)
