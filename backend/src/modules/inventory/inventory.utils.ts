import type { VariantDocument } from '../products/variant.model.js';
import { VariantModel } from '../products/variant.model.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface Reservation {
  variantId: string;
  quantity: number;
  reservationId: string;
  expiresAt: Date;
}

export interface InventoryCheckResult {
  variantId: string;
  sku: string;
  available: number;
  requested: number;
  sufficient: boolean;
}

export async function checkAvailability(
  variantId: string,
  quantity: number
): Promise<InventoryCheckResult> {
  const variant = await VariantModel.findById(variantId).select(
    'sku stock reservedStock trackInventory allowBackorder'
  );

  if (!variant) {
    throw AppError.notFound('Variant not found');
  }

  if (!variant.trackInventory) {
    return {
      variantId: variant._id.toString(),
      sku: variant.sku,
      available: Infinity,
      requested: quantity,
      sufficient: true,
    };
  }

  const available = Math.max(0, variant.stock - variant.reservedStock);
  const sufficient = available >= quantity || variant.allowBackorder;

  return {
    variantId: variant._id.toString(),
    sku: variant.sku,
    available,
    requested: quantity,
    sufficient,
  };
}

export async function checkBulkAvailability(
  items: Array<{ variantId: string; quantity: number }>
): Promise<InventoryCheckResult[]> {
  const results: InventoryCheckResult[] = [];

  for (const item of items) {
    const result = await checkAvailability(item.variantId, item.quantity);
    results.push(result);
  }

  return results;
}

export async function reserveStock(
  variantId: string,
  quantity: number,
  reservationId: string,
  ttlMinutes: number = 15
): Promise<VariantDocument> {
  if (quantity <= 0) {
    throw AppError.badRequest('Quantity must be positive');
  }

  const session = await VariantModel.startSession();
  session.startTransaction();

  try {
    const variant = await VariantModel.findById(variantId).session(session);

    if (!variant) {
      throw AppError.notFound('Variant not found');
    }

    if (!variant.trackInventory) {
      return variant;
    }

    const available = Math.max(0, variant.stock - variant.reservedStock);

    if (available < quantity && !variant.allowBackorder) {
      throw AppError.conflict(
        `Insufficient stock for ${variant.sku}. Available: ${available}, Requested: ${quantity}`
      );
    }

    variant.reservedStock += quantity;

    if (variant.reservedStock >= variant.stock && variant.stock > 0) {
      variant.status = 'OUT_OF_STOCK';
    }

    await variant.save({ session });

    await session.commitTransaction();
    session.endSession();

    logger.info(
      {
        variantId,
        sku: variant.sku,
        quantity,
        reservationId,
        newReservedStock: variant.reservedStock,
      },
      'Stock reserved'
    );

    scheduleReservationExpiry(variantId, quantity, reservationId, ttlMinutes);

    return variant;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function reserveBulkStock(
  items: Array<{ variantId: string; quantity: number }>,
  reservationId: string,
  ttlMinutes: number = 15
): Promise<VariantDocument[]> {
  const session = await VariantModel.startSession();
  session.startTransaction();

  try {
    const variants: VariantDocument[] = [];

    for (const item of items) {
      const variant = await VariantModel.findById(item.variantId).session(session);

      if (!variant) {
        throw AppError.notFound(`Variant ${item.variantId} not found`);
      }

      if (!variant.trackInventory) {
        variants.push(variant);
        continue;
      }

      const available = Math.max(0, variant.stock - variant.reservedStock);

      if (available < item.quantity && !variant.allowBackorder) {
        throw AppError.conflict(
          `Insufficient stock for ${variant.sku}. Available: ${available}, Requested: ${item.quantity}`
        );
      }

      variant.reservedStock += item.quantity;

      if (variant.reservedStock >= variant.stock && variant.stock > 0) {
        variant.status = 'OUT_OF_STOCK';
      }

      await variant.save({ session });
      variants.push(variant);

      logger.info(
        { variantId: item.variantId, sku: variant.sku, quantity: item.quantity, reservationId },
        'Stock reserved (bulk)'
      );
    }

    await session.commitTransaction();
    session.endSession();

    for (const item of items) {
      const variant = variants.find((v) => v._id.toString() === item.variantId);
      if (variant && variant.trackInventory) {
        scheduleReservationExpiry(item.variantId, item.quantity, reservationId, ttlMinutes);
      }
    }

    return variants;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function releaseReservation(
  variantId: string,
  quantity: number,
  reservationId: string
): Promise<VariantDocument | null> {
  if (quantity <= 0) {
    return null;
  }

  const variant = await VariantModel.findByIdAndUpdate(
    variantId,
    {
      $inc: { reservedStock: -quantity },
      $set: {
        status: {
          $cond: [
            { $and: ['$trackInventory', { $lte: ['$reservedStock', '$stock'] }] },
            'ACTIVE',
            '$status',
          ],
        },
      },
    },
    { new: true }
  );

  if (variant) {
    logger.info(
      {
        variantId,
        sku: variant.sku,
        quantity,
        reservationId,
        newReservedStock: variant.reservedStock,
      },
      'Reservation released'
    );
  }

  return variant;
}

export async function releaseBulkReservations(
  items: Array<{ variantId: string; quantity: number }>,
  reservationId: string
): Promise<void> {
  await Promise.all(
    items.map((item) => releaseReservation(item.variantId, item.quantity, reservationId))
  );
}

export async function confirmReservation(
  variantId: string,
  quantity: number,
  reservationId: string
): Promise<VariantDocument> {
  if (quantity <= 0) {
    throw AppError.badRequest('Quantity must be positive');
  }

  const variant = await VariantModel.findByIdAndUpdate(
    variantId,
    {
      $inc: {
        stock: -quantity,
        reservedStock: -quantity,
      },
      $set: {
        status: {
          $cond: [
            { $and: ['$trackInventory', { $lte: ['$stock', '$lowStockThreshold'] }] },
            'OUT_OF_STOCK',
            '$status',
          ],
        },
      },
    },
    { new: true }
  );

  if (!variant) {
    throw AppError.notFound('Variant not found');
  }

  logger.info(
    { variantId, sku: variant.sku, quantity, reservationId, newStock: variant.stock },
    'Reservation confirmed (stock sold)'
  );

  return variant;
}

export async function confirmBulkReservations(
  items: Array<{ variantId: string; quantity: number }>,
  reservationId: string
): Promise<VariantDocument[]> {
  const variants = await Promise.all(
    items.map((item) => confirmReservation(item.variantId, item.quantity, reservationId))
  );
  return variants;
}

export async function adjustStock(
  variantId: string,
  adjustment: number,
  reason: string
): Promise<VariantDocument> {
  const variant = await VariantModel.findByIdAndUpdate(
    variantId,
    {
      $inc: { stock: adjustment },
      $set: {
        status: {
          $cond: [
            { $and: ['$trackInventory', { $lte: ['$stock', '$lowStockThreshold'] }] },
            'OUT_OF_STOCK',
            { $cond: [{ $gt: ['$stock', 0] }, 'ACTIVE', '$status'] },
          ],
        },
      },
    },
    { new: true }
  );

  if (!variant) {
    throw AppError.notFound('Variant not found');
  }

  logger.info(
    { variantId, sku: variant.sku, adjustment, reason, newStock: variant.stock },
    'Stock adjusted'
  );

  return variant;
}

export async function setStock(
  variantId: string,
  stock: number,
  reason: string
): Promise<VariantDocument> {
  if (stock < 0) {
    throw AppError.badRequest('Stock cannot be negative');
  }

  const variant = await VariantModel.findByIdAndUpdate(
    variantId,
    {
      $set: {
        stock,
        status: {
          $cond: [
            { $and: ['$trackInventory', { $lte: ['$stock', '$lowStockThreshold'] }] },
            'OUT_OF_STOCK',
            { $cond: [{ $gt: ['$stock', 0] }, 'ACTIVE', '$status'] },
          ],
        },
      },
    },
    { new: true }
  );

  if (!variant) {
    throw AppError.notFound('Variant not found');
  }

  logger.info({ variantId, sku: variant.sku, newStock: stock, reason }, 'Stock set');

  return variant;
}

function scheduleReservationExpiry(
  variantId: string,
  quantity: number,
  reservationId: string,
  ttlMinutes: number
): void {
  const delay = ttlMinutes * 60 * 1000;

  setTimeout(async () => {
    try {
      const variant = await VariantModel.findById(variantId);
      if (variant && variant.reservedStock >= quantity) {
        await releaseReservation(variantId, quantity, `expired-${reservationId}`);
        logger.info({ variantId, reservationId }, 'Reservation expired and released');
      }
    } catch (error) {
      logger.error({ error, variantId, reservationId }, 'Failed to release expired reservation');
    }
  }, delay);
}

export async function getLowStockVariants(threshold?: number): Promise<VariantDocument[]> {
  const query = VariantModel.find({
    trackInventory: true,
    status: { $ne: 'DISCONTINUED' },
  });

  if (threshold !== undefined) {
    query.where('lowStockThreshold').lte(threshold);
  }

  return query.populate('productId', 'name slug');
}

export async function getOutOfStockVariants(): Promise<VariantDocument[]> {
  return VariantModel.find({
    trackInventory: true,
    $expr: { $lte: ['$stock', '$reservedStock'] },
    status: { $ne: 'DISCONTINUED' },
  }).populate('productId', 'name slug');
}

export async function getInventorySummary(): Promise<{
  totalVariants: number;
  trackedVariants: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}> {
  const [totalVariants, trackedVariants, lowStockVariants, outOfStockVariants, valueResult] =
    await Promise.all([
      VariantModel.countDocuments(),
      VariantModel.countDocuments({ trackInventory: true }),
      VariantModel.countDocuments({
        trackInventory: true,
        $expr: { $lte: [{ $subtract: ['$stock', '$reservedStock'] }, '$lowStockThreshold'] },
      }),
      VariantModel.countDocuments({
        trackInventory: true,
        $expr: { $lte: [{ $subtract: ['$stock', '$reservedStock'] }, 0] },
      }),
      VariantModel.aggregate([
        { $match: { trackInventory: true } },
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$stock', '$costPrice'] } },
          },
        },
      ]),
    ]);

  return {
    totalVariants,
    trackedVariants,
    lowStockCount: lowStockVariants,
    outOfStockCount: outOfStockVariants,
    totalValue: valueResult[0]?.totalValue || 0,
  };
}
