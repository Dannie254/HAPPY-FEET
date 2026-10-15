// MongoDB initialization script
// Creates collections and indexes for the Happy Feet platform

db = db.getSiblingDB('happy_feet');

// Create collections
db.createCollection('users');
db.createCollection('categories');
db.createCollection('products');
db.createCollection('variants');
db.createCollection('orders');
db.createCollection('payments');
db.createCollection('promotions');
db.createCollection('sessions');
db.createCollection('audit_logs');

// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true, sparse: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: 1 });

// Categories indexes
db.categories.createIndex({ slug: 1 }, { unique: true });
db.categories.createIndex({ parentId: 1 });
db.categories.createIndex({ isActive: 1 });

// Products indexes
db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ sku: 1 }, { unique: true, sparse: true });
db.products.createIndex({ category: 1, subcategory: 1 });
db.products.createIndex({ status: 1 });
db.products.createIndex({ featured: 1 });
db.products.createIndex({ createdAt: -1 });
db.products.createIndex({ 'variants.sku': 1 });
db.products.createIndex({ name: 'text', description: 'text', tags: 'text' });

// Variants indexes
db.variants.createIndex({ sku: 1 }, { unique: true });
db.variants.createIndex({ productId: 1 });
db.variants.createIndex({ status: 1 });

// Orders indexes
db.orders.createIndex({ customerId: 1, createdAt: -1 });
db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });

// Payments indexes
db.payments.createIndex({ orderId: 1 });
db.payments.createIndex({ providerTransactionId: 1 }, { unique: true });
db.payments.createIndex({ status: 1 });
db.payments.createIndex({ createdAt: -1 });

// Promotions indexes
db.promotions.createIndex({ code: 1 }, { unique: true, sparse: true });
db.promotions.createIndex({ status: 1 });
db.promotions.createIndex({ startDate: 1, endDate: 1 });
db.promotions.createIndex({ 'appliesTo.type': 1, 'appliesTo.value': 1 });

// Sessions indexes
db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Audit logs indexes
db.audit_logs.createIndex({ userId: 1, createdAt: -1 });
db.audit_logs.createIndex({ entityType: 1, entityId: 1 });
db.audit_logs.createIndex({ createdAt: -1 });

print('Database initialization complete');