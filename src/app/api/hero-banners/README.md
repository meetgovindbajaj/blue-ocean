Usage Examples

# Get active banners for homepage carousel

GET /api/hero-banners?limit=5

# Get banners for new users

GET /api/hero-banners?isNewUser=true

# Track banner click

POST /api/hero-banners/{id}/click

# Admin: Create manual banner

POST /api/admin/hero-banners
{
"name": "Summer Sale",
"contentType": "offer",
"sourceType": "manual",
"content": {
"title": "Summer Sale - 50% Off",
"subtitle": "On all outdoor furniture",
"ctaText": "Shop Now",
"ctaLink": "/category/outdoor",
"discountPercent": 50,
"offerCode": "SUMMER50"
},
"image": { "id": "...", "url": "...", "alt": "Summer Sale" },
"order": 1,
"startDate": "2025-06-01",
"endDate": "2025-08-31",
"userId": "admin-id"
}

# Admin: Create auto-trending banner

POST /api/admin/hero-banners
{
"name": "Auto Trending",
"contentType": "trending",
"sourceType": "auto",
"content": {
"autoConfig": { "limit": 5, "period": "week" }
},
"image": { "id": "...", "url": "...", "alt": "Trending" },
"order": 2,
"userId": "admin-id"
}
