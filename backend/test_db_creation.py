"""Quick test to see if tables are created properly."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.core.database import Base
from app.models.user import User
from app.models.task import Task
from app.models.task_log import TaskLog

async def main():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=True,
        poolclass=NullPool,
    )
    
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print(f"Tables created: {list(Base.metadata.tables.keys())}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
