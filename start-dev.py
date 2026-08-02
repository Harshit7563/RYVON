#!/usr/bin/env python3
"""Start RYVON API + Vite in detached sessions."""
import os
import subprocess
import time
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))


def kill_port(port: int) -> None:
    try:
        out = subprocess.check_output(["lsof", "-ti", f"tcp:{port}"], text=True).strip()
    except subprocess.CalledProcessError:
        return
    if out:
        os.system(f"kill -9 {' '.join(out.split())}")


def check(url: str):
    try:
        with urllib.request.urlopen(url, timeout=2) as r:
            return r.status
    except Exception:
        return 0


def main() -> None:
    for port in (5001, 5173):
        kill_port(port)
    time.sleep(1)

    api = subprocess.Popen(
        ["node", "index.js"],
        cwd=os.path.join(ROOT, "server"),
        stdout=open("/tmp/ryvon-api.log", "a"),
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
    vite = subprocess.Popen(
        [
            os.path.join(ROOT, "client", "node_modules", ".bin", "vite"),
            "--port",
            "5173",
            "--host",
            "0.0.0.0",
            "--strictPort",
        ],
        cwd=os.path.join(ROOT, "client"),
        stdout=open("/tmp/ryvon-vite.log", "a"),
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )

    open("/tmp/ryvon-api.pid", "w").write(str(api.pid))
    open("/tmp/ryvon-vite.pid", "w").write(str(vite.pid))
    time.sleep(2)

    print(f"API  pid={api.pid}  health={check('http://127.0.0.1:5001/api/health')}")
    print(f"VITE pid={vite.pid} status={check('http://127.0.0.1:5173/')}")
    print("Open: http://localhost:5173/admin/login")
    print("Admin: admin@ryvon.in / admin123")


if __name__ == "__main__":
    main()
