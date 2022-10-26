// admin-queue.js - Sends orders to a Cloud-Based FIFO Queue

function getSqsOrderData() {

	var orderData = {
		'OrderDateAndTime' : new  Date().toISOString(),
		'CustomerName' : $("#customerName").val(),
		'CustomerPhone': $("#customerPhone").val(),
		'ItemOrdered': $("#itemOrdered").val(),
		'QuantityOrdered': $("#quantityOrdered").val(),
		'PriceEach': $("#priceEach").val()
	};
	var sqsOrderData = {
		MessageAttributes: {
			"OrderDateAndTime": {
				DataType: "String",
				StringValue: orderData.OrderDateAndTime
			},
			"CustomerName": {
					DataType: "String",
					StringValue: orderData.CustomerName
			},
			"CustomerPhone": {
					DataType: "String",
					StringValue: orderData.CustomerPhone
			},
			"QuantityOrdered": {
				DataType: "Number",
				StringValue: orderData.QuantityOrdered
			},
			"ItemOrdered": {
					DataType: "String",
					StringValue: orderData.ItemOrdered
			},
			"PriceEach": {
					DataType: "Number",
					StringValue: orderData.PriceEach
			}
		},
		MessageBody: JSON.stringify(orderData),
		MessageDeduplicationId: new Date().toISOString(),
		MessageGroupId: "CustomerOrders",
		QueueUrl: MY_NEW_FOOD_ORDER_QUEUE_URL
	};

	return sqsOrderData;
}

function isValidOrderData(orderData) {
	var ans = true;
	var orderAttribs = orderData.MessageAttributes;
	if (orderAttribs.CustomerName.StringValue.length < 1) ans = false;
	if (orderAttribs.CustomerPhone.StringValue.length < 1 || 
		orderAttribs.CustomerPhone.StringValue.charAt(0) != "+") {
			ans = false;
	}
	if (orderAttribs.ItemOrdered.StringValue.length < 1) ans = false; 
	if (isNaN(orderAttribs.QuantityOrdered.StringValue)) ans = false;
	if (isNaN(orderAttribs.PriceEach.StringValue)) ans = false; 
	return ans;
}
function textCustomer(e164Phone, textMsg) {
	// Sends a text message - but only erratically
    	SNS.publish({
        	Message: textMsg,
        	PhoneNumber: e164Phone
    	}, function(err, data) {
        	if (err) {
            		console.log(err.stack);
        	} else {
            		console.log(data);
        	}
        	return;
	});
}
function sendOrderToNewFoodOrderQueue() {
	$("#responseArea").val("");
	var sqsOrderData = getSqsOrderData();
	if (!isValidOrderData(sqsOrderData)) {
		$("#responseArea").val("The order is incomplete or the phone format invalid");
	} else {
		var sendSqsMessage = SQS.sendMessage(sqsOrderData).promise();
		sendSqsMessage.then((data) => {
			console.log(`NewOrdersSvc | SUCCESS: ${data.MessageId}`);
			var customerName = sqsOrderData.MessageAttributes.CustomerName.StringValue;
			var itemOrdered = sqsOrderData.MessageAttributes.ItemOrdered.StringValue;
			var customerPhone = sqsOrderData.MessageAttributes.CustomerPhone.StringValue;
			var textMsg = "Thank you " + customerName + " for your " + itemOrdered + " order";
			textCustomer(customerPhone, textMsg);
			textMsg += ". A confirmation was sent to " + customerPhone;
			$("#ordersTable").html(textMsg + "<br />Waiting 15 seconds for queue to flush ...");
			setTimeout(function() { fetchOrders(); }, 15000); // wait 15 seconds
		}).catch((err) => {
			console.log(`NewOrdersSvc | ERROR: ${err}`);
		});
	}
}
