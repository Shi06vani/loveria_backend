import db from "../models/index.js";
import sendResponse, { errorResponse } from "../utils/response.js";
import { Op } from "sequelize";

const { Subscription } = db;

const PLANS = [
  {
    id: "1_month",
    name: "1 Month",
    price: 39,
    durationInMonths: 1,
    features: [
      "See who likes you",
      "Unlimited likes",
      "Priority messaging",
      "Free monthly boost",
      "No ads",
    ],
  },
  {
    id: "3_months",
    name: "3 Months",
    price: 99,
    durationInMonths: 3,
    features: [
      "See who likes you",
      "Unlimited likes",
      "Priority messaging",
      "Free monthly boost",
      "No ads",
    ],
  },
  {
    id: "6_months",
    name: "6 Months",
    price: 179,
    durationInMonths: 6,
    features: [
      "See who likes you",
      "Unlimited likes",
      "Priority messaging",
      "Free monthly boost",
      "No ads",
    ],
  },
];

/**
 * Get available plans and current user subscription status
 */
export const getPlans = async (req, res) => {
  try {
    const userId = req.user.id;

    const currentSubscription = await Subscription.findOne({
      where: {
        userId,
        status: "active",
        endDate: {
          [Op.gt]: new Date(),
        },
      },
    });

    return sendResponse(res, true, 200, {
      plans: PLANS,
      currentSubscription: currentSubscription || null,
    }, "Plans fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Subscribe to a plan (Mock payment)
 */
export const subscribeUser = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.id;
    const { planId } = req.body;

    const selectedPlan = PLANS.find((p) => p.id === planId);
    if (!selectedPlan) {
      await t.rollback();
      return sendResponse(res, false, 400, {}, "Invalid plan selected");
    }

    // Check for existing active subscription
    const existingSubscription = await Subscription.findOne({
      where: {
        userId,
        status: "active",
        endDate: {
          [Op.gt]: new Date(),
        },
      },
      transaction: t,
    });

    if (existingSubscription) {
      // In a real app, we might stack the duration or upgrade.
      // For now, simple rule: cannot subscribe if already active.
      await t.rollback();
      return sendResponse(res, false, 400, {}, "You already have an active subscription");
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + selectedPlan.durationInMonths);

    // Create Subscription
    const newSubscription = await Subscription.create({
      userId,
      planType: planId,
      amount: selectedPlan.price,
      startDate,
      endDate,
      status: "active",
    }, { transaction: t });

    await t.commit();
    return sendResponse(res, true, 200, {
      subscription: newSubscription,
    }, "Subscription successful");

  } catch (error) {
    try { await t.rollback(); } catch(e) {}
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get current user's active subscription details
 */
export const getSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const currentSubscription = await Subscription.findOne({
      where: {
        userId,
        status: "active",
        endDate: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!currentSubscription) {
      return sendResponse(res, true, 200, { subscription: null }, "No active subscription found");
    }

    return sendResponse(res, true, 200, {
      subscription: currentSubscription,
    }, "Subscription details fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
