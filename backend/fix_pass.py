import sys
sys.path.insert(0, 'E:\\KIMI_web\\backend')
from app.core.security import PasswordManager
import psycopg2

hashed = PasswordManager.hash_password("test1234")

conn = psycopg2.connect('postgresql://postgres:Zcm3439489276.@localhost:5432/techink')
cur = conn.cursor()
cur.execute("UPDATE users SET password_hash = %s WHERE username = 'nuclear'", (hashed,))
print(f"Updated {cur.rowcount} user(s)")
conn.commit()
cur.close()
conn.close()
print("Password for nuclear reset to: test1234")
