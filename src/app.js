import errorCodes from "./errorcodes.js";
import { errorResponse } from "./utils.js";
import fetch from "node-fetch";
import SortedDeltaCoffeeShopList from "./sortedDeltaCoffeeShopList.js";

/** @const {String} TOKEN_URL url for fetching the token */
const TOKEN_URL = "https://blue-bottle-api-test.herokuapp.com/v1/tokens";

/** @const {String} COFFEE_SHOPS_URL url for fetching the coffee shops */
const COFFEE_SHOPS_URL =
  "https://blue-bottle-api-test.herokuapp.com/v1/coffee_shops?";

/**
 * Fetch the token from the API
 * 
 * @returns {String} token
 */
async function fetchToken() {
  return fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => data.token)
    .catch((error) => {
      console.log("Error while fetching the token", error);
    });
}

/**
 * Get the 3 closest coffee shops relative to current position
 * 
 * @param {Object} position
 * @param {Number} position.x
 * @param {Number} position.y
 *
 * @returns {Array<position>}
 */
export async function getNearestShops(position) {
  // Check if we received numbers as arguments
  if (isNaN(position.x) || isNaN(position.y)) {
    console.log("Invalid input: numbers expected");
    return errorResponse(errorCodes.INVALID_INPUT_ARGS_NAN);
  }

  // Get the token
  let token = await fetchToken();

  // Get the coffee shops list
  let coffeeShops;
  let responseCode;
  await fetch(
    COFFEE_SHOPS_URL +
      new URLSearchParams({
        token: token,
      }),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  )
    .then((response) => {
      responseCode = response.status;
      return response.json();
    })
    .then((json) => (coffeeShops = json));

  // Handle different response codes
  switch (responseCode) {
    case 200:
      break;

    case 401:
      console.log(
        "Failed fetching coffee shops list - Unauthorized. Error code: " +
          responseCode
      );
      return errorResponse(errorCodes.UNAUTHORIZED);

    case 406:
      console.log(
        "Failed fetching coffee shops list - Unacceptable Accept format. Error code: " +
          responseCode
      );
      return errorResponse(errorCodes.UNACCEPTABLE_ACCEPT_FORMAT);

    case 503:
      console.log(
        "Failed fetching coffee shops list - Service Unavailable. Error code: " +
          responseCode
      );
      return errorResponse(errorCodes.SERVICE_UNAVAILABLE);

    case 504:
      console.log(
        "Failed fetching coffee shops list - Timeout. Error code: " +
          responseCode
      );
      return errorResponse(errorCodes.TIMEOUT);

    default:
      console.log(
        "Failed fetching coffee shops list. Error code: " + responseCode
      );
      return errorResponse(errorCodes.GENERIC_ERROR);
  }

  // Create a sorted coffee shop list, relative to our position
  const sortedDeltaCoffeShopList = new SortedDeltaCoffeeShopList(
    coffeeShops,
    position.x,
    position.y
  );

  // Get the closest 3 coffee shops
  return sortedDeltaCoffeShopList.getNClosestCoffeShops(3);
}
