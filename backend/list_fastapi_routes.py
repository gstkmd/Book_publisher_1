from app.main import app

def list_routes():
    import json
    routes = []
    for route in app.routes:
        if hasattr(route, "path"):
            routes.append({
                "path": route.path,
                "name": route.name,
                "methods": list(route.methods) if hasattr(route, "methods") else []
            })
    
    # Sort by path
    routes.sort(key=lambda x: x["path"])
    
    for r in routes:
        print(f"{r['methods']} {r['path']} -> {r['name']}")

if __name__ == "__main__":
    list_routes()
