import express from "express";
import crypto from "crypto";

const router = express.Router();

import { markOrderAsPaid } from "../controllers/orderController.js";

router.route("/paystack").post(async (req, res) => {
  try {
    // validate event
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash == req.headers["x-paystack-signature"]) {
      switch (req.body.event) {
        case "charge.success":
          await markOrderAsPaid(req.body.data);

          break;

        default:
          console.log(`Unhandled event type ${req.body.event}`);
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      error: `Webhook error: ${error.message}`,
    });
  }

  return res.sendStatus(200);
});

export default router;
