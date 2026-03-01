const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

const startKafka = async (io) => {
    await consumer.connect();
    await consumer.subscribe({ topics: ['order_events', 'payment_events', 'notification_events'], fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const data = JSON.parse(message.value.toString());
            console.log(`🔔 Notification Service [${topic}]:`, data);

            // Relay to WebSockets
            if (topic === 'notification_events' && data.type === 'LOW_STOCK') {
                console.log(`⚠️ Emitting LOW_STOCK WebSocket event for product ${data.productId}`);
                io.emit('notification', {
                    type: 'LOW_STOCK',
                    title: 'Low Stock Alert',
                    message: data.message,
                    productId: data.productId,
                    productName: data.productName,
                    currentStock: data.currentStock
                });
            }

            // Legacy Email Simulation
            if (topic === 'order_events') {
                console.log(`✉️ Sending Email: Order confirmed for User ${data.userId}`);
            } else if (topic === 'payment_events') {
                if (data.status === 'SUCCESS') {
                    console.log(`✉️ Sending Email: Payment successful for Order ${data.orderId}`);
                } else {
                    console.log(`⚠️ Sending Email: Payment failed for Order ${data.orderId}`);
                }
            }
        },
    });
};

module.exports = { startKafka };
