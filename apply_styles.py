import re

BASE = r'D:/IntelliJ IDEA 2025.1.1.1/bookstore/src/main/webapp/frontend-src/src'

filepath = f'{BASE}/components/Navbar.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "className=`{`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all duration-200 ``}",
    "className=`{`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all duration-200 nav-tab ``}"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
