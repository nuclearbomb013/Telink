import psycopg2
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash("test1234")

conn = psycopg2.connect('postgresql://postgres:Zcm3439489276.@localhost:5432/techink')
cur = conn.cursor()
cur.execute("UPDATE users SET hashed_password = %s WHERE username = 'nuclear'", (hashed,))
print(f"Updated {cur.rowcount} user(s)")
conn.commit()
cur.close()
conn.close()
print("Password reset to: test1234")
