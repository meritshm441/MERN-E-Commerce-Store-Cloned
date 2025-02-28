import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";

class Paystack {
  constructor() {
    this.PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    this.BASE_URL = "https://api.paystack.co";
  }

  makePaystackRequest = async (request) => {
    try {
      const { method, endPoint, body } = request;

      const fetchOptions = {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
        },
      };

      // If the method is POST, include the body in the request
      if (method === "POST" && body) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.BASE_URL}${endPoint}`, fetchOptions);

      if (!response.ok) {
        const error = await response.json();

        response.status(response.status);
        throw new Error(error.message);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  };

  initializeTransaction = async (body) => {
    return await this.makePaystackRequest({
      endPoint: "/transaction/initialize",
      method: "POST",
      body,
    });
  };
}

const paystack = new Paystack();

export default paystack;
