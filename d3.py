import requests
import json
import re

# ==========================================
# PASTE YOUR CLOUDFLARE INFO HERE
# ==========================================
ACCOUNT_ID = "20f673faa71507381f3edccb2c16bfd3"
DATABASE_ID = "5494913d-dde9-48ae-82a4-5774ed2b11a6"
API_TOKEN = "aquSLvvzjKO3UvXL3PCL3u23Fwb_ngi7tYAzfz1B"

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DATABASE_ID}/query"
headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

# ==========================================
# PASTE YOUR SQL COMMAND(S) HERE
# ==========================================
sql_commands = [
    """
    
    """,

    # Add more SQL statements as needed
]

# ==========================================
# Config
# ==========================================
CHUNK_SIZE = 4000  # characters per chunk — safe limit for D1


# ==========================================
# Helper: detect if SQL is an UPDATE with a giant string value
# and split it into chunked UPDATE + append statements
# ==========================================
def split_large_update(sql):
    """
    Detects UPDATE ... SET col = '...huge value...' WHERE ...
    Returns a list of smaller SQL statements that reconstruct the value
    using concatenation (col = col || '...next chunk...')
    """
    # Match:  UPDATE table SET col = '...' WHERE ...
    pattern = re.compile(
        r"(UPDATE\s+.+?\s+SET\s+(\S+)\s*=\s*)'(.*?)'(\s+WHERE\s+.+)",
        re.DOTALL | re.IGNORECASE
    )
    match = pattern.search(sql)
    if not match:
        return [sql]  # Not a simple UPDATE, return as-is

    prefix    = match.group(1)   # UPDATE table SET col =
    col_name  = match.group(2)   # col
    value     = match.group(3)   # the huge string value
    where     = match.group(4)   # WHERE ...

    if len(value) <= CHUNK_SIZE:
        return [sql]  # Small enough, no splitting needed

    # Split value into chunks
    chunks = [value[i:i+CHUNK_SIZE] for i in range(0, len(value), CHUNK_SIZE)]
    statements = []

    # First statement: SET col = 'chunk1'
    escaped = chunks[0].replace("'", "''")
    statements.append(f"{prefix}'{escaped}'{where}")

    # Remaining: SET col = col || 'chunkN'
    for chunk in chunks[1:]:
        escaped = chunk.replace("'", "''")
        statements.append(
            f"UPDATE {extract_table(sql)} SET {col_name} = {col_name} || '{escaped}'{where}"
        )

    return statements


def extract_table(sql):
    """Pull the table name out of an UPDATE statement."""
    match = re.search(r"UPDATE\s+(\S+)", sql, re.IGNORECASE)
    return match.group(1) if match else "unknown_table"


def run_sql(sql):
    """Send a single SQL statement to Cloudflare D1."""
    payload = {"sql": sql.strip(), "params": []}
    response = requests.post(url, headers=headers, json=payload)
    return response.json()


# ==========================================
# Runner
# ==========================================
print("="*60)
print("Cloudflare D1 SQL Runner (with large-value chunking)")
print("="*60 + "\n")

success_count = 0
fail_count = 0

for i, sql in enumerate(sql_commands):
    sql_clean = sql.strip()
    preview = sql_clean[:60].replace("\n", " ")
    print(f"Running command {i+1}/{len(sql_commands)}: {preview}...")

    # Auto-split if too large
    statements = split_large_update(sql_clean)

    if len(statements) > 1:
        print(f"   Warning: Value too large - splitting into {len(statements)} chunks...")

    all_ok = True
    for j, stmt in enumerate(statements):
        try:
            result = run_sql(stmt)
            if result.get("success"):
                if len(statements) > 1:
                    print(f"   Chunk {j+1}/{len(statements)} OK")
                else:
                    results_data = result.get("result", [])
                    if results_data and results_data[0].get("results"):
                        rows = results_data[0]["results"]
                        print(f"   Success! Rows returned: {len(rows)}")
                        for row in rows[:5]:
                            print(f"      -> {row}")
                        if len(rows) > 5:
                            print(f"      ... and {len(rows) - 5} more rows")
                    else:
                        meta = results_data[0].get("meta", {}) if results_data else {}
                        rows_affected = meta.get("rows_written", meta.get("changes", "?"))
                        print(f"   Success! Rows affected: {rows_affected}")
            else:
                print(f"   Cloudflare API Error on chunk {j+1}: {result.get('errors')}")
                all_ok = False
                break
        except Exception as e:
            print(f"   Python Error on chunk {j+1}: {e}")
            all_ok = False
            break

    if all_ok:
        if len(statements) > 1:
            print(f"   All {len(statements)} chunks written successfully!")
        success_count += 1
    else:
        fail_count += 1

print("\n" + "="*60)
print(f"Done! {success_count} succeeded, {fail_count} failed.")
print("="*60)
