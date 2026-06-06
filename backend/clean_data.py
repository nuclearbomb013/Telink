import psycopg2
conn = psycopg2.connect('postgresql://postgres:Zcm3439489276.@localhost:5432/techink')
cur = conn.cursor()
cur.execute('SELECT id, content FROM moments WHERE author_id = 25')
rows = cur.fetchall()
print(f'Found {len(rows)} moments for user 25')
if rows:
    cur.execute('DELETE FROM moments WHERE author_id = 25')
    print(f'Deleted {cur.rowcount} moment(s)')
conn.commit()
cur.close()
conn.close()
print('Done')
