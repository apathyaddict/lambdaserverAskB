/**
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

// Run `npm install` locally before executing following code with `node sampleGetItemsApi.js`

/**
 * This sample code snippet is for ProductAdvertisingAPI 5.0's GetItems API
 * For more details, refer:
 * https://webservices.amazon.com/paapi5/documentation/get-items.html
 */
require("dotenv").config();
var ProductAdvertisingAPIv1 = require("../index");

var defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;

// Specify your credentials here. These are used to create and sign the request.
defaultClient.accessKey = process.env.ACCESS_KEY;
defaultClient.secretKey = process.env.SECRET_KEY;

/**
 * PAAPI Host and Region to which you want to send request.
 * For more details refer: https://webservices.amazon.com/paapi5/documentation/common-request-parameters.html#host-and-region
 */
defaultClient.host = "webservices.amazon.com";
defaultClient.region = "us-east-1";

var api = new ProductAdvertisingAPIv1.DefaultApi();

// Request Initialization

var getItemsRequest = new ProductAdvertisingAPIv1.GetItemsRequest();

/** Enter your partner tag (store/tracking id) and partner type */
getItemsRequest["PartnerTag"] = process.env.PARTNER_TAG;
getItemsRequest["PartnerType"] = "Associates";

/** Enter the Item IDs for which item information is desired */
  //getItemsRequest["ItemIds"] = ["B086WN6C7W"];

getItemsRequest["Condition"] = "New";

/**
 * Choose resources you want from GetItemsResource enum
 * For more details, refer: https://webservices.amazon.com/paapi5/documentation/get-items.html#resources-parameter
 */
getItemsRequest["Resources"] = [
  "Images.Primary.Medium",
  "ItemInfo.Title",
  "Offers.Listings.Price",
  "BrowseNodeInfo.BrowseNodes",
];

/**
 * Function to parse GetItemsResponse into an object with key as ASIN
 */
function parseResponse(itemsResponseList) {
  var mappedResponse = {};
  for (var i in itemsResponseList) {
    if (itemsResponseList.hasOwnProperty(i)) {
      mappedResponse[itemsResponseList[i]["ASIN"]] = itemsResponseList[i];
    }
  }
  return mappedResponse;
}

function getPricesApi(req, res) {
  let ASIN = req.query.asin;

  // Ensure that ASIN is an array
  if (!Array.isArray(ASIN)) {
    ASIN = [ASIN]; // Convert single ASIN to an array
  }

  // Split the ASIN array into chunks of 10
  const ASINChunks = [];
  while (ASIN.length > 0) {
    ASINChunks.push(ASIN.splice(0, 10));
  }

  // Process ASIN chunks asynchronously
  const promises = ASINChunks.map((chunk) => {
    getItemsRequest["ItemIds"] = chunk;

    return api.getItems(getItemsRequest);
  });

  Promise.all(promises)
    .then((results) => {
      const getItemsResponses = results.map((data) =>
        ProductAdvertisingAPIv1.GetItemsResponse.constructFromObject(data)
      );

      const mergedResponse = mergeResponses(getItemsResponses);

      if (mergedResponse["Errors"] !== undefined) {
        res.status(400).json(mergedResponse["Errors"]);
      } else {
        res.status(200).json(mergedResponse);
      }
    })
    .catch((error) => {
      console.log("Error calling PA-API 5.0!");
      console.log("Printing Full Error Object:\n" + JSON.stringify(error, null, 1));
      console.log("Status Code: " + error["status"]);

      if (error["response"] !== undefined && error["response"]["text"] !== undefined) {
        console.log(
          "Error Object: " +
            JSON.stringify(error["response"]["text"], null, 1)
        );
      }
    });
}

function mergeResponses(responses) {
  const mergedResponse = {
    ItemsResult: {
      Items: [],
    },
  };

  responses.forEach((response) => {
    if (response.ItemsResult && response.ItemsResult.Items) {
      mergedResponse.ItemsResult.Items.push(...response.ItemsResult.Items);
    }
  });

  return mergedResponse;
}




module.exports = { getPricesApi };
