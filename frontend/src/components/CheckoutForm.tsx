import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useThemeStore } from "../store/themeStore";

interface CheckoutFormProps {
    clientSecret: string;
    onSuccess: () => void;
    totalAmount: number;
}

export default function CheckoutForm({ clientSecret, onSuccess, totalAmount }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);
    const theme = useThemeStore((state) => state.theme);

    const textColor = theme === 'light' ? '#1a1d23' : '#f8fafc';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            return;
        }

        setIsProcessing(true);
        setCardError(null);

        // In a real application, you would use stripe.confirmCardPayment
        // For our realistic Mock Portfolio version:
        if (clientSecret === "pi_mock_123_secret_mock_456") {
            // Simulate network delay for realism
            setTimeout(() => {
                setIsProcessing(false);
                onSuccess(); // Triggers the actual /orders POST
            }, 1500);
            return;
        }

        // Real Stripe Flow (Fallback if real keys are ever added)
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement)!,
            }
        });

        if (error) {
            setCardError(error.message || "An unknown error occurred");
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            setIsProcessing(false);
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="checkout-form">
            <h3 className="checkout-title">Payment Details ✨</h3>
            <p className="checkout-subtitle">Secure checkout powered by Stripe</p>

            <div className="card-element-container">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: textColor,
                                fontFamily: '"Outfit", sans-serif',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                                iconColor: '#6366f1',
                            },
                            invalid: {
                                color: '#ef4444',
                                iconColor: '#ef4444',
                            },
                        }
                    }}
                />
            </div>

            {cardError && <div className="card-error">{cardError}</div>}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="checkout-btn stripe-pay-btn"
            >
                {isProcessing ? "Processing Payment..." : `Pay ₹${totalAmount.toLocaleString()}`}
            </button>

            <p className="mock-note">
                <strong>Portfolio Note:</strong> This is a mock integration. No real money is captured. You can enter any 4242 4242... test card.
            </p>
        </form>
    );
}
