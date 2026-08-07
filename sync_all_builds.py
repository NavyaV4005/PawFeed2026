import shutil
import os

print("Starting master synchronization across all PawFeed app locations...")

base_dir = r"c:\Users\navya\OneDrive\Desktop\pawfeedmobile"
www_dir = os.path.join(base_dir, "www")
app2_js = os.path.join(www_dir, "app2.js")
app_js = os.path.join(www_dir, "app.js")
index_html = os.path.join(www_dir, "index.html")
pawfeed00_html = os.path.join(base_dir, "pawfeed00.html")

# 1. Ensure www/app.js is a copy of www/app2.js
shutil.copyfile(app2_js, app_js)
print("  [OK] Synchronized www/app2.js -> www/app.js")

# Targets to copy www contents into:
targets_www = [
    os.path.join(base_dir, "android", "app", "src", "main", "assets", "public"),
    os.path.join(base_dir, "mobile_app", "www"),
    os.path.join(base_dir, "mobile_app", "android", "app", "src", "main", "assets", "public"),
]

for t in targets_www:
    if os.path.exists(t):
        for f in os.listdir(www_dir):
            src_f = os.path.join(www_dir, f)
            dst_f = os.path.join(t, f)
            if os.path.isfile(src_f):
                shutil.copyfile(src_f, dst_f)
        print(f"  [OK] Updated web assets in {t}")

# Copy pawfeed00.html to mobile_app
mobile_app_pawfeed00 = os.path.join(base_dir, "mobile_app", "pawfeed00.html")
if os.path.exists(os.path.dirname(mobile_app_pawfeed00)):
    shutil.copyfile(pawfeed00_html, mobile_app_pawfeed00)
    print(f"  [OK] Synchronized pawfeed00.html -> mobile_app/pawfeed00.html")

print("Master synchronization completed successfully!")
