# Delhivery Api

## B2C Pincode Serviceability

##### This API provides the serviceability of the consignee's pin code.

- This API will provide visibility on whether a Pincode is serviceable or not.
- If any pin code is serviceable only then order creation or any further API needs to be used.
- If the API response is an empty list, the pincode is non-serviceable (NSZ).
- If filter_code is not passed, the API returns both serviceable and embargoed pincodes.
- In the response, remark as "Embargo" indicates temporary NSZ, while a blank remark means the pincode is serviceable.

### API

```javascript
const options = {
  method: "GET",
  headers: { Authorization: "Token xxxxxxxxxxxxxxxx" },
};

fetch(
  "https://staging-express.delhivery.com/c/api/pin-codes/json/?filter_codes=194103",
  options,
)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/c/api/pin-codes/json/?filter_codes={pin_code}
```

Production Environment URL

```bash
https://track.delhivery.com/c/api/pin-codes/json/?filter_codes={pin_code}
```

### Parameters

| PARAMETERS             | MANDATORY | DESCRIPTION                                                                            |
| ---------------------- | --------- | -------------------------------------------------------------------------------------- |
| `filter_codes` Integer | False     | Pincodes for which the serviceability needs to be checked, pass one pincode at a time. |

### Rate Limit and Latency

| METRICS                                          | VALUE   |
| ------------------------------------------------ | ------- |
| Average Latency _(PRODUCTION)_                   | 86.02ms |
| P99 Latency _(PRODUCTION)_                       | 98.22ms |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 4500    |

---

## Expected TAT API

#### This API provides the estimated TAT between the origin and destination pin code.

- This API lets you query for TAT by providing the origin and destination PIN before an order is placed. This will provide the number of days in response.
- The TAT begins from the moment the shipment is handed over to Delhivery.
- The TAT provided is determined by the current network performance and may vary based on persistent delays in certain lanes. Similarly, our current network TAT may be faster than our promised TAT to you at the time of onboarding.
- Different lanes may have unique cutoffs, which can affect expected delivery times.
- If the expected delivery date falls on a holiday or Sunday, it will be adjusted to the next non-holiday.

### API

```javascript
const options = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: "Token ********",
  },
};

fetch(
  "https://express-dev-test.delhivery.com/api/dc/expected_tat?origin_pin=122003&destination_pin=136118&mot=S&pdt=B2C&expected_pickup_date=2024-05-31",
  options,
)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/dc/expected_tat?origin_pin=122003&destination_pin=136118&mot=S
```

Production Environment URL

```bash
https://track.delhivery.com/api/dc/expected_tat?origin_pin=122003&destination_pin=136118&mot=S
```

### Parameters

| PARAMETERS                    | MANDATORY | DESCRIPTION                                                                                                                                                                                        |
| ----------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `origin_pin` String           | True      | The pin code of the shipment's origin location.                                                                                                                                                    |
| `destination_pin` String      | True      | The pin code of the shipment's destination location.                                                                                                                                               |
| `mot` String                  | True      | Mode of Transport: 'S' for Surface, 'E' for Express, 'N' for NDD (Next Day Delivery).                                                                                                              |
| `pdt` String                  | True      | Product Type: 'B2B', 'B2C', or empty (defaults to B2C if not provided).                                                                                                                            |
| `expected_pickup_date` String | True      | Datetime when pickup will be done. Based on this date, the response will show an expected delivery date considering the TAT and holidays in between. Format for this payload is "YYYY-MM-DD HH:mm" |

### Rate Limit and Latency

| METRICS                                          | VALUE       |
| ------------------------------------------------ | ----------- |
| Average Latency _(PRODUCTION)_                   | 158.41ms    |
| P99 Latency _(PRODUCTION)_                       | 98.366.49ms |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 750         |

---

## Fetch WayBill

##### This API is used to generate the bulk waybill list in advance, which can be stored and used in the order creation API.

- The Bulk Waybill API generates waybills in bulk, which can be used during shipment manifestation or creation.
- Up to 10,000 waybills in a single request can be fetched using this API and can be stored in the database for later use in the shipment manifestation.
- A maximum of 50,000 waybills can be fetched within a 5-minute window. Exceeding this limit will result in your IP being throttled for 1 minute.
- **Note:** Waybills are generated in batches of 25 at the backend. Using them immediately after fetching may occasionally result in errors, so we recommend storing them on your end and using them later during manifest creation.

### API

```javascript
const options = { method: "GET", headers: { Accept: "application/json" } };

fetch(
  "https://staging-express.delhivery.com/waybill/api/bulk/json/?token=xxxxxxxxxxxxxxxx&count=5",
  options,
)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/waybill/api/bulk/json/?count={count}
```

Production Environment URL

```bash
https://track.delhivery.com/waybill/api/bulk/json/?count={count}
```

### Parameters

| PARAMETERS      | MANDATORY | DESCRIPTION                                                          |
| --------------- | --------- | -------------------------------------------------------------------- |
| `count` Integer | True      | Number of waybills you want to fetch; Should not be more than 10,000 |

### Rate Limit and Latency

| METRICS                                          | VALUE    |
| ------------------------------------------------ | -------- |
| Average Latency _(PRODUCTION)_                   | 129.84ms |
| P99 Latency _(PRODUCTION)_                       | 154.02ms |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 5        |

---

## Fetch Single WayBill API

##### Fetch waybill API helps to fetch a single waybill at a time, every time the API is hit.

- The Fetch Waybill API generates a single waybill at a time

### API

```javascript
const options = { method: "GET", headers: { Accept: "application/json" } };

fetch(
  "https://staging-express.delhivery.com/waybill/api/fetch/json/?token=xxxxxxxxxxxxxxxx",
  options,
)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/waybill/api/fetch/json/
```

Production Environment URL

```bash
https://track.delhivery.com/waybill/api/fetch/json/
```

### Parameters

| PARAMETERS     | MANDATORY | DESCRIPTION            |
| -------------- | --------- | ---------------------- |
| `token` String | True      | Pass the account token |

### Rate Limit and Latency

| METRICS                                          | VALUE   |
| ------------------------------------------------ | ------- |
| Average Latency _(PRODUCTION)_                   | 69.84ms |
| P99 Latency _(PRODUCTION)_                       | 94.02ms |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 750     |

---

## Shipment Creation

#### This API is used to generate a B2C shipment in the Delhivery system.

- The order creation process is the same for both forward flow (from client warehouse to end customer) and reverse flow (from customer to client warehouse), differing only in the payment_mode key:
  - Pickup for reverse packages
  - COD or Prepaid for forward packages
  - REPL for replacement Shipments
- **Single Piece Shipment:** One waybill represents a package that can contain multiple items (e.g., an order with t-shirts, shoes, and shampoo packed together).
- **Multi Piece Shipment:** Contains multiple boxes within one order. Each box should have its own waybill number.
- The **Order ID** must be unique for each new order
- The raw JSON body does not accept special characters: “&”, “#”, “%”, “;”, “\”. Use URL-encoded payloads instead.
- Try to include all fields mentioned in the sample payload, even if they are not mandatory. These fields are considered good to have for optimal processing

**Key Changes in Order Creation for RVP:**

- Set the payment mode as "Pickup" in the manifest payload.
- When "Pickup" is used as the payment mode, the customer information will be treated as the pickup location. The return_add and other return-related fields will be used to define the drop/delivery address.
- If both a return address and a pickup location are provided for a pickup shipment, the system will prioritize the return address, and the shipment will be delivered there.

**Key Changes in Order Creation for REPL:**

- Set the payment mode as "REPL" in the manifest payload.
- A single waybill will be generated, and the entire exchange journey will be executed using this one waybill.
- The pickup location will serve as the pickup address, customer address as exchange location and return address will be treated as the final delivery address for the REPL shipment after successful exchange.
- If the return address is not provided, the pickup location will be used as the final delivery address for the exchange shipment.

### API

```javascript
const options = {
  method: "POST",
  headers: {
    Authorization: "Token XXXXXXXXXXXXXXXXX",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: 'format=json&data={\n  "shipments": [\n    {\n      "name": "Consignee name",\n      "add": "Huda Market, Haryana",\n      "pin": "110042",\n      "city": "Gurugram",\n      "state": "Haryana",\n      "country": "India",\n      "phone": "9999999999",\n      "order": "Test Order 01",\n      "payment_mode": "Prepaid",\n      "return_pin": "",\n      "return_city": "",\n      "return_phone": "",\n      "return_add": "",\n      "return_state": "",\n      "return_country": "",\n      "products_desc": "",\n      "hsn_code": "",\n      "cod_amount": "",\n      "order_date": null,\n      "total_amount": "",\n      "seller_add": "",\n      "seller_name": "",\n      "seller_inv": "",\n      "quantity": "",\n      "waybill": "",\n      "shipment_width": "100",\n      "shipment_height": "100",\n      "weight": "",\n      "shipping_mode": "Surface",\n      "address_type": ""\n    }\n  ],\n  "pickup_location": {\n    "name": "warehouse_name"\n  }\n}',
};

fetch("https://staging-express.delhivery.com/api/cmu/create.json", options)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/cmu/create.json
```

Production Environment URL

```bash
https://track.delhivery.com/api/cmu/create.json
```

### Parameters

| PARAMETERS                  | MANDATORY | DESCRIPTION                                                                                                                                          |
| --------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name` String               | True      | Name of the consignee                                                                                                                                |
| `order` String              | True      | Order ID                                                                                                                                             |
| `phone` String              | True      | Consignee phone number                                                                                                                               |
| `add` String                | True      | Address of the consignee                                                                                                                             |
| `pin` Integer               | True      | Pincode of the consignee                                                                                                                             |
| `address_type` String       | False     | Address type (home/office)                                                                                                                           |
| `ewbn` String               | False     | Ewaybill number (for packages ≥ 50k)                                                                                                                 |
| `hsn_code` String           | False     | HSN Code for e-waybill; more than one HSN can be passed if the quantity is > 1.                                                                      |
| `shipping_mode` String      | False     | Shipping mode (Surface/Express)                                                                                                                      |
| `seller_inv` String         | False     | Seller invoice                                                                                                                                       |
| `city` String               | False     | City of the consignee                                                                                                                                |
| `weight` Float              | False     | Weight of the shipment (gms)                                                                                                                         |
| `return_name` String        | False     | Return name                                                                                                                                          |
| `return_address` String     | False     | Return address                                                                                                                                       |
| `return_city` String        | False     | Return city                                                                                                                                          |
| `return_phone` String       | False     | Return phone number                                                                                                                                  |
| `return_state` String       | False     | Return state                                                                                                                                         |
| `return_country` String     | False     | Return country                                                                                                                                       |
| `return_pin` Integer        | False     | Return pincode                                                                                                                                       |
| `seller_name` String        | False     | Seller name                                                                                                                                          |
| `fragile_shipment` Boolean  | False     | Indicates if the shipment contains fragile items (true/false)                                                                                        |
| `shipment_height` Float     | False     | Height of the shipment (cm)                                                                                                                          |
| `shipment_width` Float      | False     | Width of the shipment (cm)                                                                                                                           |
| `shipment_length` Float     | False     | Length of the shipment (cm)                                                                                                                          |
| `cod_amount` Float          | False     | Cash on Delivery (COD) amount                                                                                                                        |
| `products_desc` String      | False     | Product Description                                                                                                                                  |
| `state` String              | False     | State of the consignee (e.g., Rajasthan)                                                                                                             |
| `dangerous_good` Boolean    | False     | Dangerous goods flag (true/false)                                                                                                                    |
| `waybill` String            | False     | SPS: Waybill can be passed in the payload or can be skipped as well. MPS: Waybill needs to be passed for each box explicitly in the API.             |
| `total_amount` Float        | False     | Total amount                                                                                                                                         |
| `seller_add` String         | False     | Seller address                                                                                                                                       |
| `country` String            | False     | Country (mandatory for Bangladesh, 'BD' value)                                                                                                       |
| `plastic_packaging` Boolean | False     | Plastic packaging flag (true/false)                                                                                                                  |
| `quantity` String           | False     | Quantity                                                                                                                                             |
| `pickup_location` String    | True      | Name should be exactly the same as the name of the WareHouse registered. It is case/space sensitive.                                                 |
| `transport_speed` String    | False     | By passing the transport_speed field in the manifest request, you can choose: F – Next Day Delivery (NDD) **OR** D – Standard delivery (regular TAT) |
| `payment_mode` String       | True      | The value should be: **Pickup** for reverse shipments , **COD** or **Prepaid** for forward shipments and **REPL** for replacement shipments          |

### Rate Limit and Latency

| METRICS                                          | VALUE    |
| ------------------------------------------------ | -------- |
| Average Latency _(PRODUCTION)_                   | 283.57ms |
| P99 Latency _(PRODUCTION)_                       | 1.59s    |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 20000    |

---

## MPS Manifestation

##### MPS (Multi-Package Shipment) refers to a single order shipped in multiple boxes. Each box is assigned a unique waybill number, with one designated as the master waybill and the others as child waybills.

- The manifest payload for MPS shipments is similar to non-MPS, with the addition of specific MPS-related keys mentioned below
- Prefetched waybills are mandatory for MPS shipments and must be included in the manifest payload.
- For an MPS order with N boxes, include details of all N boxes within the shipments array; the sample payload illustrates a 2-box MPS example.

### API

```javascript
const options = {
  method: "POST",
  headers: {
    Authorization: "Token XXXXXXXXXXXXXXXXX",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    pickup_location: { name: "warehouse_name" },
    shipments: [
      {
        order: "123456",
        weight: "100",
        mps_amount: "0",
        mps_children: "2",
        pin: "122002",
        products_desc: "Toys, ToyCar",
        add: "Test Address",
        shipment_type: "MPS",
        state: "TAMIL NADU",
        master_id: "xxxxxxxxxxxxx",
        city: "CHENNAI",
        waybill: "xxxxxxxxxxxxx",
        phone: "9999888800",
        payment_mode: "Prepaid",
        name: "Test Name",
        total_amount: "4250",
        country: "India",
      },
      {
        order: "orderiod",
        weight: "100",
        mps_amount: "0",
        mps_children: "2",
        pin: "600063",
        products_desc: "product description",
        add: "Consignee Address",
        shipment_type: "MPS",
        state: "TAMIL NADU",
        master_id: "xxxxxxxxxxxxx",
        city: "CHENNAI",
        waybill: "xxxxxxxxxxxxx",
        phone: "9999888800",
        payment_mode: "Prepaid",
        name: "Consignee Naame",
        total_amount: "4250",
        country: "India",
      },
    ],
  }),
};

fetch("https://staging-express.delhivery.com/api/cmu/create.json", options)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/cmu/create.json
```

Production Environment URL

```bash
https://track.delhivery.com/api/cmu/create.json
```

### Parameters

| PARAMETERS             | MANDATORY | DESCRIPTION                                                            |
| ---------------------- | --------- | ---------------------------------------------------------------------- |
| `mps_amount` Integer   | True      | Sum of all package amounts for cod. It will be zero in case of prepaid |
| `mps_children` Integer | True      | It is sum of master and child package                                  |
| `master_id` Integer    | True      | This will master waybill and need to be passed with every box          |
| `shipment_type` string | True      | Pass **MPS** for manifestation of an MPS shipment                      |

### Rate Limit and Latency

| METRICS                                          | VALUE    |
| ------------------------------------------------ | -------- |
| Average Latency _(PRODUCTION)_                   | 283.57ms |
| P99 Latency _(PRODUCTION)_                       | 1.59s    |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 20000    |

---

## Shipment Cancellation

##### This API allows to cancel the shipment.

- Shipment Cancellation is allowed only on a limited package status.
  1. For Forward Shipment (Payment mode: COD/Prepaid), below are the allowed package statuses where cancellation is allowed:
     - Manifested
     - In Transit
     - Pending
  2. For RVP shipment (Payment mode: Pickup), below are the allowed package statuses where cancellation is allowed:
     - Scheduled
  3. For REPL shipment (Payment mode: REPL), below are the allowed package statuses where cancellation is allowed:
     - Manifested
     - In Transit
     - Pending
- If a manifested shipment is canceled before pickup, its status remains Manifested with the status type UD (Undelivered).
- If a shipment in In Transit or Pending state is canceled, the status stays In Transit and the status type changes to RT (Return to Origin).
- If a scheduled shipment is canceled, its status updates to Canceled with the status type CN (Cancellation).

### API

```javascript
const options = {
  method: "POST",
  headers: {
    Authorization: "Token XXXXXXXXXXXXXXXXX",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ waybill: "6945XXXXXXXX", cancellation: "true" }),
};

fetch("https://staging-express.delhivery.com/api/p/edit", options)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/p/edit
```

Production Environment URL

```bash
https://track.delhivery.com/api/p/edit
```

### Parameters

| PARAMETERS            | MANDATORY | DESCRIPTION                                              |
| --------------------- | --------- | -------------------------------------------------------- |
| `waybill` String      | True      | Waybill number of the shipment                           |
| `cancellation` String | True      | This key needs to be passed as true to cancel a shipment |

### Rate Limit and Latency

| METRICS                                          | VALUE    |
| ------------------------------------------------ | -------- |
| Average Latency _(PRODUCTION)_                   | 153.43ms |
| P99 Latency _(PRODUCTION)_                       | 318ms    |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 12200    |

---

## Ewaybill Update API

##### This API allows to update the e-waybill of the shipment.

- An E-Way Bill is an electronic document (having details such as the goods being transported, their value, the sender, the receiver, and the route.) that is required for the transportation of goods having shipment value>50k as per the Indian government laws.
- Use the EWB update API to update the e-waybill of the shipments having value > 50k
- This API updates the forward E-waybill when the shipment is in the forward flow, and updates the return E-waybill when the shipment is in the return flow.

### API

```javascript
const options = {
  method: "PUT",
  headers: {
    Authorization: "Token xxxxxxxxxxxxxxxx",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    data: [{ dcn: "pass the invoice number", ewbn: "pass the ewb number" }],
  }),
};

fetch(
  "https://staging-express.delhivery.com/api/rest/ewaybill/XXXXXXXXXXXXX/",
  options,
)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/rest/ewaybill/{waybill}/
```

Production Environment URL

```bash
https://track.delhivery.com/api/rest/ewaybill/{waybill}/
```

### Parameters

| PARAMETERS     | MANDATORY | DESCRIPTION                                              |
| -------------- | --------- | -------------------------------------------------------- |
| `dcn` Varchar  | True      | Pass the invoice number                                  |
| `ewbn` Varchar | True      | Pass the ewb (e-waybill) number that needs to be updated |

### Rate Limit and Latency

| METRICS                                          | VALUE    |
| ------------------------------------------------ | -------- |
| Average Latency _(PRODUCTION)_                   | 327.6ms  |
| P99 Latency _(PRODUCTION)_                       | 501.68ms |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 250      |

---

## Shipment Tracking

##### The API provides the current status and detailed history of scans applied to the shipment.

- The track API takes as input as either waybill number or order ID, and returns all the details of the scans applied on the shipment.
- Track upto 50 waybills (comma-separated) with a single request

### API

```javascript
const options = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Token XXXXXXXXXXXXXXXXXX",
  },
};

fetch(
  "https://staging-express.delhivery.com/api/v1/packages/json/?waybill=1122345678722&ref_ids=",
  options,
)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/v1/packages/json/?waybill={waybill_num}&ref_ids={order_id}
```

Production Environment URL

```bash
https://track.delhivery.com/api/v1/packages/json/?waybill={waybill_num}&ref_ids={order_id}
```

### Parameters

| PARAMETERS       | MANDATORY | DESCRIPTION    |
| ---------------- | --------- | -------------- |
| `waybill` String | True      | Waybill Number |
| `ref_ids` String | False     | Order_Id       |

### Rate Limit and Latency

| METRICS                                          | VALUE    |
| ------------------------------------------------ | -------- |
| Average Latency _(PRODUCTION)_                   | 130.31ms |
| P99 Latency _(PRODUCTION)_                       | 529.15ms |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 750      |

---

## Calculate Shipping Cost

##### This API is used to calculate the Estimated Shipping Charges for the Shipments.

- This API provides approximate values for shipping charges, which are subject to change.

### API

```javascript
const options = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Token XXXXXXXXXXXXXXXXXX",
  },
};

fetch(
  "https://staging-express.delhivery.com/api/kinko/v1/invoice/charges/.json?md=E&ss=Delivered&d_pin=110053&o_pin=110042&cgm=10&pt=Pre-paid",
  options,
)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/kinko/v1/invoice/charges/.json?md=E&ss=Delivered&d_pin=110053&o_pin=110042&cgm=10&pt=Pre-paid
```

Production Environment URL

```bash
https://track.delhivery.com/api/kinko/v1/invoice/charges/.json?md=E&ss=Delivered&d_pin=110053&o_pin=110042&cgm=10&pt=Pre-paid
```

### Parameters

| PARAMETERS         | MANDATORY | DESCRIPTION                                                                |
| ------------------ | --------- | -------------------------------------------------------------------------- |
| `md` String        | True      | Billing Mode of shipment ( E for Express/ S for Surface ).                 |
| `cgm` Integer      | True      | Chargeable weight of the shipment (Only in Grams Unit); Default value is 0 |
| `o_pin` Integer    | True      | Pincode of origin city; 6 Digit Valid Pin code                             |
| `d_pin` Integer    | True      | Pincode of destination city; 6 Digit Valid Pin code                        |
| `ss` String        | True      | Status of shipment (Delivered, RTO, DTO)                                   |
| `pt` String        | True      | Payment Type ( Pre-paid, COD )                                             |
| `l` Integer        | False     | Length of shipment                                                         |
| `b` Integer        | False     | Breadth of shipment                                                        |
| `h` Integer        | False     | Height of shipment                                                         |
| `ipkg_type` String | False     | Type of Package (box/flyer)                                                |

### Rate Limit and Latency

| METRICS                                          | VALUE    |
| ------------------------------------------------ | -------- |
| Average Latency _(PRODUCTION)_                   | 450.94ms |
| P99 Latency _(PRODUCTION)_                       | 61.14s   |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 50       |

---

## Generate Shipping Label

##### This API is used to Generate Shipping labels against a waybill number. Shipping labels can also be downloaded from the One Panel.

- A custom label can be created by setting the pdf parameter to false. The API will return a JSON response, which should be rendered into HTML using encoding 128. This allows for flexibility in designing the layout of the shipping label and adding any necessary information.
- Additionally, you can use the parameter pdf_size to generate labels in different sizes.
  - For size 8x11 (A4), pass: pdf_size=A4
  - For size 4x6 (4R), pass: pdf_size=4R
- If the pdf_size parameter is not provided, the label will default to A4 size.

### API

```javascript
const options = {
  method: "GET",
  headers: {
    Authorization: "Token XXXXXXXXXXXXXXXXX",
    "Content-Type": "application/json",
  },
};

fetch(
  "https://staging-express.delhivery.com/api/p/packing_slip?wbns=7035xxxxxxxxxxx&pdf=true&pdf_size=4R",
  options,
)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/p/packing_slip?wbns=waybill&pdf=true&pdf_size=
```

Production Environment URL

```bash
https://track.delhivery.com/api/p/packing_slip?wbns=waybill&pdf=true&pdf_size=
```

### Parameters

| PARAMETERS        | MANDATORY | DESCRIPTION                                                                                                                                                              |
| ----------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `waybill` String  | True      | Waybill number of the shipment                                                                                                                                           |
| `pdf` Boolean     | False     | If passed True: An S3 link of the pdf will be generated which cannot be customized.If passed False: Response would be Json, that can manipulated as per the requirement. |
| `pdf_size` String | False     | For size 8x11 (A4), pass: pdf_size=A4 For size 4x6 (4R), pass: pdf_size=4R                                                                                               |

### Rate Limit and Latency

| METRICS                                          | VALUE    |
| ------------------------------------------------ | -------- |
| Average Latency _(PRODUCTION)_                   | 210.64ms |
| P99 Latency _(PRODUCTION)_                       | 61.14s   |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 3000     |

---

## Pickup Request Creation

##### The Pickup Request Creation API is used to initiate a pickup request once an order has been manifested and is ready for collection.

- The pickup request is raised against the warehouse location, not the waybill number. Therefore, you do not need to create multiple pickup requests for multiple waybills if they are all being picked up from a single location. If shipments are at two different locations, you need to raise separate pickup requests for each location.
- For any given day, a second pickup request can be raised for any warehouse only when the existing pickup request is closed.
- The shipping label on the shipment should include essential information such as the recipient's address, a scannable tracking number barcode, and any other relevant shipping details.
- The right time to create a pickup request is when the shipment is packed and ready to be handed over to the FE.
- Integrating this API is optional since pickup requests can also be created from the One Panel. Additionally, you can enable auto-pickup for your account with assistance from your account POC.

### API

```javascript
const options = {
  method: "POST",
  headers: {
    Authorization: "Token XXXXXXXXXXXXXXXXX",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    pickup_time: "11:00:00",
    pickup_date: "2023-12-29",
    pickup_location: "warehouse_name",
    expected_package_count: 1,
  }),
};

fetch("https://staging-express.delhivery.com/fm/request/new/", options)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/fm/request/new/
```

Production Environment URL

```bash
https://track.delhivery.com/fm/request/new/
```

### Parameters

| PARAMETERS                       | MANDATORY | DESCRIPTION                                                                                               |
| -------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `pickup_time` String             | True      | Time for the pickup(hh:mm:ss)                                                                             |
| `pickup_date` String             | True      | Date for the pickup(YYYY-MM-DD)                                                                           |
| `pickup_location` String         | True      | Registered client warehouse from where the shipment is to be picked. Also referred to as pickup location. |
| `expected_package_count` Integer | True      | Count of packages that need to be picked up.                                                              |

### Rate Limit and Latency

| METRICS                                          | VALUE    |
| ------------------------------------------------ | -------- |
| Average Latency _(PRODUCTION)_                   | 242.37ms |
| P99 Latency _(PRODUCTION)_                       | 885.95ms |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 4000     |

---

## Client Warehouse Creation

##### This API is used to register the pickup location in the Delhivery system, which is further used to create the order.

- The client’s pickup locations or warehouses, where shipments will be physically picked up, must be registered in the Delhivery system beforehand.
- Warehouse name is case-sensivite so whatever name you register with this API, make sure exact same warehouse name is used while creating order
- A return address also need to be configured for each warehouse, which can either be the warehouse itself or some other address.

### API

```javascript
const options = {
  method: "POST",
  headers: {
    Authorization: "Token XXXXXXXXXXXXXXXXX",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    phone: "9999999999",
    city: "Kota",
    name: "test_name",
    pin: "110042",
    address: "address",
    country: "India",
    email: "abc@gmail.com",
    registered_name: "registered_account_name",
    return_address: "return_address",
    return_pin: "110042",
    return_city: "Kota",
    return_state: "Delhi",
    return_country: "India",
  }),
};

fetch(
  "https://staging-express.delhivery.com/api/backend/clientwarehouse/create/",
  options,
)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/backend/clientwarehouse/create/
```

Production Environment URL

```bash
https://track.delhivery.com/api/backend/clientwarehouse/create/
```

### Parameters

| PARAMETERS               | MANDATORY | DESCRIPTION                                                                                         |
| ------------------------ | --------- | --------------------------------------------------------------------------------------------------- |
| `name` String            | True      | Name the warehouse, It will be considered as your pickup location.                                  |
| `registered_name` String | False     | Pass your registered account name(YYYY-MM-DD)                                                       |
| `phone` String           | True      | Contact number of the POC of the warehouse.                                                         |
| `email` String           | False     | Email address of the POC of the warehouse.                                                          |
| `address` String         | False     | Complete address of the warehouse.                                                                  |
| `city` String            | False     | City in which warehouse is located.                                                                 |
| `pin` String             | True      | Pincode of the area where the warehouse is located.                                                 |
| `country` String         | False     | Country where the warehouse is located.                                                             |
| `return_address` String  | True      | Complete return address of the warehouse. It can be the same as the pickup address as wel(hh:mm:ss) |
| `return_city` String     | False     | City where the shipment will be returned(YYYY-MM-DD)                                                |
| `return_pin` String      | False     | Pincode of the city where the shipment will be returned.                                            |
| `return_state` String    | False     | State where the shipment will be returned.                                                          |
| `return_country` String  | False     | Country where the shipment will returned.                                                           |

### Rate Limit and Latency

| METRICS                                          | VALUE    |
| ------------------------------------------------ | -------- |
| Average Latency _(PRODUCTION)_                   | 172.45ms |
| P99 Latency _(PRODUCTION)_                       | 396.51ms |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 10       |

---

## Client Warehouse Updation

##### This API is used to edit/update an existing Warehouse

- Warehouse name cannot be updated.
- You must provide the warehouse name along with the fields you wish to update.
- Only the parameters listed below can be updated for the given warehouse name.

### API

```javascript
const options = {
  method: "POST",
  headers: {
    Authorization: "Token XXXXXXXXXXXXXXXXX",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "registered_wh_name",
    phone: "9988******",
    address: "HUDA Market, Gurugram, Haryana - 122001",
  }),
};

fetch(
  "https://staging-express.delhivery.com/api/backend/clientwarehouse/edit/",
  options,
)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/backend/clientwarehouse/edit/
```

Production Environment URL

```bash
https://track.delhivery.com/api/backend/clientwarehouse/edit/
```

### Parameters

| PARAMETERS       | MANDATORY | DESCRIPTION                                                            |
| ---------------- | --------- | ---------------------------------------------------------------------- |
| `name` String    | True      | Warehouse name in our system for which the details need to be updated. |
| `address` String | False     | address that needs to be updated                                       |
| `pin` String     | True      | pincode for the warehouse that needs to be updated                     |
| `phone` String   | False     | Phone number that needs to be updated                                  |

### Rate Limit and Latency

| METRICS                                          | VALUE    |
| ------------------------------------------------ | -------- |
| Average Latency _(PRODUCTION)_                   | 345.65ms |
| P99 Latency _(PRODUCTION)_                       | 61.16s   |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 10       |

---

## NDR API

##### This API allows you to take action on NDR shipments.

- NDR API is an asynchronous API, which provides the UPL ID in the Response.
- The UPL ID is further used in the GET NDR Status API to get the status of the UPL ID for which the NDR action was taken.
- Currently, 2 actions are allowed in the NDR API: `RE-ATTEMPT` and `PICKUP_RESCHEDULE`.

### Key Considerations for using the NDR API

**1. For RE-ATTEMPT:**

- `RE-ATTEMPT` action can be applied to an AWB if its current NSL code is in the following list: `["EOD-74", "EOD-15", "EOD-104", "EOD-43", "EOD-86", "EOD-11", "EOD-69", "EOD-6"]`.
- It is recommended to apply `RE-ATTEMPT` late in the evening (after 9 PM) to ensure all NDR AWBs are back in the facility and all dispatches are closed.
- Always verify the current NSL of the AWB while applying NDR.
- The attempt count for the shipment should be either 1 or 2.

**2. For PICKUP_RESCHEDULE:**

- This action can be applied to an AWB if it fulfills the below conditions:
- If the AWB current NSL code is in the below list `["EOD-777", "EOD-21"]` , the shipment status is marked as Cancelled.
- _Note:_ Shipment should be Non OTP Cancelled.
- Apply `PICKUP_RESCHEDULE` after 9 PM to ensure that all open dispatches in the facility are closed by that time.
- The attempt count for the shipment should be either 1 or 2.

### API

```bash
curl --request POST \
	--url https://express-dev-test.delhivery.com/api/p/update \
	--header 'Accept: application/json' \
	--header 'Authorization: Token ******************************' \
	--header 'Content-Type: application/json' \
	--data '
{
  "data": [
    {
      "waybill": "13163116xxxxxx",
      "act": "RE-ATTEMPT"
    }
  ]
}
'

```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/p/update

```

Production Environment URL

```bash
https://track.delhivery.com/api/p/update

```

### Parameters

| PARAMETERS       | MANDATORY | DESCRIPTION                                                         |
| ---------------- | --------- | ------------------------------------------------------------------- |
| `waybill` string | True      | Waybill for which NDR needs to be applied                           |
| `act` string     | True      | Action needs to be passed here, `RE-ATTEMPT` or `PICKUP_RESCHEDULE` |

### Rate Limit and Latency

| METRICS                                          | VALUE   |
| ------------------------------------------------ | ------- |
| Average Latency _(PRODUCTION)_                   | 93.77ms |
| P99 Latency _(PRODUCTION)_                       | 126.38s |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | NA      |

### GET NDR STATUS API

##### This API is used to get the status of the request_id (i.e. UPL ID) received from the NDR API.

```bash
curl --request GET \
	--url 'https://track.delhivery.com/api/cmu/get_bulk_upl/UPL70200521839149515?verbose=true' \
	--header 'Accept: application/json' \
	--header 'Authorization: Token **************************' \
	--header 'Content-Type: application/json'

```

| METRICS                                          | VALUE   |
| ------------------------------------------------ | ------- |
| Average Latency _(PRODUCTION)_                   | 75.03ms |
| P99 Latency _(PRODUCTION)_                       | 88.03s  |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | NA      |

---

## Download Document API

##### This API allows fetching documents associated with B2C orders.

- Document download API enables retrieving multiple types of documents that are not archived in the Delhivery system.
- Allowed Document Types: `SIGNATURE_URL`, `RVP_QC_IMAGE`, `EPOD`, `SELLER_RETURN_IMAGE`.

### API

```bash
curl --request GET \
	--url 'https://staging-express.delhivery.com/api/rest/fetch/pkg/document/?doc_type=doc_type&waybill=1234567890' \
	--header 'Authorization: Token ********************' \
	--header 'Cookie: sessionid=14901340921'

```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/rest/fetch/pkg/document/?doc_type={doc_type}&waybill={AWB}

```

Production Environment URL

```bash
https://track.delhivery.com/api/rest/fetch/pkg/document/?doc_type={doc_type}&waybill={AWB}

```

### Parameters

| PARAMETERS         | MANDATORY | DESCRIPTION                                                   |
| ------------------ | --------- | ------------------------------------------------------------- |
| `doc_type` Varchar | True      | The type of document to fetch (e.g., `SIGNATURE_URL`, `EPOD`) |
| `waybill` integer  | True      | Delhivery waybill number                                      |

---

## RVP QC 3.0

##### This is used to perform Quality Check (QC) at the consignee's doorstep for an RVP (Reverse Pickup) shipment.

- This is an updated version of the RVP QC that gives the flexibility of a question-based model.
- It will allow a set of questions against each item to be picked on the ground by FE from the end customer.
- Pickup will only be made once all the mandatory questions have been answered correctly.

### Steps of Integration

**1. QC Question Mapping**
A one-time QC mapping is required on Delhivery’s end to enable this feature. Based on the client’s QC requirements, the Delhivery BD team will share the relevant Delhivery QC questions along with their corresponding question IDs. The client must then map these Delhivery question IDs to their own question IDs and share the mapping in the specified format, so it can be configured in the Delhivery system.

| CLIENT QUESTION ID   | DLV QUESTION ID   |
| -------------------- | ----------------- |
| Client Question id-1 | DLV Question id-1 |
| Client Question id-2 | DLV Question id-2 |
| Client Question id-3 | DLV Question id-3 |
| Client Question id-4 | DLV Question id-4 |
| Client Question id-5 | DLV Question id-5 |

**2. Order Creation**
When creating an RVP order via API, 2 keys must be included in the manifest payload:

- `qc_type`: Set this key to the hardcoded value `param` to indicate Parametric QC.
- `custom_qc`: Include the QC data in the manifest payload within this array. Refer to the sample payload in the request section.

> **NOTE:** A maximum of 2 items can undergo QC, with a limit of 6 questions per item. If these limits are exceeded, the shipment will still be created, but it will be marked as a non-QC shipment.

### API

```bash
curl --request POST \
	--url https://staging-express.delhivery.com/api/cmu/create.json \
	--header 'Authorization: Token xxxxxxxxxxxxxxxxxxxxx' \
	--header 'Content-Type: application/json' \
	--data 'format=json&data={
  "shipments": [
    {
      "client": "pass the registered client name",
      "return_name": "test_designs",
      "order": "1234567890",
      "return_country": "India",
      "weight": "150.0 gm",
      "city": "Meerjapuram",
      "pin": "521111",
      "return_state": "Gujarat",
      "products_desc": "NEW EI PIKOK (PURPAL-ORANGE)",
      "shipping_mode": "Express",
      "state": "Andhra Pradesh",
      "quantity": 1,
      "waybill": "123455678910",
      "phone": "1234567890",
      "add": "7 106 abc road, 2020 bulding ",
      "payment_mode": "Pickup",
      "order_date": "29-06-2023",
      "seller_gst_tin": "ABCD1234F",
      "name": "Jitendra Singh",
      "return_add": " SHOP NO 218,ABC Road, Mumbai",
      "total_amount": 749,
      "seller_name": "ABC Design",
      "return_city": "SURAT",
      "country": "India",
      "return_pin": "394101",
      "return_phone": "1234567890",
      "qc_type": "param",
      "custom_qc": [
        {
          "item": "mobile",
          "description": "Mi note 1 pro",
          "images": [
            "https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-note-pro-2.jpg"
          ],
          "return_reason": "Damaged",
          "quantity": 1,
          "brand": "Mi",
          "product_category": "mobile",
          "questions": [
            {
              "questions_id": "client Question id",
              "options": [
                ""
              ],
              "value": [
                "123456543"
              ],
              "required": true,
              "type": "varchar",
              "ques_images": [
                "http://ecx.images-amazon.com/images/I/414yumheSAS._AC_.jpg"
              ]
            }
          ]
        },
        {
          "item": "mobile",
          "description": "Mi note 2 pro",
          "images": [
            "https://static.toiimg.com/photo/55073523/Xiaomi-Mi-Note-2.jpg"
          ],
          "return_reason": "Damaged",
          "quantity": 2,
          "brand": "Mi",
          "product_category": "apparel",
          "questions": [
            {
              "questions_id": "client question id",
              "options": [
                "Black",
                "other"
              ],
              "value": [
                "Black"
              ],
              "required": true,
              "type": "multi",
              "ques_images": [
                "http://ecx.images-amazon.com/images/I/414yumheSAS._AC_.jpg"
              ]
            }
          ]
        }
      ]
    }
  ],
  "pickup_location": {
    "name": "pass the registered pickup WH name"
  }
}'

```

Test Environment URL

```bash
https://staging-express.delhivery.com/api/cmu/create.json

```

Production Environment URL

```bash
https://track.delhivery.com/api/cmu/create.json

```

### Parameters

| PARAMETERS                | MANDATORY | DESCRIPTION                                                                                                                                                                                         |
| ------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `item` string             | False     |                                                                                                                                                                                                     |
| `description` string      | True      |                                                                                                                                                                                                     |
| `images` list             | True      | Comma-separated multiple strings can be passed                                                                                                                                                      |
| `return_reason` string    | False     |                                                                                                                                                                                                     |
| `quantity` integer        | True      | Default value is 1, if quantity is not present                                                                                                                                                      |
| `brand` string            | False     |                                                                                                                                                                                                     |
| `product_category` string | False     |                                                                                                                                                                                                     |
| `questions` list          | True      |                                                                                                                                                                                                     |
| `questions_id` string     | True      | This will be the client question id and against this ID Delhivery will map one question at their end                                                                                                |
| `options` list            | True      |                                                                                                                                                                                                     |
| `value` list              | True      | Currently only the first element is chosen as the correct option                                                                                                                                    |
| `required` boolean        | True      | **False**: Question will still be asked but the answer will not affect the QC result.**True**: Question will be asked and the answer will affect QC result                                          |
| `type` String             | True      | `type == 'varchar'`; FE will type the answer. `type == 'multi'`; FE will select one of the given options                                                                                            |
| `ques_images` list        | False     | This is a non-mandatory field and completely optional for a client to pass. The client has to pass the image URL, which will be visible to the FE for a specific question for which QC is performed |

### Rate Limit and Latency

| METRICS                                          | VALUE     |
| ------------------------------------------------ | --------- |
| Average Latency _(PRODUCTION)_                   | 366.03 ms |
| P99 Latency _(PRODUCTION)_                       | 916.17ms  |
| Rate Limit (Requests/5 Minute/IP) _(PRODUCTION)_ | 20000     |

---
