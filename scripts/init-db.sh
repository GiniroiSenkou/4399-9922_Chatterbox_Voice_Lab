#!/bin/bash
echo "Initializing database..."
cd /app
python3 -c "
import asyncio
from app.core.database import init_db
asyncio.run(init_db())
print('Database initialized.')
"
