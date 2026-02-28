const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topics: ['order_events', 'payment_events'], fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const data = JSON.parse(message.value.toString());
            console.log(`🔔 Notification Service [${topic}]:`, data);

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

run().catch(console.error);
