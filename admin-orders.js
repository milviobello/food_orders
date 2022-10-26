// admin-orders.js - Admins User Interface Events

function addDeliverButton(orderDateAndTime, customerName) {
    return "<button onclick=\"deliverOrder('" + orderDateAndTime + "', '" + customerName + "');\">Deliver</button>";
}

function addDeleteButton(orderDateAndTime, customerName) {
    return "<button onclick=\"deleteOrder('" + orderDateAndTime + "', '" + customerName + "');\">Delete</button>";
}

function addHeaderRow() {
    var headerRow  = "<tr>\n";
    headerRow += "<th>OrderDateAndTime</th>";
    headerRow += "<th>CustomerName</th>";
    headerRow += "<th>QuantityOrdered</th>";
    headerRow += "<th>ItemOrdered</th>";
    headerRow += "<th>PriceEach</th>";
    headerRow += "<th>OrderTotal</th>";
    headerRow += "<th>OrderStatus</th>";
    headerRow += "<th>Action</th>";
    headerRow += "\n</tr>"
    return headerRow;
}

function addOrderRow(order) {
    var orderRow = "<tr>\n";
    orderRow += "<td>" + order.OrderDateAndTime + "</td>";
    orderRow += "<td>" + order.CustomerName + "</td>";
    orderRow += "<td>" + order.QuantityOrdered + "</td>";
    orderRow += "<td>" + order.ItemOrdered + "</td>";
    orderRow += "<td>$" + order.PriceEach.toFixed(2) + "</td>";
    orderRow += "<td>$" + (order.QuantityOrdered * order.PriceEach).toFixed(2) + "</td>";
    orderRow += "<td>" + order.OrderStatus + "</td>";
    orderRow += "<td><nobr>" + addDeliverButton(order.OrderDateAndTime, order.CustomerName);
    orderRow += addDeleteButton(order.OrderDateAndTime, order.CustomerName) + "</nobr></td>";
    orderRow += "\n</tr>"
    return orderRow;
}

function deliverOrder(orderDateAndTime, customerName) {
    var params = {
        "TableName": "MyFoodOrdersTable",
        "Key": {
            "CustomerName": { "S" : customerName },
            "OrderDateAndTime": { "S" : orderDateAndTime }
        },
        UpdateExpression: "set OrderStatus = :orderStatus",
        ExpressionAttributeValues: {
            ":orderStatus": {"S": "DELIVERED"}
        }
    };
    DDB.updateItem(params, function(err, data) {
        if (err) {
            console.log("Error", err);
            $("#responseArea").val(JSON.stringify(err, undefined, 2));
        } else {
            console.log("Success", "Delivered order placed " + orderDateAndTime + " by " + customerName);
            //showOrders(data.Items);
            fetchOrders();
        }
    });
}

function deleteOrder(orderDateAndTime, customerName) {
    let docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        "TableName": "MyFoodOrdersTable",
        "Key": {
            "CustomerName": customerName,
            "OrderDateAndTime": orderDateAndTime
        }
    };
    docClient.delete(params, function(err, data) {
        if (err) {
            console.log("Error", err);
            $("#responseArea").val(JSON.stringify(err, undefined, 2));
        } else {
            console.log("Success", "Deleted order " + orderDateAndTime + " for " + customerName);
            //showOrders(data.Items);
            fetchOrders();
        }
    });
}

function showOrders(orders) {
    orders.sort(function (order1, order2) {
        if (order1.OrderDateAndTime < order2.OrderDateAndTime) return -1;
        if (order1.OrderDateAndTime > order2.OrderDateAndTime) return 1;
    });
    var table = "<table border=\"1\" style=\"text-align:center;\">\n";
    table += addHeaderRow();
    orders.forEach(function(order) {
        table += addOrderRow(order);
    });
    table += "\n</table>"
    $("#ordersTable").html(table);
}

function clearOrders() {
    $("#ordersTable").html("");
}

function fetchOrders() {
    clearOrders();
    var orderStatus = $("#selectOrderStatus").val();
    let docClient = new AWS.DynamoDB.DocumentClient();
    params = {};
    params.TableName = "MyFoodOrdersTable";
    params.IndexName = "CustomerName-OrderStatus-Index";
    if (orderStatus != 'ALL') {
        params.FilterExpression = "OrderStatus = :os";
        params.ExpressionAttributeValues = {":os": orderStatus};
    }
    params.ProjectionExpression = "OrderDateAndTime, CustomerName, QuantityOrdered, ItemOrdered, OrderStatus, PriceEach";
    docClient.scan(params, function(err, data) {
        if (err) {
            console.log("Error", err);
            $("#responseArea").val(JSON.stringify(err, undefined, 2));
        } else {
            console.log("Success", data.Items);
            $("#responseArea").val(JSON.stringify(data, undefined, 2));
            showOrders(data.Items);
        }
    });
}