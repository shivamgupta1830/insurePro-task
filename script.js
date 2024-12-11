// Fetching CSV data
async function fetchCSV() {
  const response = await fetch("data.csv");
  return response.text();
}

// Parsing CSV data into JSON format
function parseCSV(csv) {
  const rows = csv.split("\n");
  const headers = rows[0].split(",");
  return rows.slice(1).map((row) => {
    const values = row.split(",");
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = isNaN(values[index])
        ? values[index].trim()
        : Number(values[index]);
    });
    return obj;
  });
}

// Process sales data
function analyzeSales(data) {
  let totalRevenue = 0;
  const monthWise = {};
  const popularityStats = {};

  data.forEach((entry) => {
    const { Date, SKU, Quantity, "Total Price": totalPrice } = entry;
    const month = Date.slice(0, 7); // to extract 'YYYY-MM'

    // Updating total revenue
    totalRevenue += totalPrice;

    // Initializing month data if not present
    if (!monthWise[month]) {
      monthWise[month] = {
        revenue: 0,
        items: {},
        totalQuantity: 0,
        maxItem: null,
        maxRevenueItem: null,
      };
    }

    const monthData = monthWise[month];
    monthData.revenue += totalPrice;
    monthData.totalQuantity += Quantity;

    // Updating item data for the month
    if (!monthData.items[SKU]) {
      monthData.items[SKU] = { quantity: 0, revenue: 0, orders: [] };
    }

    const itemData = monthData.items[SKU];
    itemData.quantity += Quantity;
    itemData.revenue += totalPrice;
    itemData.orders.push(Quantity);

    // Tracking most popular item (by quantity)
    if (!monthData.maxItem) {
      monthData.maxItem = SKU;
    } else if (
      itemData.quantity > monthData.items[monthData.maxItem].quantity
    ) {
      monthData.maxItem = SKU;
    }

    // Tracking highest revenue item
    if (!monthData.maxRevenueItem) {
      monthData.maxRevenueItem = SKU;
    } else if (
      itemData.revenue > monthData.items[monthData.maxRevenueItem].revenue
    ) {
      monthData.maxRevenueItem = SKU;
    }
  });

  // Calculating popularity (min, max, avg) for the most popular items
  for (const month in monthWise) {
    const monthData = monthWise[month];
    const popularItem = monthData.maxItem;
    const orders = monthData.items[popularItem].orders;

    const minOrders = Math.min(...orders);
    const maxOrders = Math.max(...orders);
    const avgOrders =
      orders.reduce((sum, order) => sum + order, 0) / orders.length;

    popularityStats[month] = {
      item: popularItem,
      minOrders,
      maxOrders,
      avgOrders,
    };
  }

  // Summing the 'orders' array in Month-wise totals
  for (const month in monthWise) {
    const monthData = monthWise[month];
    for (const SKU in monthData.items) {
      const itemData = monthData.items[SKU];
      itemData.orders = itemData.orders.reduce((sum, order) => sum + order, 0);
    }
  }

  return { totalRevenue, monthWise, popularityStats };
}

async function main() {
  const csvData = await fetchCSV();
  const salesData = parseCSV(csvData);
  const result = analyzeSales(salesData);

  // Display results on the page
  document.getElementById(
    "totalRevenue"
  ).innerText = `Total Sales Revenue: ${result.totalRevenue.toLocaleString()}`;

  document.getElementById("monthWiseTotals").innerText = JSON.stringify(
    result.monthWise,
    null,
    2
  );

  document.getElementById("mostPopularItems").innerText = JSON.stringify(
    Object.fromEntries(
      Object.entries(result.monthWise).map(([month, data]) => [
        month,
        data.maxItem,
      ])
    ),
    null,
    2
  );

  document.getElementById("mostRevenueItems").innerText = JSON.stringify(
    Object.fromEntries(
      Object.entries(result.monthWise).map(([month, data]) => [
        month,
        data.maxRevenueItem,
      ])
    ),
    null,
    2
  );

  document.getElementById("popularityStats").innerText = JSON.stringify(
    result.popularityStats,
    null,
    2
  );
}

// Call the main function to start the process
main();
