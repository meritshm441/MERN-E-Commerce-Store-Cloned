import Order from "../models/orderModel";

const markOrderAsPaid = async ({
  amount,
  status,
  paid_at: paidAt,
  reference: paystackReference,
  id: paystackTransactionId,
}) => {
  try {
    const order = await Order.findOne({ paystackReference });

    if (order.paidAt) return;

    if (
      status !== "success" ||
      paidAt === null ||
      amount !== order.totalPrice
    ) {
      res.status(400);
      throw new Error(`Order is not paid`);
    }

    if (order) {
      order.isPaid = true;
      order.paidAt = paidAt;
      order.paystackTransactionId = paystackTransactionId;

      const updateOrder = await order.save();
      res.status(200).json(updateOrder);
    } else {
      res.status(404);
      throw new Error("Order not found");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default markOrderAsPaid;
