# backend/main.py - Premium FastAPI Backend com PostgreSQL

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime, timedelta, date
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum
import os
import asyncpg
from decimal import Decimal

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Database Configuration
# ============================================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://challenge:challenge_2024@localhost:5432/challenge_db"
)

db_pool: Optional[asyncpg.Pool] = None

async def init_db():
    """Initialize PostgreSQL connection pool"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(
            dsn=DATABASE_URL,
            min_size=5,
            max_size=20,
            command_timeout=30,
        )
        logger.info("✅ PostgreSQL connection pool created successfully")
    except Exception as e:
        logger.error(f"❌ Failed to create PostgreSQL pool: {e}")
        raise

async def close_db():
    """Close PostgreSQL connection pool"""
    global db_pool
    if db_pool:
        await db_pool.close()
        logger.info("PostgreSQL pool closed")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager"""
    logger.info("🚀 Starting Restaurant Analytics API (Premium Edition)...")
    await init_db()
    yield
    await close_db()
    logger.info("👋 Shutting down...")

# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="Restaurant Analytics API - Premium",
    description="Enterprise-grade analytics platform for restaurants",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios exatos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Models
# ============================================================================

class MetricType(str, Enum):
    REVENUE = "revenue"
    ORDERS = "orders"
    AVG_TICKET = "avg_ticket"
    PRODUCTS_SOLD = "products_sold"

class TimeGranularity(str, Enum):
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"

class MetricResponse(BaseModel):
    metric: str
    value: float
    change_percent: Optional[float] = None
    previous_value: Optional[float] = None
    period: str
    sparkline: Optional[List[dict]] = None

class TimeSeriesPoint(BaseModel):
    timestamp: str
    value: float
    label: Optional[str] = None

class TimeSeriesResponse(BaseModel):
    metric: str
    data: List[TimeSeriesPoint]
    total: float

class RankingItem(BaseModel):
    id: int
    name: str
    value: float
    percentage: float
    metadata: Optional[dict] = None

class RankingResponse(BaseModel):
    category: str
    items: List[RankingItem]
    total: float

class FilterOption(BaseModel):
    id: int
    name: str
    active: bool = True

class FiltersResponse(BaseModel):
    stores: List[FilterOption]
    channels: List[FilterOption]
    categories: List[FilterOption]

class DashboardOverview(BaseModel):
    metrics: dict
    top_products: List[RankingItem]
    top_stores: List[RankingItem]
    channel_distribution: List[RankingItem]
    revenue_trend: List[TimeSeriesPoint]

# ============================================================================
# Helper Functions
# ============================================================================

def get_previous_period(start: date, end: date) -> tuple:
    """Calculate previous period for comparison"""
    days = (end - start).days
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=days)
    return prev_start, prev_end

def build_filters(store_ids: Optional[str] = None, channel_ids: Optional[str] = None) -> tuple:
    """Build WHERE clause with filters"""
    conditions = []
    params = []
    
    if store_ids:
        ids = [int(x) for x in store_ids.split(',')]
        conditions.append(f"store_id = ANY(${len(params) + 1})")
        params.append(ids)
    
    if channel_ids:
        ids = [int(x) for x in channel_ids.split(',')]
        conditions.append(f"channel_id = ANY(${len(params) + 1})")
        params.append(ids)
    
    return conditions, params

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        async with db_pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            db_status = "connected" if result else "disconnected"
    except:
        db_status = "error"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "version": "2.0.0"
    }

# ============================================================================
# Dashboard Overview (Single Optimized Call)
# ============================================================================

@app.get("/api/dashboard/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    start_date: str = Query(...),
    end_date: str = Query(...),
    store_ids: Optional[str] = None,
    channel_ids: Optional[str] = None
):
    """
    Get complete dashboard data in a single optimized call
    Reduces multiple API calls to one
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
        prev_start, prev_end = get_previous_period(start, end)
        
        filter_conditions, filter_params = build_filters(store_ids, channel_ids)
        base_where = "sale_status_desc = 'COMPLETED'"
        if filter_conditions:
            base_where += " AND " + " AND ".join(filter_conditions)
        
        async with db_pool.acquire() as conn:
            # 1. Metrics (single query with CTEs)
            metrics_query = f"""
            WITH current_period AS (
                SELECT 
                    COUNT(*) as orders,
                    COALESCE(SUM(total_amount), 0) as revenue,
                    COALESCE(AVG(total_amount), 0) as avg_ticket,
                    COALESCE(SUM(ps.quantity), 0) as products_sold
                FROM sales s
                LEFT JOIN product_sales ps ON s.id = ps.sale_id
                WHERE {base_where}
                    AND DATE(s.created_at) BETWEEN $1 AND $2
            ),
            previous_period AS (
                SELECT 
                    COUNT(*) as orders,
                    COALESCE(SUM(total_amount), 0) as revenue,
                    COALESCE(AVG(total_amount), 0) as avg_ticket,
                    COALESCE(SUM(ps.quantity), 0) as products_sold
                FROM sales s
                LEFT JOIN product_sales ps ON s.id = ps.sale_id
                WHERE {base_where}
                    AND DATE(s.created_at) BETWEEN $3 AND $4
            )
            SELECT 
                cp.revenue as current_revenue,
                pp.revenue as previous_revenue,
                cp.orders as current_orders,
                pp.orders as previous_orders,
                cp.avg_ticket as current_avg_ticket,
                pp.avg_ticket as previous_avg_ticket,
                cp.products_sold as current_products,
                pp.products_sold as previous_products
            FROM current_period cp, previous_period pp
            """
            
            params = [start, end, prev_start, prev_end] + filter_params
            metrics_row = await conn.fetchrow(metrics_query, *params)
            
            # Calculate changes
            def calc_change(current, previous):
                if previous and previous > 0:
                    return ((current - previous) / previous) * 100
                return 0
            
            metrics = {
                "revenue": {
                    "value": float(metrics_row['current_revenue']),
                    "change": calc_change(
                        metrics_row['current_revenue'],
                        metrics_row['previous_revenue']
                    )
                },
                "orders": {
                    "value": float(metrics_row['current_orders']),
                    "change": calc_change(
                        metrics_row['current_orders'],
                        metrics_row['previous_orders']
                    )
                },
                "avg_ticket": {
                    "value": float(metrics_row['current_avg_ticket']),
                    "change": calc_change(
                        metrics_row['current_avg_ticket'],
                        metrics_row['previous_avg_ticket']
                    )
                },
                "products_sold": {
                    "value": float(metrics_row['current_products']),
                    "change": calc_change(
                        metrics_row['current_products'],
                        metrics_row['previous_products']
                    )
                }
            }
            
            # 2. Top Products
            top_products_query = f"""
            SELECT 
                p.id,
                p.name,
                SUM(ps.total_price) as revenue,
                SUM(ps.quantity) as quantity
            FROM product_sales ps
            JOIN products p ON p.id = ps.product_id
            JOIN sales s ON s.id = ps.sale_id
            WHERE {base_where}
                AND DATE(s.created_at) BETWEEN $1 AND $2
            GROUP BY p.id, p.name
            ORDER BY revenue DESC
            LIMIT 10
            """
            
            products_params = [start, end] + filter_params
            products_rows = await conn.fetch(top_products_query, *products_params)
            
            total_products_revenue = sum(float(row['revenue']) for row in products_rows)
            top_products = [
                RankingItem(
                    id=row['id'],
                    name=row['name'],
                    value=float(row['revenue']),
                    percentage=(float(row['revenue']) / total_products_revenue * 100) if total_products_revenue > 0 else 0,
                    metadata={"quantity": float(row['quantity'])}
                )
                for row in products_rows
            ]
            
            # 3. Top Stores
            top_stores_query = f"""
            SELECT 
                st.id,
                st.name,
                st.city,
                SUM(s.total_amount) as revenue,
                COUNT(s.id) as orders
            FROM sales s
            JOIN stores st ON st.id = s.store_id
            WHERE {base_where}
                AND DATE(s.created_at) BETWEEN $1 AND $2
            GROUP BY st.id, st.name, st.city
            ORDER BY revenue DESC
            LIMIT 5
            """
            
            stores_rows = await conn.fetch(top_stores_query, *products_params)
            
            total_stores_revenue = sum(float(row['revenue']) for row in stores_rows)
            top_stores = [
                RankingItem(
                    id=row['id'],
                    name=f"{row['name']} - {row['city']}",
                    value=float(row['revenue']),
                    percentage=(float(row['revenue']) / total_stores_revenue * 100) if total_stores_revenue > 0 else 0,
                    metadata={"orders": row['orders']}
                )
                for row in stores_rows
            ]
            
            # 4. Channel Distribution
            channels_query = f"""
            SELECT 
                c.id,
                c.name,
                SUM(s.total_amount) as revenue
            FROM sales s
            JOIN channels c ON c.id = s.channel_id
            WHERE {base_where}
                AND DATE(s.created_at) BETWEEN $1 AND $2
            GROUP BY c.id, c.name
            ORDER BY revenue DESC
            """
            
            channels_rows = await conn.fetch(channels_query, *products_params)
            
            total_channels_revenue = sum(float(row['revenue']) for row in channels_rows)
            channel_distribution = [
                RankingItem(
                    id=row['id'],
                    name=row['name'],
                    value=float(row['revenue']),
                    percentage=(float(row['revenue']) / total_channels_revenue * 100) if total_channels_revenue > 0 else 0
                )
                for row in channels_rows
            ]
            
            # 5. Revenue Trend (last 30 days)
            trend_query = f"""
            SELECT 
                DATE(created_at) as date,
                SUM(total_amount) as value
            FROM sales
            WHERE {base_where}
                AND DATE(created_at) BETWEEN $1 AND $2
            GROUP BY DATE(created_at)
            ORDER BY date
            """
            
            trend_rows = await conn.fetch(trend_query, *products_params)
            
            revenue_trend = [
                TimeSeriesPoint(
                    timestamp=row['date'].isoformat(),
                    value=float(row['value'])
                )
                for row in trend_rows
            ]
            
            return DashboardOverview(
                metrics=metrics,
                top_products=top_products,
                top_stores=top_stores,
                channel_distribution=channel_distribution,
                revenue_trend=revenue_trend
            )
            
    except Exception as e:
        logger.error(f"Error in dashboard overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Individual Metric Endpoints (for detailed analysis)
# ============================================================================

@app.get("/api/metrics/revenue", response_model=MetricResponse)
async def get_revenue(
    start_date: str,
    end_date: str,
    store_ids: Optional[str] = None,
    channel_ids: Optional[str] = None,
    include_sparkline: bool = False
):
    """Get revenue metric with optional sparkline"""
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
        prev_start, prev_end = get_previous_period(start, end)
        
        filter_conditions, filter_params = build_filters(store_ids, channel_ids)
        base_where = "sale_status_desc = 'COMPLETED'"
        if filter_conditions:
            base_where += " AND " + " AND ".join(filter_conditions)
        
        async with db_pool.acquire() as conn:
            # Current period
            query = f"""
            SELECT COALESCE(SUM(total_amount), 0) as revenue
            FROM sales
            WHERE {base_where}
                AND DATE(created_at) BETWEEN $1 AND $2
            """
            
            params_current = [start, end] + filter_params
            current_revenue = await conn.fetchval(query, *params_current)
            
            # Previous period
            params_prev = [prev_start, prev_end] + filter_params
            prev_revenue = await conn.fetchval(query, *params_prev)
            
            # Calculate change
            change = 0
            if prev_revenue and prev_revenue > 0:
                change = ((current_revenue - prev_revenue) / prev_revenue) * 100
            
            # Sparkline (last 7 days)
            sparkline = None
            if include_sparkline:
                sparkline_query = f"""
                SELECT 
                    DATE(created_at) as date,
                    SUM(total_amount) as value
                FROM sales
                WHERE {base_where}
                    AND DATE(created_at) >= $1
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 7
                """
                
                sparkline_start = end - timedelta(days=6)
                sparkline_params = [sparkline_start] + filter_params
                sparkline_rows = await conn.fetch(sparkline_query, *sparkline_params)
                
                sparkline = [
                    {"date": row['date'].isoformat(), "value": float(row['value'])}
                    for row in reversed(list(sparkline_rows))
                ]
            
            return MetricResponse(
                metric="revenue",
                value=float(current_revenue),
                change_percent=round(change, 2),
                previous_value=float(prev_revenue),
                period=f"{start_date} to {end_date}",
                sparkline=sparkline
            )
            
    except Exception as e:
        logger.error(f"Error calculating revenue: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Filters Endpoint
# ============================================================================

@app.get("/api/filters", response_model=FiltersResponse)
async def get_filters():
    """Get available filter options"""
    try:
        async with db_pool.acquire() as conn:
            # Stores
            stores = await conn.fetch("""
                SELECT id, name, city
                FROM stores
                WHERE is_active = true
                ORDER BY name
                LIMIT 50
            """)
            
            # Channels
            channels = await conn.fetch("""
                SELECT id, name
                FROM channels
                ORDER BY name
            """)
            
            # Categories
            categories = await conn.fetch("""
                SELECT DISTINCT id, name
                FROM categories
                WHERE type = 'P' AND deleted_at IS NULL
                ORDER BY name
                LIMIT 20
            """)
            
            return FiltersResponse(
                stores=[
                    FilterOption(id=s['id'], name=f"{s['name']} - {s['city']}", active=True)
                    for s in stores
                ],
                channels=[
                    FilterOption(id=c['id'], name=c['name'], active=True)
                    for c in channels
                ],
                categories=[
                    FilterOption(id=cat['id'], name=cat['name'], active=True)
                    for cat in categories
                ]
            )
            
    except Exception as e:
        logger.error(f"Error getting filters: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Run
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )